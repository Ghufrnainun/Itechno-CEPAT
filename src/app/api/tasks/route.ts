import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations/task.schema'
import { taskService } from '@/services/task.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { notificationService } from '@/services/notification.service'

// GET /api/tasks — list tasks dengan filter opsional
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? undefined
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const radiusKm = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 2

    const tasks = await taskService.getTasks({ status, lat, lng, radiusKm })

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('[GET /api/tasks] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data task.' },
      { status: 500 }
    )
  }
}

// POST /api/tasks — buat task baru (requester only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'tasks:create', { maxRequests: 10, windowSeconds: 60 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: 'Terlalu banyak request.' }, { status: 429 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi atau email tidak tersedia.' }, { status: 401 })
    }

    // Ambil user dari Prisma
    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true, nama_lengkap: true, total_balance: true, held_balance: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Validasi body
    const body = await request.json()
    const parsed = createTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    // Cek saldo cukup untuk total escrow (kompensasi × max_applicants)
    const maxApplicants = parsed.data.max_applicants ?? 1;
    const totalEscrowNeeded = parsed.data.kompensasi * maxApplicants;
    const availableBalance = currentUser.total_balance - currentUser.held_balance;
    if (availableBalance < totalEscrowNeeded) {
      return NextResponse.json(
        { success: false, message: `Saldo yang dapat digunakan (${availableBalance.toLocaleString('id-ID')} poin) tidak mencukupi untuk mengunci total escrow ${totalEscrowNeeded.toLocaleString('id-ID')} poin (${maxApplicants} worker × ${parsed.data.kompensasi.toLocaleString('id-ID')} poin).` },
        { status: 400 }
      )
    }

    // Buat task — service.createTask sudah menangani escrow hold secara internal
    const taskId = await taskService.createTask({
      ...parsed.data,
      requesterId: currentUser.id_user,
    })

    // Notifikasi escrow hold ke requester
    try {
      await notificationService.createNotification({
        userId: currentUser.id_user,
        type: 'escrow',
        title: 'Dana Dikunci untuk Tugas 🔒',
        message: `${parsed.data.kompensasi.toLocaleString('id-ID')} poin telah dikunci di escrow untuk task "${parsed.data.judul_tugas}".`,
        data: { task_id: taskId },
      })
    } catch (_) { /* non-blocking */ }

    // Notifikasi broadcast ke worker terdekat (nearby task)
    if (parsed.data.latitude && parsed.data.longitude) {
      try {
        const nearbyWorkers = await prisma.$queryRaw<Array<{ id_user: string }>>`
          SELECT u.id_user
          FROM "User" u
          JOIN "Role" r ON r.id_role = u.id_role
          WHERE r.nama_role = 'Worker'
            AND u.id_user != ${currentUser.id_user}
          LIMIT 20
        `

        await Promise.allSettled(
          nearbyWorkers.map((worker) =>
            notificationService.createNotification({
              userId: worker.id_user,
              type: 'system',
              title: 'Tugas Baru di Sekitarmu! 📍',
              message: `"${parsed.data.judul_tugas}" · Kompensasi: ${parsed.data.kompensasi.toLocaleString('id-ID')} poin. Lamar sekarang!`,
              data: { task_id: taskId },
            })
          )
        )
      } catch (_) { /* non-blocking */ }
    }

    return NextResponse.json(
      { success: true, message: 'Task berhasil dibuat.', data: { id_tasks: taskId } },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[POST /api/tasks] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 })
  }
}

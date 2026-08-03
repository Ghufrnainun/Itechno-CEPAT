import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations/task.schema'
import { taskService } from '@/services/task.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

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
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    // Ambil user dari Prisma
    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true, nama_lengkap: true, total_balance: true },
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

    // Cek saldo cukup
    if (currentUser.total_balance < parsed.data.kompensasi) {
      return NextResponse.json(
        { success: false, message: `Saldo tidak mencukupi. Saldo kamu: ${currentUser.total_balance.toLocaleString('id-ID')} poin.` },
        { status: 400 }
      )
    }

    // Buat task
    const taskId = await taskService.createTask({
      ...parsed.data,
      requesterId: currentUser.id_user,
    })

    // Potong saldo requester (escrow)
    await prisma.user.update({
      where: { id_user: currentUser.id_user },
      data: { total_balance: { decrement: parsed.data.kompensasi } },
    })
    await prisma.transactions.create({
      data: {
        id_user: currentUser.id_user,
        nominal: -parsed.data.kompensasi,
        tipe_transaksi: 'KELUAR',
        deskripsi: `Dana escrow untuk task: ${parsed.data.judul_tugas}`,
      },
    })

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

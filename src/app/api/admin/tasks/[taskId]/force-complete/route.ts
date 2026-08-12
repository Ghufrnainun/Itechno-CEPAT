import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/tasks/[taskId]/force-complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid || !auth.adminId) return unauthorizedResponse()

    const { taskId } = await params

    // Cek task exists, ambil dengan relasi yang dibutuhkan
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        requester: {
          select: { id_user: true, nama_lengkap: true, held_balance: true },
        },
        applicants: {
          where: { status_applicant: { nama_status: { equals: 'ACCEPTED', mode: 'insensitive' } } },
          include: {
            worker: {
              select: { id_user: true, nama_lengkap: true, total_balance: true },
            },
          },
          take: 1,
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task tidak ditemukan.' },
        { status: 404 }
      )
    }

    const currentStatus = task.status_task.nama_status.toLowerCase()

    if (currentStatus === 'completed') {
      return NextResponse.json(
        { success: false, message: 'Task sudah berstatus completed.' },
        { status: 400 }
      )
    }

    if (currentStatus === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Task sudah dibatalkan dan tidak bisa di-force complete.' },
        { status: 400 }
      )
    }

    // Cari status "COMPLETED" case-insensitive
    const completedStatus = await prisma.statusTask.findFirst({
      where: { nama_status: { equals: 'COMPLETED', mode: 'insensitive' } },
    })

    if (!completedStatus) {
      return NextResponse.json(
        { success: false, message: 'Status "COMPLETED" tidak ditemukan di database.' },
        { status: 500 }
      )
    }

    const acceptedWorker = task.applicants[0]?.worker ?? null
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      // 1. Update status task → COMPLETED
      await tx.task.update({
        where: { id_tasks: taskId },
        data: {
          id_status_task: completedStatus.id_status_task,
          completed_at: now,
        },
      })

      // 2. Jika ada worker yang accepted: transfer escrow ke worker
      if (acceptedWorker) {
        const kompensasi = task.kompensasi

        // Kurangi total_balance & held_balance requester
        const heldDeduct = Math.min(task.requester.held_balance, kompensasi)
        await tx.user.update({
          where: { id_user: task.id_requester },
          data: {
            total_balance: { decrement: kompensasi },
            held_balance: { decrement: heldDeduct },
          },
        })

        // Tambah balance worker
        await tx.user.update({
          where: { id_user: acceptedWorker.id_user },
          data: {
            total_balance: { increment: kompensasi },
            total_completed: { increment: 1 },
          },
        })

        // Transaksi: penghasilan worker
        await tx.transactions.create({
          data: {
            id_user: acceptedWorker.id_user,
            nominal: kompensasi,
            tipe_transaksi: 'MASUK',
            sub_type: 'task_earning',
            deskripsi: `Penghasilan dari task (force-complete admin): "${task.judul_tugas}"`,
          },
        })

        // Notifikasi ke worker
        await tx.notifications.create({
          data: {
            user_id: acceptedWorker.id_user,
            type: 'task_completed',
            title: 'Task Diselesaikan oleh Admin ✅',
            message: `Task "${task.judul_tugas}" telah diselesaikan paksa oleh admin. ${kompensasi.toLocaleString('id-ID')} poin telah ditambahkan ke saldo Anda.`,
            data: { task_id: taskId },
          },
        })
      } else {
        // Tidak ada worker — refund held escrow ke requester
        const escrowAmount = task.kompensasi * task.max_applicants
        const actualRefund = Math.min(task.requester.held_balance, escrowAmount)
        if (actualRefund > 0) {
          await tx.user.update({
            where: { id_user: task.id_requester },
            data: {
              held_balance: { decrement: actualRefund },
            },
          })

          await tx.transactions.create({
            data: {
              id_user: task.id_requester,
              nominal: actualRefund,
              tipe_transaksi: 'MASUK',
              sub_type: 'refund',
              deskripsi: `Refund escrow dari task tanpa worker (force-complete admin): "${task.judul_tugas}"`,
            },
          })
        }
      }

      // Notifikasi ke requester
      await tx.notifications.create({
        data: {
          user_id: task.id_requester,
          type: 'task_completed',
          title: 'Task Anda Diselesaikan oleh Admin ✅',
          message: `Task "${task.judul_tugas}" telah ditandai selesai oleh admin platform.`,
          data: { task_id: taskId },
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: `Task "${task.judul_tugas}" berhasil di-force complete.${acceptedWorker ? ` Kompensasi ${task.kompensasi.toLocaleString('id-ID')} poin dikirim ke ${acceptedWorker.nama_lengkap}.` : ' Escrow dikembalikan ke requester.'}`,
    })
  } catch (error) {
    console.error('[POST /api/admin/tasks/[taskId]/force-complete] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

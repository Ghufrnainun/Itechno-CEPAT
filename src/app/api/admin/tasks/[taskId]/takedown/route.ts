import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/tasks/[taskId]/takedown
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid || !auth.adminId) return unauthorizedResponse()

    const { taskId } = await params

    // Cek task exists
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        requester: { select: { id_user: true, nama_lengkap: true, held_balance: true, total_balance: true } },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task tidak ditemukan.' },
        { status: 404 }
      )
    }

    const currentStatus = task.status_task.nama_status.toLowerCase()

    if (currentStatus === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'Task sudah berstatus cancelled.' },
        { status: 400 }
      )
    }

    if (currentStatus === 'completed') {
      return NextResponse.json(
        { success: false, message: 'Task sudah selesai dan tidak dapat ditakedown.' },
        { status: 400 }
      )
    }

    // Cari status "CANCELLED" case-insensitive
    const cancelledStatus = await prisma.statusTask.findFirst({
      where: { nama_status: { equals: 'CANCELLED', mode: 'insensitive' } },
    })

    if (!cancelledStatus) {
      return NextResponse.json(
        { success: false, message: 'Status "CANCELLED" tidak ditemukan di database.' },
        { status: 500 }
      )
    }

    // Jalankan dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      // 1. Update status task → CANCELLED
      await tx.task.update({
        where: { id_tasks: taskId },
        data: { id_status_task: cancelledStatus.id_status_task },
      })

      // 2. Jika ada held_balance (escrow), refund ke requester
      const escrowAmount = task.kompensasi * task.max_applicants
      if (escrowAmount > 0 && task.requester.held_balance >= escrowAmount) {
        await tx.user.update({
          where: { id_user: task.id_requester },
          data: {
            held_balance: { decrement: escrowAmount },
            total_balance: { increment: escrowAmount },
          },
        })

        // Buat record transaksi refund
        await tx.transactions.create({
          data: {
            id_user: task.id_requester,
            nominal: escrowAmount,
            tipe_transaksi: 'MASUK',
            sub_type: 'refund',
            deskripsi: `Refund escrow dari task yang di-takedown admin: "${task.judul_tugas}"`,
          },
        })
      }

      // 3. Notifikasi ke requester
      await tx.notifications.create({
        data: {
          user_id: task.id_requester,
          type: 'system',
          title: 'Task Anda Dihapus oleh Admin ⚠️',
          message: `Task "${task.judul_tugas}" telah dihapus oleh admin platform. Escrow telah dikembalikan ke saldo Anda.`,
          data: { task_id: taskId },
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: `Task "${task.judul_tugas}" berhasil di-takedown dan escrow dikembalikan ke requester.`,
    })
  } catch (error) {
    console.error('[POST /api/admin/tasks/[taskId]/takedown] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

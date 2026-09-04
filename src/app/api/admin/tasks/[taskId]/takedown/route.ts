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

    // Cek task exists beserta pelamar dan statusnya
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        requester: { select: { id_user: true, nama_lengkap: true, held_balance: true, total_balance: true } },
        applicants: {
          include: {
            status_applicant: { select: { nama_status: true } },
            worker: { select: { id_user: true, nama_lengkap: true } },
          },
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

    // Cari status "CANCELLED" dan status applicant "REJECTED"
    const [cancelledStatus, rejectedStatus] = await Promise.all([
      prisma.statusTask.findFirst({
        where: { nama_status: { equals: 'CANCELLED', mode: 'insensitive' } },
      }),
      prisma.statusTaskApplicants.findFirst({
        where: { nama_status: { equals: 'REJECTED', mode: 'insensitive' } },
      }),
    ])

    if (!cancelledStatus || !rejectedStatus) {
      return NextResponse.json(
        { success: false, message: 'Status database (CANCELLED/REJECTED) tidak lengkap.' },
        { status: 500 }
      )
    }

    const activeApplicants = task.applicants.filter((a) => {
      const s = a.status_applicant?.nama_status?.toUpperCase()
      return s === 'ACCEPTED' || s === 'PENDING'
    })
    const acceptedWorkers = task.applicants.filter(
      (a) => a.status_applicant?.nama_status?.toUpperCase() === 'ACCEPTED'
    )

    let actualRefund = 0

    // Jalankan dalam satu transaksi atomik dengan row lock
    await prisma.$transaction(async (tx) => {
      // 0. Pessimistic row locking
      const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string; held_slots_json: string | null }>>`
        SELECT id_status_task, held_slots_json FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE
      `
      if (lockedTask[0]?.id_status_task === cancelledStatus.id_status_task) {
        return
      }

      // 1. Update status task → CANCELLED
      await tx.task.update({
        where: { id_tasks: taskId },
        data: {
          id_status_task: cancelledStatus.id_status_task,
          held_slots_json: null,
        },
      })

      // 2. Tolak seluruh pelamar aktif (ACCEPTED & PENDING)
      if (activeApplicants.length > 0) {
        await tx.taskApplicants.updateMany({
          where: {
            id_tasks: taskId,
            id_status_task_applicants: { not: rejectedStatus.id_status_task_applicants },
          },
          data: {
            id_status_task_applicants: rejectedStatus.id_status_task_applicants,
            alasan_penolakan: 'Tugas telah di-takedown oleh Admin Platform',
            worker_confirmed: false,
          },
        })
      }

      // 3. Kalkulasi refund escrow secara akurat (mendukung task bidding & slot multi-worker)
      const slotMap: Record<string, number> = (() => {
        try {
          return JSON.parse(lockedTask[0]?.held_slots_json ?? task.held_slots_json ?? '{}')
        } catch {
          return {}
        }
      })()

      let totalEscrowToRefund = 0
      for (const workerApp of acceptedWorkers) {
        totalEscrowToRefund +=
          typeof slotMap[workerApp.id_task_applicants] === 'number'
            ? slotMap[workerApp.id_task_applicants]
            : task.kompensasi
      }
      const unfilledSlots = Math.max(0, task.max_applicants - acceptedWorkers.length)
      totalEscrowToRefund += unfilledSlots * task.kompensasi

      actualRefund = Math.min(task.requester.held_balance, totalEscrowToRefund)

      if (actualRefund > 0) {
        await tx.user.update({
          where: { id_user: task.id_requester },
          data: {
            held_balance: { decrement: actualRefund },
          },
        })

        // Buat record transaksi refund
        await tx.transactions.create({
          data: {
            id_user: task.id_requester,
            nominal: actualRefund,
            tipe_transaksi: 'MASUK',
            sub_type: 'refund',
            deskripsi: `Refund escrow takedown admin: "${task.judul_tugas}"`,
          },
        })
      }

      // 4. Notifikasi ke requester
      const notificationMsg =
        actualRefund > 0
          ? `Task "${task.judul_tugas}" telah di-takedown oleh admin platform. Escrow sebesar ${actualRefund.toLocaleString('id-ID')} poin telah dikembalikan ke saldo Anda.`
          : `Task "${task.judul_tugas}" telah di-takedown oleh admin platform.`

      await tx.notifications.create({
        data: {
          user_id: task.id_requester,
          type: 'system',
          title: 'Task Anda Dihapus oleh Admin ⚠️',
          message: notificationMsg,
          data: { task_id: taskId },
        },
      })

      // 5. Notifikasi ke SELURUH pekerja yang sebelumnya diterima (ACCEPTED)
      for (const workerApp of acceptedWorkers) {
        await tx.notifications.create({
          data: {
            user_id: workerApp.id_worker,
            type: 'system',
            title: 'Tugas Dibatalkan oleh Admin ⚠️',
            message: `Tugas "${task.judul_tugas}" telah di-takedown oleh admin platform. Status pengerjaan tugas dibatalkan.`,
            data: { task_id: taskId },
          },
        })
      }
    })

    const responseMsg =
      actualRefund > 0
        ? `Task "${task.judul_tugas}" berhasil di-takedown, lamaran ${activeApplicants.length} pekerja ditolak, dan escrow ${actualRefund.toLocaleString('id-ID')} poin dikembalikan ke requester.`
        : `Task "${task.judul_tugas}" berhasil di-takedown dan lamaran ${activeApplicants.length} pekerja ditolak.`

    return NextResponse.json({
      success: true,
      message: responseMsg,
    })
  } catch (error) {
    console.error('[POST /api/admin/tasks/[taskId]/takedown] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

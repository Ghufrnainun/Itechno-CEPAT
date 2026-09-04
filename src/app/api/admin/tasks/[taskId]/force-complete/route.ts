import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { GamificationService } from '@/services/gamification.service'

// POST /api/admin/tasks/[taskId]/force-complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid || !auth.adminId) return unauthorizedResponse()

    const { taskId } = await params

    // Cek task exists, ambil seluruh accepted applicants tanpa batasan take: 1
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        requester: {
          select: { id_user: true, nama_lengkap: true, total_balance: true, held_balance: true },
        },
        applicants: {
          where: { status_applicant: { nama_status: { equals: 'ACCEPTED', mode: 'insensitive' } } },
          include: {
            worker: {
              select: { id_user: true, nama_lengkap: true, total_balance: true },
            },
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

    const acceptedWorkers = task.applicants
    const now = new Date()

    let totalPaidToWorkers = 0

    await prisma.$transaction(async (tx) => {
      // 0. Row locking untuk mencegah concurrent race condition
      const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string; held_slots_json: string | null }>>`
        SELECT id_status_task, held_slots_json FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE
      `
      if (lockedTask[0]?.id_status_task === completedStatus.id_status_task) {
        throw new Error('Task sudah diselesaikan oleh proses lain.')
      }

      const slotHeldMap: Record<string, number> = (() => {
        try {
          return JSON.parse(lockedTask[0]?.held_slots_json ?? task.held_slots_json ?? '{}') as Record<string, number>
        } catch {
          return {}
        }
      })()

      // 1. Update status task → COMPLETED
      await tx.task.update({
        where: { id_tasks: taskId },
        data: {
          id_status_task: completedStatus.id_status_task,
          completed_at: now,
        },
      })

      // 2. Jika ada worker yang accepted: transfer escrow ke SETIAP worker
      if (acceptedWorkers.length > 0) {
        for (const workerApp of acceptedWorkers) {
          const payoutAmount =
            typeof slotHeldMap[workerApp.id_task_applicants] === 'number'
              ? slotHeldMap[workerApp.id_task_applicants]
              : task.kompensasi

          totalPaidToWorkers += payoutAmount

          // Kurangi total_balance & held_balance requester
          await tx.user.update({
            where: { id_user: task.id_requester },
            data: {
              total_balance: { decrement: payoutAmount },
              held_balance: { decrement: payoutAmount },
            },
          })

          // Tambah balance worker
          await tx.user.update({
            where: { id_user: workerApp.id_worker },
            data: {
              total_balance: { increment: payoutAmount },
              total_completed: { increment: 1 },
            },
          })

          // Transaksi untuk requester
          await tx.transactions.create({
            data: {
              id_user: task.id_requester,
              nominal: payoutAmount,
              tipe_transaksi: 'KELUAR',
              sub_type: 'task_payment',
              deskripsi: `Pembayaran task ke ${workerApp.worker.nama_lengkap} (force-complete admin): "${task.judul_tugas}"`,
            },
          })

          // Transaksi: penghasilan worker
          await tx.transactions.create({
            data: {
              id_user: workerApp.id_worker,
              nominal: payoutAmount,
              tipe_transaksi: 'MASUK',
              sub_type: 'task_earning',
              deskripsi: `Penghasilan dari task (force-complete admin): "${task.judul_tugas}"`,
            },
          })

          // Notifikasi ke worker
          await tx.notifications.create({
            data: {
              user_id: workerApp.id_worker,
              type: 'task_completed',
              title: 'Task Diselesaikan oleh Admin ✅',
              message: `Task "${task.judul_tugas}" telah diselesaikan paksa oleh admin. ${payoutAmount.toLocaleString('id-ID')} poin telah ditambahkan ke saldo Anda.`,
              data: { task_id: taskId },
            },
          })
        }

        // Refund sisa slot tak terpakai jika ada
        const unusedSlots = Math.max(0, task.max_applicants - acceptedWorkers.length)
        if (unusedSlots > 0 && currentStatus === 'open') {
          const refundAmount = unusedSlots * task.kompensasi
          if (refundAmount > 0) {
            await tx.user.update({
              where: { id_user: task.id_requester },
              data: { held_balance: { decrement: refundAmount } },
            })

            await tx.transactions.create({
              data: {
                id_user: task.id_requester,
                nominal: refundAmount,
                tipe_transaksi: 'MASUK',
                sub_type: 'refund',
                deskripsi: `Pengembalian sisa escrow (${unusedSlots} slot tidak terpakai) untuk task (force-complete): ${task.judul_tugas}`,
              },
            })
          }
        }
      } else {
        // Tidak ada worker — refund seluruh held escrow ke requester
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

    // Post-transaction gamification hooks untuk seluruh worker
    for (const workerApp of acceptedWorkers) {
      try {
        await GamificationService.addXP(workerApp.id_worker, 50)
        await GamificationService.updateStreak(workerApp.id_worker)
        await GamificationService.awardStreakBonusXP(workerApp.id_worker)
        await GamificationService.checkAndAwardBadges(workerApp.id_worker)
      } catch (e) {
        console.error('Gamification hook failed in admin force-complete:', e)
      }
    }

    const workerSummary =
      acceptedWorkers.length > 0
        ? ` Total kompensasi ${totalPaidToWorkers.toLocaleString('id-ID')} poin didistribusikan ke ${acceptedWorkers.length} pekerja.`
        : ' Seluruh escrow dikembalikan ke requester.'

    return NextResponse.json({
      success: true,
      message: `Task "${task.judul_tugas}" berhasil di-force complete.${workerSummary}`,
    })
  } catch (error) {
    console.error('[POST /api/admin/tasks/[taskId]/force-complete] Error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

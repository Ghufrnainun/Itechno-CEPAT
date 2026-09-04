import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/services/notification.service'
import { taskService } from '@/services/task.service'

/**
 * GET /api/cron/notifications
 * 
 * Endpoint cron untuk mengirimkan notifikasi berkala:
 * 1. Review Reminder — ingatkan user yang belum review setelah 24 jam task selesai
 * 2. Unfilled Task Alert — ingatkan requester jika task belum ada pelamar setelah 24 jam
 * 3. Low Balance Warning — peringatan saldo rendah untuk requester aktif
 * 
 * Dipanggil oleh Vercel Cron, Supabase Edge Function, atau scheduler eksternal.
 * Proteksi via CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Proteksi endpoint cron dengan secret key
  const cronSecret = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    reviewReminders: 0,
    unfilledTaskAlerts: 0,
    autoCancelledTasks: 0,
    lowBalanceWarnings: 0,
  }

  // ─── 1. Review Reminder (24 jam setelah task selesai) ────────────────────────
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

    // Ambil task yang selesai 24-48 jam lalu
    const completedTasks = await prisma.task.findMany({
      where: {
        status_task: { nama_status: 'COMPLETED' },
        completed_at: {
          gte: fortyEightHoursAgo,
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        requester: { select: { id_user: true, nama_lengkap: true } },
        applicants: {
          where: { status_applicant: { nama_status: 'ACCEPTED' } },
          include: { worker: { select: { id_user: true, nama_lengkap: true } } },
          take: 1,
        },
        reviews: { select: { id_rater: true } },
      },
    })

    for (const task of completedTasks) {
      const acceptedWorker = task.applicants[0]
      if (!acceptedWorker) continue

      const reviewerIds = task.reviews.map((r) => r.id_rater)

      // Cek apakah requester sudah review
      if (!reviewerIds.includes(task.requester.id_user)) {
        try {
          // Cek apakah reminder sudah pernah dikirim
          const existingReminder = await prisma.notifications.findFirst({
            where: {
              user_id: task.requester.id_user,
              type: 'reminder',
              data: { path: ['task_id'], equals: task.id_tasks },
            },
          })
          if (!existingReminder) {
            await notificationService.createNotification({
              userId: task.requester.id_user,
              type: 'reminder',
              title: 'Jangan Lupa Beri Ulasan! ⭐',
              message: `Kamu belum memberikan ulasan untuk ${acceptedWorker.worker.nama_lengkap} di task "${task.judul_tugas}". Rating membantu komunitas CEPAT!`,
              data: { task_id: task.id_tasks, reviewee_id: acceptedWorker.id_worker },
            })
            results.reviewReminders++
          }
        } catch (_) { /* non-blocking */ }
      }

      // Cek apakah worker sudah review
      if (!reviewerIds.includes(acceptedWorker.id_worker)) {
        try {
          const existingReminder = await prisma.notifications.findFirst({
            where: {
              user_id: acceptedWorker.id_worker,
              type: 'reminder',
              data: { path: ['task_id'], equals: task.id_tasks },
            },
          })
          if (!existingReminder) {
            await notificationService.createNotification({
              userId: acceptedWorker.id_worker,
              type: 'reminder',
              title: 'Jangan Lupa Beri Ulasan! ⭐',
              message: `Kamu belum memberikan ulasan untuk ${task.requester.nama_lengkap} di task "${task.judul_tugas}". Rating membantu komunitas CEPAT!`,
              data: { task_id: task.id_tasks, reviewee_id: task.requester.id_user },
            })
            results.reviewReminders++
          }
        } catch (_) { /* non-blocking */ }
      }
    }
  } catch (error) {
    console.error('[Cron] Review reminder error:', error)
  }

  // ─── 2. Unfilled Task Alert (Task open > 24 jam tanpa pelamar) ──────────────
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const unfilledTasks = await prisma.task.findMany({
      where: {
        status_task: { nama_status: 'OPEN' },
        created_at: { lte: twentyFourHoursAgo },
        applicants: { none: {} },
      },
      include: {
        requester: { select: { id_user: true } },
      },
    })

    for (const task of unfilledTasks) {
      try {
        // Cek apakah alert sudah pernah dikirim
        const existingAlert = await prisma.notifications.findFirst({
          where: {
            user_id: task.requester.id_user,
            type: 'system',
            title: 'Tugas Belum Ada Pelamar 📢',
            data: { path: ['task_id'], equals: task.id_tasks },
          },
        })
        if (!existingAlert) {
          await notificationService.createNotification({
            userId: task.requester.id_user,
            type: 'system',
            title: 'Tugas Belum Ada Pelamar 📢',
            message: `Task "${task.judul_tugas}" sudah 24 jam belum ada yang melamar. Pertimbangkan untuk menaikkan kompensasi atau memperbarui deskripsinya.`,
            data: { task_id: task.id_tasks },
          })
          results.unfilledTaskAlerts++
        }
      } catch (_) { /* non-blocking */ }
    }
  } catch (error) {
    console.error('[Cron] Unfilled task alert error:', error)
  }

  // ─── 2.5 Auto-Cancel Expired Tasks (Refund Escrow yang Tertahan) ────────────
  try {
    // Cari task yang masih OPEN dan melewati scheduled_end, atau umurnya > 7 hari jika tak ada scheduled_end
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredTasks = await prisma.task.findMany({
      where: {
        status_task: { nama_status: { equals: 'open', mode: 'insensitive' } },
        OR: [
          { scheduled_end: { lt: new Date() } },
          { scheduled_end: null, created_at: { lt: sevenDaysAgo } }
        ]
      },
      select: { id_tasks: true, id_requester: true }
    });

    for (const task of expiredTasks) {
      try {
        await taskService.updateTaskStatus(task.id_tasks, task.id_requester, 'cancelled');
        results.autoCancelledTasks++;
      } catch (error) {
        console.error(`[Cron] Auto-cancel task ${task.id_tasks} error:`, error);
      }
    }
  } catch (error) {
    console.error('[Cron] Auto-cancel tasks error:', error);
  }

  // ─── 3. Low Balance Warning (Saldo < 5000 untuk requester aktif) ────────────
  try {
    const lowBalanceThreshold = 5000

    const lowBalanceUsers = await prisma.user.findMany({
      where: {
        total_balance: { lt: lowBalanceThreshold, gt: 0 },
        role: { nama_role: 'Requester' },
      },
      select: { id_user: true, total_balance: true, nama_lengkap: true },
    })

    for (const user of lowBalanceUsers) {
      try {
        // Cek apakah warning sudah dikirim dalam 7 hari terakhir
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const existingWarning = await prisma.notifications.findFirst({
          where: {
            user_id: user.id_user,
            type: 'system',
            title: 'Saldo Rendah ⚠️',
            created_at: { gte: sevenDaysAgo },
          },
        })
        if (!existingWarning) {
          await notificationService.createNotification({
            userId: user.id_user,
            type: 'system',
            title: 'Saldo Rendah ⚠️',
            message: `Saldo kamu tinggal ${user.total_balance.toLocaleString('id-ID')} poin. Top up sekarang agar tetap bisa membuat tugas baru!`,
            data: { current_balance: user.total_balance },
          })
          results.lowBalanceWarnings++
        }
      } catch (_) { /* non-blocking */ }
    }
  } catch (error) {
    console.error('[Cron] Low balance warning error:', error)
  }

  // ─── 4. Auto-Purge Notifikasi Lama (> 60 hari) ────────────────────────────
  let purgedCount = 0
  try {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const purged = await prisma.notifications.deleteMany({
      where: {
        created_at: { lt: sixtyDaysAgo },
        is_read: true,
      },
    })
    purgedCount = purged.count
  } catch (error) {
    console.error('[Cron] Auto-purge error:', error)
  }

  // ─── 5. Auto-Purge XPLog Lama (> 1 tahun) ──────────────────────────────────
  let purgedXpLogsCount = 0
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const purgedXp = await prisma.xPLog.deleteMany({
      where: { created_at: { lt: oneYearAgo } },
    })
    purgedXpLogsCount = purgedXp.count
  } catch (error) {
    console.error('[Cron] XPLog purge error:', error)
  }

  return NextResponse.json({
    success: true,
    message: 'Cron notifications processed.',
    data: { ...results, purgedOldNotifications: purgedCount, purgedOldXPLogs: purgedXpLogsCount },
  })
}

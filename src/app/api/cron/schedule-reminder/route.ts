import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification.service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // Cari tugas aktif yang dijadwalkan dalam 24 jam ke depan
    const upcomingTasks = await prisma.task.findMany({
      where: {
        scheduled_at: {
          gte: now,
          lte: in24Hours,
        },
        status_task: {
          nama_status: { in: ['OPEN', 'ACCEPTED', 'IN_PROGRESS'] },
        },
      },
      include: {
        requester: { select: { id_user: true, nama_lengkap: true } },
        applicants: {
          where: {
            status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
          },
          include: {
            worker: { select: { id_user: true, nama_lengkap: true } },
          },
        },
      },
    });

    let remindersSent = 0;

    for (const task of upcomingTasks) {
      if (!task.scheduled_at) continue;
      const scheduledTime = new Date(task.scheduled_at).getTime();
      const timeDiffHours = (scheduledTime - now.getTime()) / (1000 * 60 * 60);
      const reminderWindow = timeDiffHours <= 1.5 ? '1h' : '24h';

      const timeLabel =
        timeDiffHours <= 1.5
          ? 'segera dalam 1 jam'
          : `pada ${new Date(task.scheduled_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}`;

      // Idempotency: Cek apakah reminder untuk window ini sudah pernah dikirim ke Requester
      const alreadySentReq = await prisma.notifications.findFirst({
        where: {
          user_id: task.id_requester,
          type: 'reminder',
          created_at: { gte: new Date(now.getTime() - (timeDiffHours <= 1.5 ? 2 : 24) * 60 * 60 * 1000) },
          data: {
            path: ['taskId'],
            equals: task.id_tasks,
          },
        },
      });

      if (!alreadySentReq) {
        await notificationService.createNotification({
          userId: task.id_requester,
          type: 'reminder',
          title: '⏰ Pengingat Jadwal Tugas',
          message: `Tugas "${task.judul_tugas}" dijadwalkan ${timeLabel}. Pastikan Anda siap memantau progresnya.`,
          data: { taskId: task.id_tasks, window: reminderWindow, scheduled_at: task.scheduled_at.toISOString() },
        });
        remindersSent++;
      }

      // Reminder ke Worker (jika sudah ada worker yang diterima)
      const acceptedWorker = task.applicants[0]?.worker;
      if (acceptedWorker) {
        const alreadySentWorker = await prisma.notifications.findFirst({
          where: {
            user_id: acceptedWorker.id_user,
            type: 'reminder',
            created_at: { gte: new Date(now.getTime() - (timeDiffHours <= 1.5 ? 2 : 24) * 60 * 60 * 1000) },
            data: {
              path: ['taskId'],
              equals: task.id_tasks,
            },
          },
        });

        if (!alreadySentWorker) {
          await notificationService.createNotification({
            userId: acceptedWorker.id_user,
            type: 'reminder',
            title: '⏰ Pengingat Tugas Terjadwal',
            message: `Tugas "${task.judul_tugas}" dari ${task.requester.nama_lengkap} dijadwalkan ${timeLabel}. Siapkan diri Anda!`,
            data: { taskId: task.id_tasks, window: reminderWindow, scheduled_at: task.scheduled_at.toISOString() },
          });
          remindersSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ${upcomingTasks.length} tugas terjadwal. ${remindersSent} pengingat terkirim.`,
      remindersSent,
      totalChecked: upcomingTasks.length,
    });
  } catch (error) {
    console.error('[GET /api/cron/schedule-reminder] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses cron pengingat jadwal.' },
      { status: 500 }
    );
  }
}

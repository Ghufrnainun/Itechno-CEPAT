import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase/admin'
import { Prisma } from '@prisma/client'

export interface CreateNotificationParams {
  userId: string
  type: 'apply' | 'accept' | 'reject' | 'cancel' | 'progress' | 'points' | 'review' | 'system' | 'welcome' | 'escrow' | 'chat' | 'reminder' | 'milestone' | 'topup'
  title: string
  message: string
  data?: Record<string, unknown>
}

export const notificationService = {
  /**
   * Membuat entri notifikasi baru di database dan mengirimkan Push Notification via FCM jika fcm_token tersedia
   */
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, data } = params

    // 1. Simpan ke database Notifications (Prisma)
    const notification = await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
        is_read: false,
      },
    })

    // 2. Kirim FCM Push Notification (Fire and forget, error diswallow agar tidak memblokir DB flow)
    try {
      const user = await prisma.user.findUnique({
        where: { id_user: userId },
        select: { fcm_token: true },
      })

      if (user?.fcm_token) {
        const success = await sendPushNotification({
          token: user.fcm_token,
          title,
          body: message,
          data: {
            notification_id: notification.id_notifications,
            type,
            ...(data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])) : {}),
          },
        })

        // Jika FCM gagal (token expired/invalid), hapus token agar tidak retry terus
        if (!success) {
          try {
            await prisma.user.update({
              where: { id_user: userId },
              data: { fcm_token: null },
            })
            console.warn(`[notificationService] Stale FCM token cleared for user ${userId}`)
          } catch (_) { /* non-blocking */ }
        }
      }
    } catch (fcmError) {
      console.warn('[notificationService.createNotification] Push FCM skipped or failed:', fcmError)
    }

    return notification
  },

  /**
   * Mengambil daftar notifikasi milik user terautentikasi
   */
  async getUserNotifications(userId: string, unreadOnly = false, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const adminTypes = ['user_report', 'report', 'dispute', 'admin', 'admin_alert']

    const whereCondition = {
      user_id: userId,
      type: { notIn: adminTypes },
      ...(unreadOnly ? { is_read: false } : {}),
    }

    const unreadWhereCondition = {
      user_id: userId,
      type: { notIn: adminTypes },
      is_read: false,
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notifications.count({ where: whereCondition }),
      prisma.notifications.count({
        where: unreadWhereCondition,
      }),
    ])

    return {
      notifications: notifications.map((n) => ({
        id: n.id_notifications,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data as Record<string, unknown> | null,
        isRead: n.is_read,
        createdAt: n.created_at,
      })),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Tandai 1 notifikasi sebagai dibaca (is_read = true)
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notifications.findFirst({
      where: {
        id_notifications: notificationId,
        user_id: userId,
      },
    })

    if (!notification) {
      throw new Error('Notifikasi tidak ditemukan.')
    }

    return prisma.notifications.update({
      where: { id_notifications: notificationId },
      data: { is_read: true },
    })
  },

  /**
   * Tandai semua notifikasi milik user sebagai dibaca
   */
  async markAllAsRead(userId: string) {
    return prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    })
  },
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/notifications
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const adminTypes = ['user_report', 'report', 'dispute', 'admin', 'admin_alert']

    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: auth.adminId,
        type: { in: adminTypes },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    const unreadCount = await prisma.notifications.count({
      where: {
        user_id: auth.adminId,
        type: { in: adminTypes },
        is_read: false,
      },
    })

    const formattedNotifications = notifications.map((n) => ({
      id: n.id_notifications,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data as Record<string, any> | null,
      is_read: n.is_read,
      created_at: n.created_at.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: formattedNotifications,
      unreadCount,
    })
  } catch (error) {
    console.error('[GET /api/admin/notifications] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/notifications (Mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const body = await request.json().catch(() => ({}))
    const { notificationId } = body

    if (notificationId) {
      await prisma.notifications.update({
        where: { id_notifications: notificationId },
        data: { is_read: true },
      })
    } else {
      // Mark all as read for this admin (only admin notification types)
      const adminTypes = ['user_report', 'report', 'dispute', 'admin', 'admin_alert']
      await prisma.notifications.updateMany({
        where: {
          user_id: auth.adminId,
          type: { in: adminTypes },
          is_read: false,
        },
        data: { is_read: true },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi telah ditandai sebagai dibaca.',
    })
  } catch (error) {
    console.error('[PATCH /api/admin/notifications] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

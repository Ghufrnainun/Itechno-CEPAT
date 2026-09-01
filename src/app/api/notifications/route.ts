import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/services/notification.service'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth Check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    // 2. Ambil User ID dari Prisma
    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 3. Query params
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // 4. Fetch notifikasi via Service
    const result = await notificationService.getUserNotifications(
      currentUser.id_user,
      unreadOnly,
      page,
      limit
    )

    return NextResponse.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}

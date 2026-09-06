import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'api:xp', {
      maxRequests: 60,
      windowSeconds: 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan.' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: {
        id_user: true,
        xp: true,
        level: true,
        user_streak: {
          select: {
            current_streak: true,
            longest_streak: true,
            last_activity_date: true,
          },
        },
        user_badges: {
          include: {
            badge: true,
          },
          orderBy: {
            earned_at: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    const nextLevelXP = user.level ** 2 * 100
    const currentLevelBaseXP = (user.level - 1) ** 2 * 100
    const xpNeededForNextLevel = Math.max(0, nextLevelXP - user.xp)

    // Ambil 10 riwayat XP terbaru
    const recentXPLogs = await prisma.xPLog.findMany({
      where: { id_user: user.id_user },
      orderBy: { created_at: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        level: user.level,
        xp: user.xp,
        current_level_base_xp: currentLevelBaseXP,
        next_level_xp: nextLevelXP,
        xp_needed: xpNeededForNextLevel,
        streak: user.user_streak || {
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
        },
        badges: user.user_badges.map((ub) => ({
          earned_at: ub.earned_at,
          ...ub.badge,
        })),
        history: recentXPLogs.map((log) => ({
          id: log.id_xp_log,
          xp_amount: log.xp_amount,
          source: log.source,
          created_at: log.created_at,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/xp] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data gamifikasi.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { walletService } from '@/services/wallet.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'api:wallet', {
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
      select: { id_user: true },
    })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    const [balance, history] = await Promise.all([
      walletService.getBalance(user.id_user),
      walletService.getHistory(user.id_user, page, limit),
    ])

    return NextResponse.json({
      success: true,
      data: {
        balance: balance.balance,
        held_balance: balance.held_balance,
        total_balance: balance.total_balance,
        transactions: history.transactions,
        pagination: history.pagination,
      },
    })
  } catch (error) {
    console.error('[GET /api/wallet] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data wallet.' },
      { status: 500 }
    )
  }
}

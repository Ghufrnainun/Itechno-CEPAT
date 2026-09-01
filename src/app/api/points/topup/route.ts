import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { walletService } from '@/services/wallet.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

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

    // Rate Limiting on topup attempts
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'points:topup', {
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak percobaan top-up. Coba lagi dalam 1 menit.' },
        { status: 429 }
      )
    }

    // Production environment check — require Midtrans unless explicit mock topup flag enabled for judging demo
    const isProduction = process.env.NODE_ENV === 'production'
    const allowMockInProd = process.env.ALLOW_MOCK_TOPUP === 'true'
    if (isProduction && !allowMockInProd) {
      return NextResponse.json(
        { success: false, message: 'Simulasi top-up dinonaktifkan di production. Gunakan pembayaran Midtrans.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const amount = parseInt(String(body.amount), 10)

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal top-up tidak valid. Harus berupa angka positif.' },
        { status: 400 }
      )
    }

    if (amount > 1_000_000) {
      return NextResponse.json(
        { success: false, message: 'Nominal simulasi top-up maksimal Rp 1.000.000 per transaksi.' },
        { status: 400 }
      )
    }

    const updatedBalance = await walletService.topUp(currentUser.id_user, amount)

    return NextResponse.json({
      success: true,
      message: `Top up Rp ${amount.toLocaleString('id-ID')} berhasil.`,
      data: updatedBalance,
    })
  } catch (error) {
    console.error('[POST /api/points/topup] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan top-up saldo.' },
      { status: 500 }
    )
  }
}

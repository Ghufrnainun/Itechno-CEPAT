import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createSnapTransaction, getClientKey } from '@/lib/midtrans'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

/**
 * POST /api/payment/create
 * Buat Snap Transaction untuk topup via Midtrans.
 * Return snap_token + client_key untuk embed Snap.js di frontend.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'payment:create', {
      maxRequests: 10,
      windowSeconds: 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
      )
    }

    // Auth check
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

    // Get user by canonical auth_id
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth_id: authUser.id },
          ...(authUser.email ? [{ email: authUser.email }] : [])
        ]
      },
      select: { id_user: true, nama_lengkap: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Strict integer validation for amount
    const body = await request.json()
    const rawAmount = body.amount

    if (typeof rawAmount !== 'number' || !Number.isInteger(rawAmount) || rawAmount < 1000) {
      return NextResponse.json(
        { success: false, message: 'Nominal minimal Rp1.000 (harus berupa bilangan bulat).' },
        { status: 400 }
      )
    }

    if (rawAmount > 10_000_000) {
      return NextResponse.json(
        { success: false, message: 'Nominal maksimal Rp10.000.000 per transaksi.' },
        { status: 400 }
      )
    }

    const amount = rawAmount

    // Generate unique order ID
    const orderId = `TOPUP-${currentUser.id_user.slice(0, 8)}-${Date.now()}`

    // 1. Persist payment intent to DB as PENDING FIRST before external gateway call
    await prisma.paymentTransaction.create({
      data: {
        id_user: currentUser.id_user,
        order_id: orderId,
        amount,
        status: 'PENDING',
      },
    })

    // 2. Create Snap transaction with gateway
    try {
      const snapResult = await createSnapTransaction({
        orderId,
        amount,
        userName: currentUser.nama_lengkap,
        userEmail: currentUser.email,
      })

      // 3. Update with snap_token & redirect_url
      await prisma.paymentTransaction.update({
        where: { order_id: orderId },
        data: {
          snap_token: snapResult.token,
          redirect_url: snapResult.redirect_url,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          snap_token: snapResult.token,
          redirect_url: snapResult.redirect_url,
          client_key: getClientKey(),
          order_id: orderId,
        },
      })
    } catch (gatewayError) {
      // If gateway call fails, mark the pending intent as FAILED
      await prisma.paymentTransaction.update({
        where: { order_id: orderId },
        data: { status: 'FAILED' },
      }).catch(() => {})
      throw gatewayError
    }
  } catch (error) {
    console.error('[POST /api/payment/create] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal membuat transaksi pembayaran.' },
      { status: 500 }
    )
  }
}

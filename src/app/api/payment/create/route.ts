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

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

    // Get user
    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true, nama_lengkap: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Validate body
    const body = await request.json()
    const amount = parseInt(String(body.amount), 10)

    if (isNaN(amount) || amount < 1000) {
      return NextResponse.json(
        { success: false, message: 'Nominal minimal Rp1.000.' },
        { status: 400 }
      )
    }

    if (amount > 10_000_000) {
      return NextResponse.json(
        { success: false, message: 'Nominal maksimal Rp10.000.000 per transaksi.' },
        { status: 400 }
      )
    }

    // Generate unique order ID
    const orderId = `TOPUP-${currentUser.id_user.slice(0, 8)}-${Date.now()}`

    // Create Snap transaction
    const snapResult = await createSnapTransaction({
      orderId,
      amount,
      userName: currentUser.nama_lengkap,
      userEmail: currentUser.email,
    })

    // Save to DB as PENDING
    await prisma.paymentTransaction.create({
      data: {
        id_user: currentUser.id_user,
        order_id: orderId,
        amount,
        snap_token: snapResult.token,
        redirect_url: snapResult.redirect_url,
        status: 'PENDING',
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
  } catch (error) {
    console.error('[POST /api/payment/create] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal membuat transaksi pembayaran.' },
      { status: 500 }
    )
  }
}

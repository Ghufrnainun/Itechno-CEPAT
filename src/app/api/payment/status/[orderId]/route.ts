import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus } from '@/lib/midtrans'
import { walletService } from '@/services/wallet.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

/**
 * GET /api/payment/status/[orderId]
 * Manual check status pembayaran — fallback kalau webhook gak jalan (localhost).
 * Hit Midtrans Core API langsung untuk cek status terbaru.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'payment:status', {
      maxRequests: 30,
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

    // Find payment
    const payment = await prisma.paymentTransaction.findUnique({
      where: { order_id: orderId },
    })

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Pembayaran tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Verify ownership — use auth UUID (always present) rather than email (can be undefined for OAuth users)
    if (payment.id_user !== authUser.id) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak.' },
        { status: 403 }
      )
    }

    // If already processed, return current status
    if (payment.status !== 'PENDING') {
      return NextResponse.json({
        success: true,
        data: {
          order_id: payment.order_id,
          status: payment.status,
          amount: payment.amount,
          payment_type: payment.payment_type,
        },
      })
    }

    // Check status from Midtrans API
    try {
      const midtransStatus = await getTransactionStatus(orderId)
      const { transaction_status, fraud_status, payment_type } = midtransStatus

      console.log(`[Payment Status Check] Order: ${orderId}, Status: ${transaction_status}, Fraud: ${fraud_status}, Type: ${payment_type}`)

      if (
        transaction_status === 'settlement' ||
        (transaction_status === 'capture' && fraud_status === 'accept')
      ) {
        // SUCCESS — update DB + topup saldo via atomic CAS transaction
        const isWinner = await prisma.$transaction(async (tx) => {
          const count = await tx.$executeRaw`
            UPDATE "PaymentTransaction"
            SET status = 'SUCCESS',
                payment_type = ${payment_type},
                midtrans_response = ${JSON.stringify(midtransStatus)}::jsonb,
                updated_at = NOW()
            WHERE order_id = ${orderId} AND status = 'PENDING'
          `

          if (Number(count) === 0) {
            return false // Sudah diproses oleh webhook paralel
          }

          // Catat transaksi saldo masuk
          await tx.transactions.create({
            data: {
              id_user: payment.id_user,
              nominal: payment.amount,
              tipe_transaksi: 'MASUK',
              sub_type: 'topup',
              deskripsi: `Top Up Saldo via Midtrans (${payment.order_id})`,
            },
          })

          // Tambah total_balance user
          await tx.user.update({
            where: { id_user: payment.id_user },
            data: { total_balance: { increment: payment.amount } },
          })

          return true
        })

        if (isWinner) {
          console.log(`[Payment Status Check] Saldo updated for user ${payment.id_user}: +${payment.amount}`)
        } else {
          console.log(`[Payment Status Check] Order ${orderId} already credited by webhook.`)
        }

        return NextResponse.json({
          success: true,
          data: {
            order_id: orderId,
            status: 'SUCCESS',
            amount: payment.amount,
            payment_type,
          },
        })
      } else if (
        transaction_status === 'deny' ||
        transaction_status === 'cancel' ||
        transaction_status === 'failure'
      ) {
        await prisma.paymentTransaction.update({
          where: { order_id: orderId },
          data: { status: 'FAILED', payment_type, midtrans_response: midtransStatus },
        })

        return NextResponse.json({
          success: true,
          data: { order_id: orderId, status: 'FAILED', amount: payment.amount },
        })
      } else if (transaction_status === 'expire') {
        await prisma.paymentTransaction.update({
          where: { order_id: orderId },
          data: { status: 'EXPIRED', payment_type, midtrans_response: midtransStatus },
        })

        return NextResponse.json({
          success: true,
          data: { order_id: orderId, status: 'EXPIRED', amount: payment.amount },
        })
      }

      // Still pending
      return NextResponse.json({
        success: true,
        data: {
          order_id: orderId,
          status: 'PENDING',
          amount: payment.amount,
        },
      })
    } catch (midtransErr) {
      console.error('[Payment Status Check] Midtrans API Error:', midtransErr)
      // Midtrans API error — return current DB status
      return NextResponse.json({
        success: true,
        data: {
          order_id: payment.order_id,
          status: payment.status,
          amount: payment.amount,
        },
      })
    }
  } catch (error) {
    console.error('[GET /api/payment/status] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengecek status pembayaran.' },
      { status: 500 }
    )
  }
}

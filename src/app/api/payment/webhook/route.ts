import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifySignatureKey, type MidtransNotification } from '@/lib/midtrans'
import { walletService } from '@/services/wallet.service'

/**
 * POST /api/payment/webhook
 * Handle Midtrans notification callback.
 * Midtrans akan hit endpoint ini setiap ada perubahan status pembayaran.
 *
 * PENTING: Endpoint ini TIDAK pakai auth check karena dipanggil oleh Midtrans server.
 */
export async function POST(request: NextRequest) {
  try {
    const notification: MidtransNotification = await request.json()

    console.log('[Midtrans Webhook] Received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
    })

    // Verify signature
    if (!verifySignatureKey(notification)) {
      console.error('[Midtrans Webhook] Invalid signature for order:', notification.order_id)
      return NextResponse.json(
        { success: false, message: 'Invalid signature.' },
        { status: 403 }
      )
    }

    // Find the payment transaction
    const payment = await prisma.paymentTransaction.findUnique({
      where: { order_id: notification.order_id },
    })

    if (!payment) {
      console.error('[Midtrans Webhook] Payment not found:', notification.order_id)
      return NextResponse.json(
        { success: false, message: 'Payment not found.' },
        { status: 404 }
      )
    }

    // Skip if already processed
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'Already processed.' })
    }

    const { transaction_status, fraud_status, payment_type } = notification

    // Handle transaction status
    if (
      transaction_status === 'capture' ||
      transaction_status === 'settlement'
    ) {
      // For credit card: check fraud status
      if (transaction_status === 'capture' && fraud_status !== 'accept') {
        await prisma.paymentTransaction.update({
          where: { order_id: notification.order_id },
          data: {
            status: 'FAILED',
            payment_type,
            midtrans_response: JSON.parse(JSON.stringify(notification)) as Prisma.InputJsonValue,
          },
        })
        return NextResponse.json({ success: true, message: 'Fraud detected.' })
      }

      // SUCCESS — Topup saldo via walletService
      await prisma.paymentTransaction.update({
        where: { order_id: notification.order_id },
        data: {
          status: 'SUCCESS',
          payment_type,
          midtrans_response: JSON.parse(JSON.stringify(notification)) as Prisma.InputJsonValue,
        },
      })

      // Reuse existing walletService.topUp — atomic increment balance + log transaction
      await walletService.topUp(payment.id_user, payment.amount)

      console.log(
        `[Midtrans Webhook] SUCCESS: ${notification.order_id} — Rp${payment.amount.toLocaleString('id-ID')}`
      )
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'failure'
    ) {
      await prisma.paymentTransaction.update({
        where: { order_id: notification.order_id },
        data: {
          status: 'FAILED',
          payment_type,
          midtrans_response: JSON.parse(JSON.stringify(notification)) as Prisma.InputJsonValue,
        },
      })
    } else if (transaction_status === 'expire') {
      await prisma.paymentTransaction.update({
        where: { order_id: notification.order_id },
        data: {
          status: 'EXPIRED',
          payment_type,
          midtrans_response: JSON.parse(JSON.stringify(notification)) as Prisma.InputJsonValue,
        },
      })
    }
    // 'pending' status — no action needed, payment stays PENDING

    // Midtrans requires 200 OK response
    return NextResponse.json({ success: true, message: 'OK' })
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error)
    // Still return 200 to prevent Midtrans from retrying indefinitely
    return NextResponse.json({ success: true, message: 'Error handled.' })
  }
}

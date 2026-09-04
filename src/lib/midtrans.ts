/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Midtrans Snap integration — Sandbox mode for MVP/Demo.
 *
 * Docs: https://docs.midtrans.com/reference/snap-api
 */

// midtrans-client doesn't ship ESM, so we need require
const midtransClient = require('midtrans-client')

// ─── Environment ────────────────────────────────────────────────────────────

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? ''
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? ''
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

if (!SERVER_KEY) {
  console.warn('[Midtrans] MIDTRANS_SERVER_KEY belum di-set di .env')
}

// ─── Snap Client (singleton) ────────────────────────────────────────────────

const snap = new midtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
})

// ─── Core API Client (untuk status check) ───────────────────────────────────

const coreApi = new midtransClient.CoreApi({
  isProduction: IS_PRODUCTION,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
})

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SnapTransactionResult {
  token: string
  redirect_url: string
}

export interface MidtransNotification {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status?: string
  currency: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Buat Snap Transaction untuk topup.
 * Return snap token + redirect_url.
 */
export async function createSnapTransaction(params: {
  orderId: string
  amount: number
  userName: string
  userEmail: string
}): Promise<SnapTransactionResult> {
  const { orderId, amount, userName, userEmail } = params

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: userName,
      email: userEmail,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/wallet?payment=finish`,
      error: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/wallet?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/wallet?payment=pending`,
    },
  }

  const transaction = await snap.createTransaction(parameter)

  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  }
}

/**
 * Verify Midtrans webhook notification signature.
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignatureKey(notification: MidtransNotification): boolean {
  if (!notification.signature_key) return false

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHash('sha512')
    .update(
      notification.order_id +
        notification.status_code +
        notification.gross_amount +
        SERVER_KEY
    )
    .digest('hex')

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8')
  const actualBuf = Buffer.from(notification.signature_key, 'utf-8')

  return (
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf)
  )
}

/**
 * Check transaction status via Core API (fallback kalau webhook gak jalan).
 */
export async function getTransactionStatus(orderId: string) {
  return coreApi.transaction.status(orderId)
}

/**
 * Client key untuk di-expose ke frontend (Snap.js embed).
 */
export function getClientKey(): string {
  return CLIENT_KEY
}

import { NextRequest, NextResponse } from 'next/server'
import { GET as getPaymentStatusByOrderId } from './[orderId]/route'

/**
 * GET /api/payment/status?order_id=...
 * Mendukung query parameter order_id (kompatibilitas dengan Postman & client eksternal).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id') || searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json(
      { success: false, message: 'Parameter order_id wajib diisi.' },
      { status: 400 }
    )
  }

  return getPaymentStatusByOrderId(request, {
    params: Promise.resolve({ orderId }),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'api:wallet:escrow', {
      maxRequests: 60,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access.' },
        { status: 401 }
      )
    }

    const result: any = await prisma.$queryRaw`
      SELECT SUM(t.kompensasi) as total
      FROM "Task" t
      JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
      WHERE t.id_requester = ${authUser.id}
      AND UPPER(st.nama_status) IN ('OPEN', 'IN PROGRESS', 'IN_PROGRESS')
    `;

    const totalKompensasi = result[0]?.total ? Number(result[0].total) : 0;

    return NextResponse.json({
      success: true,
      data: {
        escrow_amount: totalKompensasi
      }
    })

  } catch (error) {
    console.error('[GET /api/wallet/escrow] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

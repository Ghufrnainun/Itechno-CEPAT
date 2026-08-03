import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 0

/**
 * Health check & keep-alive endpoint untuk mencegah Supabase free-tier ter-pause
 */
export async function GET() {
  try {
    // Ringan: Query 1 record dari database
    const roleCount = await prisma.role.count()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      roles: roleCount,
    })
  } catch (error) {
    console.error('[GET /api/health] Error:', error)
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 500 }
    )
  }
}

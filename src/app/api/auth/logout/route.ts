import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    // Logout: max 20 request per IP per 15 menit
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'auth:logout', {
      maxRequests: 20,
      windowSeconds: 15 * 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal logout.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: 'Berhasil logout.' })
  } catch (error) {
    console.error('[POST /api/auth/logout] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

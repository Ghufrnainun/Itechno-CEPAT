import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loginSchema, formatZodErrors } from '@/lib/validations'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'auth:login', {
      maxRequests: 10,
      windowSeconds: 15 * 60,
    })

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { success: false, message: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    // --- Parse Body ---
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Request body harus berupa JSON yang valid.' },
        { status: 400 }
      )
    }

    // --- Validasi dengan Zod ---
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // --- 1. Login via Supabase Auth ---
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      // Pesan generik — jangan beri tahu attacker apakah email terdaftar atau tidak
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // --- 2. Ambil data profil dari tabel User Prisma ---
    const userProfile = await prisma.user.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
        username: true,
        nama_lengkap: true,
        avatar_url: true,
        bio: true,
        rating_avg: true,
        total_completed: true,
        total_balance: true,
        role: {
          select: { nama_role: true },
        },
      },
    })

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
        },
        user: {
          id: userProfile.id_user,
          email: userProfile.email,
          username: userProfile.username,
          nama_lengkap: userProfile.nama_lengkap,
          avatar_url: userProfile.avatar_url,
          bio: userProfile.bio,
          rating_avg: userProfile.rating_avg,
          total_completed: userProfile.total_completed,
          total_balance: userProfile.total_balance,
          role: userProfile.role.nama_role,
        },
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

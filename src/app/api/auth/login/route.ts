import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const { email: identifier, password } = parsed.data

    // --- 1. Ambil data profil dari tabel User Prisma (match Email atau Username) ---
    const userProfile = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { username: identifier.trim().toLowerCase() },
        ],
      },
      select: {
        id_user: true,
        email: true,
        username: true,
        nama_lengkap: true,
        avatar_url: true,
        bio: true,
        pendidikan_terakhir: true,
        no_telpon: true,
        rating_avg: true,
        total_completed: true,
        total_balance: true,
        auth_id: true,
        is_banned: true,
        ban_type: true,
        ban_reason: true,
        banned_at: true,
        banned_until: true,
        role: {
          select: { nama_role: true },
        },
      },
    })

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // --- 2. Login via Supabase Auth (Verifikasi Password Terlebih Dahulu) ---
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password,
    })

    if (authError || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // --- 3. Cek status penangguhan (Ban) setelah password terverifikasi benar ---
    if (userProfile.is_banned) {
      const now = new Date()
      // Cek jika Temporary Ban sudah kedaluwarsa
      if (
        userProfile.ban_type === 'TEMPORARY' &&
        userProfile.banned_until &&
        now > userProfile.banned_until
      ) {
        // Auto-unban user
        await prisma.user.update({
          where: { id_user: userProfile.id_user },
          data: {
            is_banned: false,
            ban_type: null,
            ban_reason: null,
            banned_at: null,
            banned_until: null,
          },
        })

        if (userProfile.auth_id) {
          try {
            const adminClient = createAdminClient()
            await adminClient.auth.admin.updateUserById(userProfile.auth_id, {
              ban_duration: 'none',
            })
          } catch (e) {
            console.error('[login] Auto-unban Supabase error:', e)
          }
        }
      } else {
        // Sign out dari Supabase session karena akun ter-ban
        try {
          await supabase.auth.signOut()
        } catch (_) {}

        // Masih ter-ban: Tolak login dan kembalikan detail rincian ban
        return NextResponse.json(
          {
            success: false,
            is_banned: true,
            message: 'Akun Anda telah ditangguhkan.',
            ban_details: {
              type: userProfile.ban_type ?? 'PERMANENT',
              reason: userProfile.ban_reason || '',
              banned_at: userProfile.banned_at ? userProfile.banned_at.toISOString() : null,
              banned_until: userProfile.banned_until ? userProfile.banned_until.toISOString() : null,
            },
          },
          { status: 403 }
        )
      }
    }

    const isOnboarded = Boolean(
      userProfile.pendidikan_terakhir &&
      userProfile.no_telpon &&
      userProfile.bio
    )

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
          is_onboarded: isOnboarded,
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

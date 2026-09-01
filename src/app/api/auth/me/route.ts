import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    // Me: max 30 request per IP per menit (high karena sering dipanggil frontend)
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'auth:me', {
      maxRequests: 30,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request.' },
        { status: 429 }
      )
    }

    // --- 1. Cek session Supabase Auth ---
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    // --- 2. Ambil profil lengkap dari Prisma ---
    const userProfile = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: {
        id_user: true,
        email: true,
        username: true,
        nama_lengkap: true,
        avatar_url: true,
        bio: true,
        pendidikan_terakhir: true,
        alamat: true,
        no_telpon: true,
        rating_avg: true,
        total_completed: true,
        total_balance: true,
        held_balance: true,
        role: {
          select: {
            id_role: true,
            nama_role: true,
          },
        },
        skills_user: {
          select: {
            id_skills_user: true,
            skills_master: {
              select: { nama_skill: true, icon: true },
            },
          },
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
        id: userProfile.id_user,
        email: userProfile.email,
        username: userProfile.username,
        nama_lengkap: userProfile.nama_lengkap,
        avatar_url: userProfile.avatar_url,
        bio: userProfile.bio,
        pendidikan_terakhir: userProfile.pendidikan_terakhir,
        alamat: userProfile.alamat,
        no_telpon: userProfile.no_telpon,
        rating_avg: userProfile.rating_avg,
        total_completed: userProfile.total_completed,
        total_balance: userProfile.total_balance - (userProfile.held_balance || 0),
        role: userProfile.role,
        skills: userProfile.skills_user.map((s) => ({
          id: s.id_skills_user,
          nama_skill: s.skills_master.nama_skill,
          icon: s.skills_master.icon,
        })),
      },
    })
  } catch (error) {
    console.error('[GET /api/auth/me] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

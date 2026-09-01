import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST /api/admin/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // 1. Login via Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.session) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // 2. Cek user di Prisma dan verifikasi role Admin
    const userProfile = await prisma.user.findUnique({
      where: { email },
      select: {
        id_user: true,
        email: true,
        nama_lengkap: true,
        avatar_url: true,
        role: { select: { nama_role: true } },
      },
    })

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (userProfile.role.nama_role !== 'Admin') {
      // Logout dari Supabase karena bukan admin
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          success: false,
          message: 'Akses ditolak. Akun ini tidak memiliki hak akses admin.',
        },
        { status: 403 }
      )
    }

    // 3. Buat AdminSession token & hash dengan SHA-256 untuk database
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 8) // expire dalam 8 jam

    // Hapus session lama untuk user ini (jika ada)
    await prisma.adminSession.deleteMany({
      where: { admin_id: userProfile.id_user },
    })

    // Buat session baru dengan hashed token
    await prisma.adminSession.create({
      data: {
        admin_id: userProfile.id_user,
        token: hashedToken,
        expires_at: expiresAt,
      },
    })

    // 4. Set httpOnly cookie dengan raw token
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        admin: {
          id: userProfile.id_user,
          email: userProfile.email,
          nama_lengkap: userProfile.nama_lengkap,
          avatar_url: userProfile.avatar_url,
        },
      },
    })

    response.cookies.set('admin_token', rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 jam dalam detik
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[POST /api/admin/auth/login] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

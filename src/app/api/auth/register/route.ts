import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { registerSchema, formatZodErrors } from '@/lib/validations'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { notificationService } from '@/services/notification.service'

export async function POST(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'auth:register', {
      maxRequests: 5,
      windowSeconds: 15 * 60,
    })

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { success: false, message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.` },
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

    // --- Validasi dengan Zod (1 langkah: sanitize + validate + type-safe) ---
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const { email, password, nama_lengkap, username } = parsed.data

    // --- Cek duplikat username ---
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username sudah digunakan.' },
        { status: 409 }
      )
    }

    // --- Cek duplikat email ---
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar.' },
        { status: 409 }
      )
    }

    // --- 1. Ambil role Requester server-side (TIDAK pernah dipercaya dari caller) ---
    const defaultRole =
      (await prisma.role.findFirst({ where: { nama_role: 'Requester' } })) ??
      (await prisma.role.findFirst())

    if (!defaultRole) {
      return NextResponse.json(
        { success: false, message: 'Role tidak ditemukan. Hubungi admin.' },
        { status: 500 }
      )
    }

    // --- 2. Buat user di Supabase Auth ---
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat akun. Periksa email dan password Anda.' },
        { status: 400 }
      )
    }

    // Auto-login agar session cookie aktif untuk onboarding
    if (!authData.session) {
      await supabase.auth.signInWithPassword({ email, password })
    }

    // --- 3. Buat profil user di tabel User Prisma ---
    // Jika Prisma gagal, cleanup Supabase Auth user agar tidak terjadi orphan
    let newUser: { id_user: string; email: string; username: string; nama_lengkap: string; role: { nama_role: string } }
    try {
      newUser = await prisma.user.create({
        data: {
          email,
          username,
          nama_lengkap,
          id_role: defaultRole.id_role,
          auth_id: authData.user.id,
        },
        select: {
          id_user: true,
          email: true,
          username: true,
          nama_lengkap: true,
          role: { select: { nama_role: true } },
        },
      })
    } catch (prismaError) {
      // Cleanup: hapus Supabase Auth user agar tidak menjadi orphan
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (_) { /* best-effort cleanup */ }
      throw prismaError
    }

    // --- 4. Kirim notifikasi selamat datang (fire-and-forget) ---
    try {
      await notificationService.createNotification({
        userId: newUser.id_user,
        type: 'welcome',
        title: 'Selamat Datang di CEPAT! 👋',
        message: `Hai ${nama_lengkap}! Akun kamu berhasil dibuat. Mulai jelajahi tugas mikro di sekitarmu atau buat tugas pertamamu sekarang!`,
        data: { onboarding: true },
      })
    } catch (_) { /* non-blocking */ }

    return NextResponse.json(
      {
        success: true,
        message: 'Registrasi berhasil.',
        data: {
          user_id: newUser.id_user,
          email: newUser.email,
          username: newUser.username,
          nama_lengkap: newUser.nama_lengkap,
          role: newUser.role.nama_role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/auth/register] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

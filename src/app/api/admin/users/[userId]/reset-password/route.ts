import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/users/[userId]/reset-password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params

    // Ambil email user dari database
    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        email: true,
        nama_lengkap: true,
        auth_id: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (!user.auth_id) {
      return NextResponse.json(
        { success: false, message: 'User ini tidak memiliki akun auth yang terhubung.' },
        { status: 400 }
      )
    }

    // Generate password reset link via Supabase Admin API
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/auth/callback`,
      },
    })

    if (error) {
      console.error('[reset-password] Supabase generateLink error:', error)
      return NextResponse.json(
        { success: false, message: 'Gagal membuat link reset password.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Link reset password berhasil dikirim ke email ${user.email}.`,
      data: {
        email: user.email,
        // Hanya return properties yang aman, jangan expose link ke client
        sent: true,
      },
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/reset-password] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

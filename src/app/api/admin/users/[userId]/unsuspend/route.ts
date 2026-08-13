import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/users/[userId]/unsuspend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        email: true,
        nama_lengkap: true,
        auth_id: true,
        is_banned: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 1. Reset status ban di Prisma
    await prisma.user.update({
      where: { id_user: userId },
      data: {
        is_banned: false,
        ban_type: null,
        ban_reason: null,
        banned_at: null,
        banned_until: null,
      },
    })

    // 2. Unban di Supabase Auth
    if (user.auth_id) {
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
        ban_duration: 'none',
      }).catch((err) => console.error('[unsuspend] Supabase unban error:', err))
    }

    return NextResponse.json({
      success: true,
      message: `Status penangguhan untuk ${user.nama_lengkap} berhasil dicabut. User sudah aktif kembali.`,
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/unsuspend] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/users/[userId]/suspend
// Body: { type: 'TEMPORARY' | 'PERMANENT', duration_hours?: number, reason: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params
    const body = await request.json()

    const banType = (body.type || 'PERMANENT') as 'TEMPORARY' | 'PERMANENT'
    const durationHours = typeof body.duration_hours === 'number' ? body.duration_hours : 24
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!reason) {
      return NextResponse.json(
        { success: false, message: 'Alasan penangguhan akun wajib diisi.' },
        { status: 400 }
      )
    }

    if (banType === 'TEMPORARY' && durationHours <= 0) {
      return NextResponse.json(
        { success: false, message: 'Durasi temporary ban harus lebih dari 0 jam.' },
        { status: 400 }
      )
    }

    // Ambil user dari database
    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        email: true,
        nama_lengkap: true,
        auth_id: true,
        role: { select: { nama_role: true } },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Cegah admin men-suspend admin lain
    if (user.role.nama_role === 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat melakukan aksi moderasi terhadap akun Admin.' },
        { status: 403 }
      )
    }

    if (!user.auth_id) {
      return NextResponse.json(
        { success: false, message: 'User ini tidak memiliki akun auth yang terhubung.' },
        { status: 400 }
      )
    }

    const now = new Date()
    let bannedUntil: Date | null = null
    let supabaseBanDuration = '876600h' // ~100 tahun untuk permanent

    if (banType === 'TEMPORARY') {
      bannedUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000)
      supabaseBanDuration = `${Math.ceil(durationHours)}h`
    }

    // 1. Update status ban di Prisma User
    await prisma.user.update({
      where: { id_user: userId },
      data: {
        is_banned: true,
        ban_type: banType,
        ban_reason: reason,
        banned_at: now,
        banned_until: bannedUntil,
      },
    })

    // 2. Update Supabase Auth ban
    const supabaseAdmin = createAdminClient()
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_id,
      { ban_duration: supabaseBanDuration }
    )

    if (banError) {
      console.error('[suspend] Supabase ban error:', banError)
      // Tetap teruskan karena status di Prisma sudah ter-update
    }

    const banTypeLabel = banType === 'TEMPORARY' ? `Temporary Ban (${durationHours} jam)` : 'Permanent Ban'

    return NextResponse.json({
      success: true,
      message: `User ${user.nama_lengkap} berhasil ditangguhkan (${banTypeLabel}).`,
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/suspend] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

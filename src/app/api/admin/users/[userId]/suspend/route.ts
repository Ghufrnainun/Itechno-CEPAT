import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/users/[userId]/suspend
// Body: { action: 'suspend' | 'unsuspend' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params
    const body = await request.json()
    const action = body.action as 'suspend' | 'unsuspend'

    if (!action || !['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action harus berupa "suspend" atau "unsuspend".' },
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

    // Gunakan Supabase Admin API untuk ban/unban
    const supabaseAdmin = createAdminClient()
    const banDuration = action === 'suspend' ? '876600h' : 'none' // 876600h ≈ 100 tahun

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_id,
      { ban_duration: banDuration }
    )

    if (banError) {
      console.error('[suspend] Supabase ban error:', banError)
      return NextResponse.json(
        { success: false, message: 'Gagal melakukan aksi moderasi via Supabase.' },
        { status: 500 }
      )
    }

    const actionLabel = action === 'suspend' ? 'disuspend' : 'diaktifkan kembali'

    return NextResponse.json({
      success: true,
      message: `User ${user.nama_lengkap} berhasil ${actionLabel}.`,
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/suspend] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

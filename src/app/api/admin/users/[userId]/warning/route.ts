import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/users/[userId]/warning
// Body: { message: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Pesan peringatan wajib diisi.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        nama_lengkap: true,
        email: true,
        role: { select: { nama_role: true } },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      )
    }

    if (user.role.nama_role === 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat mengirim peringatan kepada sesama akun Admin.' },
        { status: 403 }
      )
    }

    // Kirim notifikasi peringatan ke user
    await prisma.notifications.create({
      data: {
        user_id: user.id_user,
        type: 'warning',
        title: 'Peringatan dari Admin Platform ⚠️',
        message: message.trim(),
        data: { sent_by_admin: true },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Pesan peringatan berhasil dikirim ke ${user.nama_lengkap}.`,
    })
  } catch (error) {
    console.error('[POST /api/admin/users/[userId]/warning] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

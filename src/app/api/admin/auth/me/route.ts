import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/auth/me
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid || !auth.adminId) {
      return unauthorizedResponse()
    }

    const admin = await prisma.user.findUnique({
      where: { id_user: auth.adminId },
      select: {
        id_user: true,
        email: true,
        nama_lengkap: true,
        avatar_url: true,
        username: true,
        role: { select: { nama_role: true } },
      },
    })

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id_user,
        email: admin.email,
        nama_lengkap: admin.nama_lengkap,
        avatar_url: admin.avatar_url,
        username: admin.username,
        role: admin.role.nama_role,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/auth/me] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

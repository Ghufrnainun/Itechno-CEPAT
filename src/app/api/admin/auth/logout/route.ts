import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/auth/logout
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value

    if (token) {
      // Hapus session dari database
      await prisma.adminSession
        .delete({ where: { token } })
        .catch(() => {}) // abaikan jika token tidak ditemukan
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil.',
    })

    // Hapus cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[POST /api/admin/auth/logout] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

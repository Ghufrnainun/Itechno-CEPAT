import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface AdminTokenPayload {
  valid: boolean
  adminId?: string
  adminEmail?: string
}

/**
 * Verifikasi admin session token dari cookie.
 * Digunakan sebagai guard di semua admin API routes.
 */
export async function verifyAdminToken(
  request: NextRequest
): Promise<AdminTokenPayload> {
  try {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return { valid: false }
    }

    const session = await prisma.adminSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id_user: true,
            email: true,
            nama_lengkap: true,
            role: { select: { nama_role: true } },
          },
        },
      },
    })

    if (!session) {
      return { valid: false }
    }

    // Cek apakah session sudah expired
    if (new Date() > session.expires_at) {
      // Hapus session expired secara async (non-blocking)
      prisma.adminSession
        .delete({ where: { id: session.id } })
        .catch(() => {})
      return { valid: false }
    }

    // Verifikasi bahwa user masih memiliki role Admin
    if (session.user.role.nama_role !== 'Admin') {
      return { valid: false }
    }

    return {
      valid: true,
      adminId: session.user.id_user,
      adminEmail: session.user.email,
    }
  } catch (error) {
    console.error('[verifyAdminToken] Error:', error)
    return { valid: false }
  }
}

/**
 * Helper untuk membuat response 401 Unauthorized standar
 * ketika admin token tidak valid.
 */
export function unauthorizedResponse() {
  return Response.json(
    { success: false, message: 'Akses ditolak. Silakan login sebagai admin.' },
    { status: 401 }
  )
}

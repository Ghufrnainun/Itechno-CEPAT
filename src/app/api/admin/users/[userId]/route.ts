import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users/[userId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      include: {
        role: true,
        skills_user: {
          include: { skills_master: true },
        },
        _count: {
          select: {
            tasks_posted: true,
            task_applications: true,
            reviews_received: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id_user,
        nama_lengkap: user.nama_lengkap,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        no_telpon: user.no_telpon,
        alamat: user.alamat,
        bio: user.bio,
        pendidikan_terakhir: user.pendidikan_terakhir,
        rating_avg: user.rating_avg,
        total_completed: user.total_completed,
        total_balance: user.total_balance,
        held_balance: user.held_balance,
        auth_id: user.auth_id,
        is_banned: user.is_banned,
        ban_type: user.ban_type,
        ban_reason: user.ban_reason,
        banned_at: user.banned_at ? user.banned_at.toISOString() : null,
        banned_until: user.banned_until ? user.banned_until.toISOString() : null,
        role: user.role.nama_role,
        skills: user.skills_user.map((s) => ({
          id: s.id_skills_user,
          nama_skill: s.skills_master.nama_skill,
          deskripsi_pengalaman: s.deskripsi_pengalaman,
          portofolio_url: s.portofolio_url,
        })),
        stats: {
          total_tasks_posted: user._count.tasks_posted,
          total_applications: user._count.task_applications,
          total_reviews: user._count.reviews_received,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/users/[userId]] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

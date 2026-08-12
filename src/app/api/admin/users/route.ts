import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/users?search=&role=&page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const role = searchParams.get('role') ?? 'All'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search.trim()) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role !== 'All') {
      where.role = { nama_role: role }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { email: 'asc' },
        select: {
          id_user: true,
          nama_lengkap: true,
          username: true,
          email: true,
          avatar_url: true,
          no_telpon: true,
          alamat: true,
          bio: true,
          rating_avg: true,
          total_completed: true,
          total_balance: true,
          held_balance: true,
          auth_id: true,
          is_banned: true,
          ban_type: true,
          ban_reason: true,
          banned_at: true,
          banned_until: true,
          role: { select: { nama_role: true } },
          skills_user: {
            select: {
              skills_master: { select: { nama_skill: true } },
            },
          },
          _count: {
            select: {
              tasks_posted: true,
              task_applications: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Transform ke format yang dibutuhkan frontend
    const formattedUsers = users.map((u) => ({
      id: u.id_user,
      nama_lengkap: u.nama_lengkap,
      username: u.username,
      email: u.email,
      avatar_url: u.avatar_url,
      no_telpon: u.no_telpon,
      alamat: u.alamat,
      bio: u.bio,
      rating_avg: u.rating_avg,
      total_completed: u.total_completed,
      total_balance: u.total_balance,
      held_balance: u.held_balance,
      auth_id: u.auth_id,
      is_banned: u.is_banned,
      ban_type: u.ban_type,
      ban_reason: u.ban_reason,
      banned_at: u.banned_at ? u.banned_at.toISOString() : null,
      banned_until: u.banned_until ? u.banned_until.toISOString() : null,
      role: u.role.nama_role,
      skills: u.skills_user.map((s) => s.skills_master.nama_skill),
      total_tasks_posted: u._count.tasks_posted,
      total_applications: u._count.task_applications,
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/users] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports?search=&status=&page=1&limit=10&id=
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? 'All'
    const reportId = searchParams.get('id') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
    
    // When searching by specific reportId, ignore skip pagination offset
    const effectiveSkip = reportId.trim() ? 0 : (page - 1) * limit

    const where: any = {}

    if (reportId.trim()) {
      where.id_report = reportId.trim()
    } else {
      if (search.trim()) {
        where.OR = [
          { subjek: { contains: search, mode: 'insensitive' } },
          { deskripsi: { contains: search, mode: 'insensitive' } },
          { kategori: { contains: search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { nama_lengkap: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ]
      }

      if (status !== 'All') {
        where.status = { equals: status, mode: 'insensitive' }
      }
    }

    const [reports, total, totalGlobal, pendingCount, reviewedCount, resolvedCount] = await Promise.all([
      prisma.userReport.findMany({
        where,
        skip: effectiveSkip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id_user: true,
              nama_lengkap: true,
              email: true,
              username: true,
              avatar_url: true,
              no_telpon: true,
              role: { select: { nama_role: true } },
            },
          },
        },
      }),
      prisma.userReport.count({ where }),
      prisma.userReport.count(),
      prisma.userReport.count({ where: { status: 'pending' } }),
      prisma.userReport.count({ where: { status: 'reviewed' } }),
      prisma.userReport.count({ where: { status: 'resolved' } }),
    ])

    const formattedReports = reports.map((r: any) => ({
      id: r.id_report,
      kategori: r.kategori,
      subjek: r.subjek,
      deskripsi: r.deskripsi,
      status: r.status,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
      user: {
        id: r.user.id_user,
        nama_lengkap: r.user.nama_lengkap,
        email: r.user.email,
        username: r.user.username,
        avatar_url: r.user.avatar_url,
        no_telpon: r.user.no_telpon,
        role: r.user.role.nama_role,
      },
    }))

    return NextResponse.json({
      success: true,
      data: formattedReports,
      stats: {
        totalAll: totalGlobal,
        pending: pendingCount,
        reviewed: reviewedCount,
        resolved: resolvedCount,
      },
      meta: {
        total,
        page: reportId.trim() ? 1 : page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/reports] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

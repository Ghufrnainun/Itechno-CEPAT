import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/tasks?search=&status=&page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? 'All'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search.trim()) {
      where.OR = [
        { id_tasks: { contains: search, mode: 'insensitive' } },
        { judul_tugas: { contains: search, mode: 'insensitive' } },
        { deskripsi_tugas: { contains: search, mode: 'insensitive' } },
        {
          requester: {
            OR: [
              { nama_lengkap: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { kategori: { nama_kategori: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status !== 'All') {
      where.status_task = { nama_status: { equals: status, mode: 'insensitive' } }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          requester: {
            select: {
              id_user: true,
              nama_lengkap: true,
              email: true,
              avatar_url: true,
            },
          },
          kategori: { select: { nama_kategori: true, icon: true } },
          status_task: { select: { nama_status: true } },
          _count: { select: { applicants: true } },
          applicants: {
            where: { status_applicant: { nama_status: { equals: 'ACCEPTED', mode: 'insensitive' } } },
            include: {
              worker: {
                select: { id_user: true, nama_lengkap: true, email: true },
              },
            },
            take: 1,
          },
        },
      }),
      prisma.task.count({ where }),
    ])

    const formattedTasks = tasks.map((t) => {
      const workerAssigned = t.applicants[0]?.worker ?? null
      return {
        id: t.id_tasks,
        judul_tugas: t.judul_tugas,
        deskripsi_tugas: t.deskripsi_tugas,
        kompensasi: t.kompensasi,
        estimasi_waktu: t.estimasi_waktu,
        created_at: t.created_at.toISOString(),
        accepted_at: t.accepted_at?.toISOString() ?? null,
        completed_at: t.completed_at?.toISOString() ?? null,
        status: t.status_task.nama_status.toLowerCase(),
        kategori: t.kategori.nama_kategori,
        kategori_icon: t.kategori.icon,
        applicants_count: t._count.applicants,
        requester: {
          id: t.requester.id_user,
          nama_lengkap: t.requester.nama_lengkap,
          email: t.requester.email,
          avatar_url: t.requester.avatar_url,
        },
        worker_assigned: workerAssigned
          ? {
              id: workerAssigned.id_user,
              nama_lengkap: workerAssigned.nama_lengkap,
              email: workerAssigned.email,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/tasks] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

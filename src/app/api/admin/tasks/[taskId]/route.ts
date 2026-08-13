import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/tasks/[taskId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { taskId } = await params

    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        requester: {
          select: {
            id_user: true,
            nama_lengkap: true,
            email: true,
            avatar_url: true,
            no_telpon: true,
          },
        },
        kategori: true,
        status_task: true,
        requirements: {
          include: { skills_master: true },
        },
        applicants: {
          include: {
            worker: {
              select: {
                id_user: true,
                nama_lengkap: true,
                email: true,
                avatar_url: true,
                rating_avg: true,
              },
            },
            status_applicant: true,
          },
          orderBy: { applied_at: 'desc' },
        },
        _count: {
          select: { chat_rooms: true, reviews: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id_tasks,
        judul_tugas: task.judul_tugas,
        deskripsi_tugas: task.deskripsi_tugas,
        kompensasi: task.kompensasi,
        estimasi_waktu: task.estimasi_waktu,
        created_at: task.created_at.toISOString(),
        accepted_at: task.accepted_at?.toISOString() ?? null,
        completed_at: task.completed_at?.toISOString() ?? null,
        max_applicants: task.max_applicants,
        status: task.status_task.nama_status,
        kategori: task.kategori.nama_kategori,
        kategori_icon: task.kategori.icon,
        requirements: task.requirements.map((r) => r.skills_master.nama_skill),
        requester: task.requester,
        applicants: task.applicants.map((a) => ({
          id: a.id_task_applicants,
          worker: a.worker,
          status: a.status_applicant.nama_status,
          applied_at: a.applied_at.toISOString(),
          pesan: a.pesan,
          alasan_penolakan: a.alasan_penolakan,
        })),
        stats: {
          total_applicants: task.applicants.length,
          total_chat_rooms: task._count.chat_rooms,
          total_reviews: task._count.reviews,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/tasks/[taskId]] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

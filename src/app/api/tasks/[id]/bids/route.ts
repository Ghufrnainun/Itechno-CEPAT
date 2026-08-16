import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { taskService } from '@/services/task.service'

// GET /api/tasks/[id]/bids — list semua bid untuk task bidding (requester only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id_tasks: id },
      select: { id_requester: true },
    })
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task tidak ditemukan.' }, { status: 404 })
    }

    // Sealed bid: hanya requester pemilik task yang boleh melihat daftar penawaran
    if (task.id_requester !== currentUser.id_user) {
      return NextResponse.json({ success: false, message: 'Hanya pemberi tugas yang dapat melihat daftar penawaran.' }, { status: 403 })
    }

    const detail = await taskService.getTaskById(id, currentUser.id_user)
    if (!detail) {
      return NextResponse.json({ success: false, message: 'Task tidak ditemukan.' }, { status: 404 })
    }

    // Susun daftar bid: hanya bid aktif (pending/accepted), urut dari penawaran terendah
    const bids = detail.applicants
      .filter((a) => a.status === 'pending' || a.status === 'accepted')
      .map((a) => ({
        id_task_applicants: a.id_task_applicants,
        worker_id: a.id_worker,
        worker_name: a.worker.nama_lengkap,
        worker_avatar: a.worker.avatar_url,
        rating: a.worker.rating_avg,
        total_completed: a.worker.total_completed,
        bid_amount: a.bid_amount,
        message: a.pesan,
        status: a.status,
        applied_at: a.applied_at,
      }))
      .sort((x, y) => {
        // Sort: bid terendah dulu; tanpa bid → akhir; tie-break rating tertinggi
        const bx = x.bid_amount ?? Number.MAX_SAFE_INTEGER
        const by = y.bid_amount ?? Number.MAX_SAFE_INTEGER
        if (bx !== by) return bx - by
        return y.rating - x.rating
      })

    return NextResponse.json({
      success: true,
      data: {
        is_bidding: detail.is_bidding,
        budget_min: detail.budget_min,
        budget_max: detail.budget_max,
        max_applicants: detail.max_applicants,
        accepted_count: detail.applicants.filter((a) => a.status === 'accepted').length,
        bids,
      },
    })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[GET /api/tasks/[id]/bids] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 500 })
  }
}

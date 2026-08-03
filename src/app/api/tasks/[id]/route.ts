import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { taskService } from '@/services/task.service'

// GET /api/tasks/[id] — detail task
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Cek siapa yang melihat (opsional)
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    let viewerUserId: string | undefined
    if (authUser?.email) {
      const u = await prisma.user.findUnique({ where: { email: authUser.email }, select: { id_user: true } })
      viewerUserId = u?.id_user
    }

    const task = await taskService.getTaskById(id, viewerUserId)
    if (!task) {
      return NextResponse.json({ success: false, message: 'Task tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    console.error('[GET /api/tasks/[id]] Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal.' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — cancel task (requester, status harus 'open')
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    const result = await taskService.updateTaskStatus(id, currentUser.id_user, 'cancelled')
    return NextResponse.json({ success: true, message: 'Task berhasil dibatalkan.', data: result })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[DELETE /api/tasks/[id]] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 })
  }
}

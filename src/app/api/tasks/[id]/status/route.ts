import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { updateTaskStatusSchema } from '@/lib/validations/task.schema'
import { taskService } from '@/services/task.service'

// PATCH /api/tasks/[id]/status — update status task
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Validasi body
    const body = await request.json()
    const parsed = updateTaskStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    const { id } = await params
    const result = await taskService.updateTaskStatus(id, currentUser.id_user, parsed.data.status)

    return NextResponse.json({ success: true, message: 'Status task berhasil diperbarui.', data: result })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[PATCH /api/tasks/[id]/status] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 })
  }
}

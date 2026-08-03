import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { taskService } from '@/services/task.service'

// GET /api/users/[id]/tasks — histori task user (sebagai requester & worker)
// Query params: role=requester|worker, status=open|accepted|in_progress|completed|cancelled
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

    // Pastikan user hanya bisa lihat history miliknya sendiri
    if (id !== currentUser.id_user && id !== 'me') {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = (searchParams.get('role') ?? 'worker') as 'requester' | 'worker'
    const status = searchParams.get('status') ?? undefined

    const tasks = await taskService.getUserTaskHistory(currentUser.id_user, role, status)

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('[GET /api/users/[id]/tasks] Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal.' }, { status: 500 })
  }
}

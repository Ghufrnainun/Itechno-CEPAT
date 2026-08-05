import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const initChatSchema = z.object({
  id_tasks: z.string().uuid(),
  id_worker: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true }
    })
    
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = initChatSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Data tidak valid.', errors: parsed.error.format() }, { status: 400 })
    }

    const { id_tasks, id_worker } = parsed.data

    // Check if task exists and get requester
    const task = await prisma.task.findUnique({
      where: { id_tasks },
      select: { id_requester: true }
    })

    if (!task) {
      return NextResponse.json({ success: false, message: 'Tugas tidak ditemukan.' }, { status: 404 })
    }

    // Only the requester or the specific worker can initiate this chat
    if (currentUser.id_user !== task.id_requester && currentUser.id_user !== id_worker) {
       return NextResponse.json({ success: false, message: 'Anda tidak berhak membuat obrolan ini.' }, { status: 403 })
    }

    // Check if chat room already exists
    let chatRoom = await prisma.chatRoom.findUnique({
      where: {
        id_tasks_id_worker: {
          id_tasks,
          id_worker
        }
      }
    })

    if (!chatRoom) {
      // Create new chat room
      chatRoom = await prisma.chatRoom.create({
        data: {
          id_tasks,
          id_requester: task.id_requester,
          id_worker,
        }
      })
    }

    return NextResponse.json({ success: true, data: chatRoom })
  } catch (error: any) {
    console.error('[POST /api/chat/init] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat obrolan.', error: error.message },
      { status: 500 }
    )
  }
}

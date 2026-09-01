import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['mark_read', 'mark_unread', 'clear']),
  roomIds: z.array(z.string()).min(1, "Minimal satu obrolan harus dipilih")
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true }
    })
    
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Data tidak valid.', errors: parsed.error.format() }, { status: 400 })
    }

    const { action, roomIds } = parsed.data

    // Verify user has access to these rooms
    const validRooms = await prisma.chatRoom.findMany({
      where: {
        id_chat_room: { in: roomIds },
        OR: [
          { id_requester: currentUser.id_user },
          { id_worker: currentUser.id_user }
        ]
      },
      select: { id_chat_room: true, id_requester: true, id_worker: true }
    })

    if (validRooms.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada obrolan valid yang ditemukan atau akses ditolak.' }, { status: 403 })
    }

    const validRoomIds = validRooms.map(r => r.id_chat_room)

    if (action === 'mark_read') {
      // Mark all unread messages from OTHER users in these rooms as read
      await prisma.message.updateMany({
        where: {
          id_chat_room: { in: validRoomIds },
          id_sender: { not: currentUser.id_user },
          is_read: false
        },
        data: { is_read: true }
      })
    } else if (action === 'mark_unread') {
      // Find the latest message from OTHER users in each room and mark it as unread
      // Since updateMany with limit is not supported in Prisma, we find them first
      for (const roomId of validRoomIds) {
        const latestMsg = await prisma.message.findFirst({
          where: {
            id_chat_room: roomId,
            id_sender: { not: currentUser.id_user }
          },
          orderBy: { created_at: 'desc' },
          select: { id_message: true }
        });

        if (latestMsg) {
          await prisma.message.update({
            where: { id_message: latestMsg.id_message },
            data: { is_read: false }
          });
        }
      }
    } else if (action === 'clear') {
      // Update cleared_at_* for the current user
      const now = new Date();
      
      const asRequesterRooms = validRooms.filter(r => r.id_requester === currentUser.id_user).map(r => r.id_chat_room);
      const asWorkerRooms = validRooms.filter(r => r.id_worker === currentUser.id_user).map(r => r.id_chat_room);

      if (asRequesterRooms.length > 0) {
        // Update cleared_at for requester
        await prisma.chatRoom.updateMany({
          where: { id_chat_room: { in: asRequesterRooms } },
          data: { cleared_at_requester: now }
        });
      }
      if (asWorkerRooms.length > 0) {
        // Update cleared_at for worker
        await prisma.chatRoom.updateMany({
          where: { id_chat_room: { in: asWorkerRooms } },
          data: { cleared_at_worker: now }
        });
      }
    }

    return NextResponse.json({ success: true, message: `Aksi ${action} berhasil diterapkan pada ${validRoomIds.length} obrolan.` })
  } catch (error) {
    console.error(`[POST /api/chat/action] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

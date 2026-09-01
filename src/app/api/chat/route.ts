import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Get all chat rooms where the user is either the requester or the worker
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { id_requester: currentUser.id_user },
          { id_worker: currentUser.id_user }
        ]
      },
      include: {
        task: {
          select: {
            judul_tugas: true,
          }
        },
        requester: {
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true,
            last_seen_at: true
          }
        },
        worker: {
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true,
            last_seen_at: true
          }
        },
        messages: {
          where: {
            NOT: {
              deleted_by: {
                has: currentUser.id_user
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 100, // fetch enough to compute unread and get the latest non-cleared message
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Process each room to compute unread counts and filter cleared messages
    const processedRooms = chatRooms.reduce((acc, room) => {
      const isRequester = room.id_requester === currentUser.id_user;
      const clearedAt = isRequester ? room.cleared_at_requester : room.cleared_at_worker;

      // Filter messages that are newer than cleared_at
      const validMessages = room.messages.filter(msg => {
        if (!clearedAt) return true;
        return msg.created_at > clearedAt;
      });

      // HIDE THE ROOM if it has been cleared and there are no new messages
      if (clearedAt && validMessages.length === 0) {
        return acc;
      }

      // Calculate unread count (messages from OTHER user that are unread)
      const unreadCount = validMessages.filter(msg => 
        msg.id_sender !== currentUser.id_user && msg.is_read === false
      ).length;

      acc.push({
        ...room,
        messages: validMessages.slice(0, 1), // Only keep the latest valid message for preview
        unreadCount
      });
      return acc;
    }, [] as any[]);

    // Sort by the latest message's created_at, or room's created_at if no messages
    processedRooms.sort((a, b) => {
      const aTime = a.messages[0]?.created_at.getTime() || a.created_at.getTime();
      const bTime = b.messages[0]?.created_at.getTime() || b.created_at.getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, data: processedRooms })
  } catch (error: any) {
    console.error('[GET /api/chat] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil daftar chat.', error: error.message },
      { status: 500 }
    )
  }
}

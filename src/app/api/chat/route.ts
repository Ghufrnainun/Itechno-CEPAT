import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
            avatar_url: true
          }
        },
        worker: {
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1, // only fetch the latest message for preview
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Sort by the latest message's created_at, or room's created_at if no messages
    chatRooms.sort((a, b) => {
      const aTime = a.messages[0]?.created_at.getTime() || a.created_at.getTime();
      const bTime = b.messages[0]?.created_at.getTime() || b.created_at.getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, data: chatRooms })
  } catch (error: any) {
    console.error('[GET /api/chat] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil daftar chat.', error: error.message },
      { status: 500 }
    )
  }
}

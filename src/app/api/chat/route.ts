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
          take: 1, // Hanya ambil pesan terakhir untuk preview
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const roomIds = chatRooms.map((r) => r.id_chat_room);

    // Agregasi unread count langsung via database index tanpa memuat seluruh pesan ke RAM
    const unreadGroups = roomIds.length > 0 ? await prisma.message.groupBy({
      by: ['id_chat_room'],
      where: {
        id_chat_room: { in: roomIds },
        id_sender: { not: currentUser.id_user },
        is_read: false,
        NOT: { deleted_by: { has: currentUser.id_user } },
      },
      _count: { _all: true },
    }) : [];

    const unreadMap = new Map<string, number>();
    for (const g of unreadGroups) {
      unreadMap.set(g.id_chat_room, g._count._all);
    }

    // Process each room to compute unread counts and filter cleared messages
    const processedRooms = chatRooms.reduce((acc, room) => {
      const isRequester = room.id_requester === currentUser.id_user;
      const clearedAt = isRequester ? room.cleared_at_requester : room.cleared_at_worker;

      const latestMsg = room.messages[0];
      const hasValidMessage = latestMsg && (!clearedAt || latestMsg.created_at > clearedAt);

      // Sembunyikan kamar jika telah dibersihkan (cleared) dan belum ada pesan baru
      if (clearedAt && !hasValidMessage) {
        return acc;
      }

      const unreadCount = hasValidMessage ? (unreadMap.get(room.id_chat_room) || 0) : 0;

      acc.push({
        ...room,
        messages: hasValidMessage ? [latestMsg] : [],
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
  } catch (error) {
    console.error('[GET /api/chat] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil daftar chat.' },
      { status: 500 }
    )
  }
}

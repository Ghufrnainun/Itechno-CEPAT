import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  teks_pesan: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional()
}).refine(data => data.teks_pesan || data.image_url, {
  message: "Harus ada teks_pesan atau image_url"
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const resolvedParams = await params;
    const roomId = resolvedParams.roomId;
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

    // Verify user is part of the chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id_chat_room: roomId },
      select: { id_requester: true, id_worker: true, cleared_at_requester: true, cleared_at_worker: true }
    })

    if (!chatRoom || (chatRoom.id_requester !== currentUser.id_user && chatRoom.id_worker !== currentUser.id_user)) {
       return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
    }

    const isRequester = chatRoom.id_requester === currentUser.id_user;
    // Note: cleared_at fields are from the newly generated Prisma Client
    const clearedAt = isRequester ? (chatRoom as any).cleared_at_requester : (chatRoom as any).cleared_at_worker;

    const messages = await prisma.message.findMany({
      where: { 
        id_chat_room: roomId,
        ...(clearedAt ? { created_at: { gt: clearedAt } } : {}),
        NOT: {
          deleted_by: {
            has: currentUser.id_user
          }
        }
      },
      orderBy: { created_at: 'asc' },
      include: {
        sender: {
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (error: any) {
    console.error(`[GET /api/chat/[roomId]] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan.', error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const resolvedParams = await params;
    const roomId = resolvedParams.roomId;
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

    // Verify user is part of the chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id_chat_room: roomId },
      select: { id_requester: true, id_worker: true }
    })

    if (!chatRoom || (chatRoom.id_requester !== currentUser.id_user && chatRoom.id_worker !== currentUser.id_user)) {
       return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = messageSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Data tidak valid.', errors: parsed.error.format() }, { status: 400 })
    }

    const { teks_pesan, image_url } = parsed.data

    const newMessage = await prisma.message.create({
      data: {
        id_chat_room: roomId,
        id_sender: currentUser.id_user,
        teks_pesan: teks_pesan || null,
        image_url: image_url || null,
      },
      include: {
        sender: {
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: newMessage })
  } catch (error: any) {
    console.error(`[POST /api/chat/[roomId]] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan.', error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const resolvedParams = await params;
    const roomId = resolvedParams.roomId;
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

    // Verify user is part of the chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id_chat_room: roomId },
      select: { id_requester: true, id_worker: true }
    })

    if (!chatRoom || (chatRoom.id_requester !== currentUser.id_user && chatRoom.id_worker !== currentUser.id_user)) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
    }

    // Mark all unread messages from the OTHER user as read
    const result = await prisma.message.updateMany({
      where: {
        id_chat_room: roomId,
        id_sender: { not: currentUser.id_user },
        is_read: false
      },
      data: {
        is_read: true,
        id_chat_room: roomId // Hack to force Postgres to include this column in Realtime payload
      }
    })

    return NextResponse.json({ success: true, updated_count: result.count })
  } catch (error: any) {
    console.error(`[PUT /api/chat/[roomId]] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan.', error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const resolvedParams = await params;
    const roomId = resolvedParams.roomId;
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

    // Verify user is part of the chat room
    const deleteRoom = await prisma.chatRoom.findUnique({
      where: { id_chat_room: roomId },
      select: { id_requester: true, id_worker: true }
    })

    if (!deleteRoom || (deleteRoom.id_requester !== currentUser.id_user && deleteRoom.id_worker !== currentUser.id_user)) {
      return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 })
    }

    const body = await request.json()
    const { messageIds, type } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ success: false, message: 'messageIds tidak valid.' }, { status: 400 })
    }

    if (type === 'for_everyone') {
      const result = await prisma.message.updateMany({
        where: {
          id_chat_room: roomId,
          id_message: { in: messageIds },
          id_sender: currentUser.id_user // ONLY allow deleting own messages
        },
        data: {
          is_deleted_for_everyone: true,
          teks_pesan: null,
          image_url: null
        }
      })
      return NextResponse.json({ success: true, deleted_count: result.count })
    } else {
      // Default to "for_me"
      const messages = await prisma.message.findMany({
        where: {
          id_chat_room: roomId,
          id_message: { in: messageIds },
        },
        select: { id_message: true, deleted_by: true }
      })

      const updatePromises = messages.map(msg => {
        if (!msg.deleted_by.includes(currentUser.id_user)) {
          return prisma.message.update({
            where: { id_message: msg.id_message },
            data: { deleted_by: { push: currentUser.id_user } } // Prisma supports push on PostgreSQL arrays in update!
          });
        }
      })
      
      await Promise.all(updatePromises)
      
      return NextResponse.json({ success: true, deleted_count: messages.length })
    }
  } catch (error: any) {
    console.error(`[DELETE /api/chat/[roomId]] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan.', error: error.message },
      { status: 500 }
    )
  }
}

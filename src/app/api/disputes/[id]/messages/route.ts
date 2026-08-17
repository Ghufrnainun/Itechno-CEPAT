import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { disputeService } from '@/services/dispute.service';
import { z } from 'zod';

const messageSchema = z.object({
  message: z.string().min(1, 'Pesan tidak boleh kosong.').max(3000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const isAdmin = user.role?.nama_role?.toLowerCase() === 'admin';
    const dispute = await disputeService.getDisputeDetail(id, user.id_user, isAdmin);

    if (!dispute) {
      return NextResponse.json(
        { success: false, message: 'Sengketa tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispute.messages,
    });
  } catch (error: any) {
    console.error('[GET /api/disputes/[id]/messages] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat pesan mediasi.' },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      );
    }

    const isAdmin = user.role?.nama_role?.toLowerCase() === 'admin';
    const message = await disputeService.sendMessage({
      disputeId: id,
      senderId: user.id_user,
      message: parsed.data.message,
      isAdmin,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pesan mediasi terkirim.',
        data: message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/disputes/[id]/messages] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengirim pesan.' },
      { status: 400 }
    );
  }
}

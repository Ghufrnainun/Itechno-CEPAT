import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { disputeService } from '@/services/dispute.service';
import { z } from 'zod';

const resolveDisputeSchema = z.object({
  resolution: z.string().min(5, 'Catatan putusan minimal 5 karakter.').max(2000),
  favor: z.enum(['WORKER', 'REQUESTER']),
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
      data: dispute,
    });
  } catch (error) {
    console.error('[GET /api/disputes/[id]] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat detail sengketa.' },
      { status: 400 }
    );
  }
}

export async function PATCH(
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

    if (!user || user.role?.nama_role?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat memutuskan sengketa.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = resolveDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      );
    }

    const result = await disputeService.resolveDispute({
      disputeId: id,
      adminId: user.id_user,
      resolution: parsed.data.resolution,
      favor: parsed.data.favor,
    });

    return NextResponse.json({
      success: true,
      message: 'Sengketa berhasil diputuskan dan dana escrow telah disesuaikan.',
      data: result,
    });
  } catch (error) {
    console.error('[PATCH /api/disputes/[id]] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memutuskan sengketa.' },
      { status: 400 }
    );
  }
}

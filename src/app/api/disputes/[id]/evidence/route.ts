import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { disputeService } from '@/services/dispute.service';
import { z } from 'zod';

const evidenceSchema = z.object({
  type: z.enum(['text', 'image']),
  content: z.string().min(1, 'Isi bukti tidak boleh kosong.').max(5000),
});

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
      select: { id_user: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = evidenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      );
    }

    const evidence = await disputeService.submitEvidence(
      id,
      user.id_user,
      parsed.data.type,
      parsed.data.content
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Bukti berhasil diunggah ke ruang sengketa.',
        data: evidence,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/disputes/[id]/evidence] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan bukti.' },
      { status: 400 }
    );
  }
}

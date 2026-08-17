import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { disputeService } from '@/services/dispute.service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { z } from 'zod';

const createDisputeSchema = z.object({
  taskId: z.string().min(1, 'ID Tugas wajib diisi.'),
  reason: z.string().min(3, 'Alasan minimal 3 karakter.').max(100, 'Alasan maksimal 100 karakter.'),
  description: z.string().min(10, 'Deskripsi permasalahan minimal 10 karakter.').max(2000, 'Deskripsi maksimal 2000 karakter.'),
  evidence: z
    .array(
      z.object({
        type: z.enum(['text', 'image']),
        content: z.string().min(1),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, 'api:disputes:list', {
      maxRequests: 60,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan.' },
        { status: 429 }
      );
    }

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

    const disputes = await disputeService.getDisputesByUser(user.id_user);

    return NextResponse.json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    console.error('[GET /api/disputes] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat daftar sengketa.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, 'api:disputes:create', {
      maxRequests: 10,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan pengajuan.' },
        { status: 429 }
      );
    }

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
    const parsed = createDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      );
    }

    const dispute = await disputeService.createDispute({
      taskId: parsed.data.taskId,
      reporterId: user.id_user,
      reason: parsed.data.reason,
      description: parsed.data.description,
      evidence: parsed.data.evidence,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan sengketa berhasil dibuat. Ruang mediasi telah dibuka.',
        data: dispute,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/disputes] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengajukan sengketa.' },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { disputeService } from '@/services/dispute.service';

export async function GET(request: NextRequest) {
  try {
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
        { success: false, message: 'Akses terlarang. Hanya Admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await disputeService.getAllDisputes({
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
      stats: result.stats,
    });
  } catch (error) {
    console.error('[GET /api/admin/disputes] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat sengketa admin.' },
      { status: 500 }
    );
  }
}

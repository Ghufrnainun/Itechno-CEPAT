import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { taskService } from '@/services/task.service';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, 'api:tasks:scheduled', {
      maxRequests: 60,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' },
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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    const roleParam = searchParams.get('role');
    const role =
      roleParam === 'worker' || roleParam === 'requester' || roleParam === 'all'
        ? roleParam
        : 'all';

    const countOnly = searchParams.get('count_only') === 'true';
    if (countOnly) {
      const count = await taskService.getScheduledTasksCount(user.id_user, { role });
      return NextResponse.json({
        success: true,
        count,
        data: [],
      });
    }

    const tasks = await taskService.getScheduledTasks(user.id_user, {
      month,
      year,
      role,
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('[GET /api/tasks/scheduled] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat jadwal tugas.' },
      { status: 500 }
    );
  }
}

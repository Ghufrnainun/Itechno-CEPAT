import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const period = searchParams.get("period") || "current"; // "current" | "last_month"

    // Get current user id
    let currentUserId = null;
    if (authUser?.email) {
      const dbUser = await prisma.user.findUnique({ where: { email: authUser.email } });
      if (dbUser) currentUserId = dbUser.id_user;
    }

    // We get the worker role id
    const workerRole = await prisma.role.findFirst({
      where: { nama_role: { equals: "worker", mode: "insensitive" } },
    });

    if (!workerRole) {
      return NextResponse.json({ success: false, message: "Worker role not found." }, { status: 500 });
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Calculate monthly leaderboard and current user's rank in one query
    const results: any[] = await prisma.$queryRawUnsafe(`
      WITH RankedScores AS (
        SELECT 
          u.id_user,
          u.nama_lengkap,
          u.avatar_url,
          u.level,
          u.total_completed,
          u.rating_avg,
          COALESCE(SUM(x.xp_amount), 0)::int AS xp,
          RANK() OVER (ORDER BY COALESCE(SUM(x.xp_amount), 0) DESC, u.total_completed DESC, u.rating_avg DESC)::int as rank
        FROM "User" u
        LEFT JOIN "XPLog" x ON u.id_user = x.id_user AND x.created_at >= $1 AND x.created_at <= $5
        WHERE u.id_role = $2
        GROUP BY u.id_user
      )
      SELECT * FROM RankedScores
      WHERE rank <= $3 OR id_user = $4
      ORDER BY rank ASC
    `, startDate, workerRole.id_role, limit, currentUserId || '00000000-0000-0000-0000-000000000000', endDate);

    // Separate top users and current user
    const topUsers = results.filter(r => r.rank <= limit);
    const currentUserStats = currentUserId ? results.find(r => r.id_user === currentUserId) : null;

    return NextResponse.json({
      success: true,
      data: topUsers,
      currentUser: currentUserStats || null,
    });
  } catch (error) {
    console.error("[GET /api/leaderboard] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil leaderboard." },
      { status: 500 }
    );
  }
}

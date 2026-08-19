import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "alltime";
    const limit = parseInt(searchParams.get("limit") || "20");

    // We get the worker role id
    const workerRole = await prisma.role.findFirst({
      where: { nama_role: { equals: "worker", mode: "insensitive" } },
    });

    if (!workerRole) {
      return NextResponse.json({ success: false, message: "Worker role not found." }, { status: 500 });
    }

    // All time uses the user's total xp directly
    const leaderboard = await prisma.$queryRawUnsafe(`
      SELECT 
        id_user, 
        nama_lengkap, 
        avatar_url, 
        xp, 
        level, 
        total_completed, 
        rating_avg,
        xp AS score
      FROM "User"
      WHERE id_role = $1
      ORDER BY score DESC, total_completed DESC, rating_avg DESC
      LIMIT $2
    `, workerRole.id_role, limit);

    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("[GET /api/leaderboard] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil leaderboard." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);

    // Start and end of the requested month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Query logs for the month using Prisma ORM
    const logs = await prisma.xPLog.findMany({
      where: {
        id_user: dbUser.id_user,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        xp_amount: true,
        created_at: true,
      },
    });

    // Aggregate XP per day (YYYY-MM-DD)
    const calendarData: Record<string, number> = {};
    for (const log of logs) {
      const d = new Date(log.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      calendarData[dateKey] = (calendarData[dateKey] || 0) + log.xp_amount;
    }

    // Fetch user streak data
    const streak = await prisma.userStreak.findUnique({
      where: { id_user: dbUser.id_user },
      select: { current_streak: true, longest_streak: true, last_activity_date: true },
    });

    return NextResponse.json({
      success: true,
      data: calendarData,
      streak: {
        current: streak?.current_streak ?? 0,
        longest: streak?.longest_streak ?? 0,
        last_activity: streak?.last_activity_date?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/xp/calendar] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data kalender XP." },
      { status: 500 }
    );
  }
}

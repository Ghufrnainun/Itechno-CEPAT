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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.xPLog.findMany({
        where: { id_user: dbUser.id_user },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.xPLog.count({
        where: { id_user: dbUser.id_user },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs.map((l) => ({
        id: l.id_xp_log,
        xp_amount: l.xp_amount,
        source: l.source || "SYSTEM",
        created_at: l.created_at.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/xp/history] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil riwayat XP." },
      { status: 500 }
    );
  }
}

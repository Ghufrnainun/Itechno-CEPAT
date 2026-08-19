import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const userBadges = await prisma.userBadge.findMany({
      where: { id_user: userId },
      include: {
        badge: true,
      },
      orderBy: {
        earned_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: userBadges.map((ub) => ({
        earned_at: ub.earned_at,
        ...ub.badge,
      })),
    });
  } catch (error) {
    console.error("[GET /api/users/[id]/badges] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar lencana." },
      { status: 500 }
    );
  }
}

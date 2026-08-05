import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ID User tidak valid." },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id_user: userId },
      include: {
        role: true,
        skills_user: {
          include: {
            skills_master: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dbUser,
    });
  } catch (error: any) {
    console.error(`[GET /api/users/${params?.id}] Error:`, error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil profil user." },
      { status: 500 }
    );
  }
}

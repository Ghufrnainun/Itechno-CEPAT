import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/saved-tasks/ids?ids=a,b,c
 * Mengembalikan daftar id_tasks yang sudah disimpan user login — buat cek status bookmark bulk.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser?.email) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const saved = await prisma.savedTask.findMany({
      where: {
        id_user: user.id_user,
        id_tasks: { in: ids },
      },
      select: { id_tasks: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: saved.map((s) => s.id_tasks),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/saved-tasks/ids] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil status bookmark." },
      { status: 500 }
    );
  }
}

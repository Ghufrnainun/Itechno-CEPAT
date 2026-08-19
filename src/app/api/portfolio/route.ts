import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ success: false, message: "user_id diperlukan." }, { status: 400 });
    }

    const items = await prisma.portfolioItem.findMany({
      where: { id_user: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("[GET /api/portfolio] Error:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil portfolio." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.email) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
    }

    // Get Prisma User
    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, image_url, related_task } = body;

    if (!title || !image_url) {
      return NextResponse.json({ success: false, message: "Title dan Image URL wajib diisi." }, { status: 400 });
    }

    const newItem = await prisma.portfolioItem.create({
      data: {
        id_user: user.id_user,
        title,
        description,
        image_url,
        related_task,
      },
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    console.error("[POST /api/portfolio] Error:", error);
    return NextResponse.json({ success: false, message: "Gagal menambahkan portfolio." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.email) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User tidak ditemukan." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id_portfolio = searchParams.get("id");

    if (!id_portfolio) {
      return NextResponse.json({ success: false, message: "id_portfolio diperlukan." }, { status: 400 });
    }

    // Verify ownership
    const item = await prisma.portfolioItem.findUnique({
      where: { id_portfolio },
    });

    if (!item) {
      return NextResponse.json({ success: false, message: "Portfolio tidak ditemukan." }, { status: 404 });
    }

    if (item.id_user !== user.id_user) {
      return NextResponse.json({ success: false, message: "Anda tidak berhak menghapus item ini." }, { status: 403 });
    }

    await prisma.portfolioItem.delete({
      where: { id_portfolio },
    });

    return NextResponse.json({ success: true, message: "Portfolio berhasil dihapus." });
  } catch (error) {
    console.error("[DELETE /api/portfolio] Error:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus portfolio." }, { status: 500 });
  }
}

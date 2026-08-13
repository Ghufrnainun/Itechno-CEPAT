import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File foto profil tidak ditemukan." },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `avatar_${authUser.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
      });

    let avatarUrl = "";

    if (uploadError) {
      // Fallback: create base64 data url if bucket is not configured
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      avatarUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { email: authUser.email },
      data: { avatar_url: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      data: { avatar_url: updatedUser.avatar_url },
    });
  } catch (error: any) {
    console.error("[POST /api/users/avatar] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengunggah foto profil." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, "api:users:avatar", {
      maxRequests: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak permintaan unggah. Silakan tunggu." },
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

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ukuran file maksimal 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes — only allow real JPEG, PNG, or WebP
    const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { success: false, message: "Format file tidak valid. Hanya gambar JPG, PNG, atau WEBP asli yang diizinkan." },
        { status: 400 }
      );
    }

    const ext = isJpeg ? "jpg" : isPng ? "png" : "webp";
    const fileId = crypto.randomUUID();
    const fileName = `${authUser.id}/${fileId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp",
        upsert: false,
      });

    // Fail closed — never store base64 data URLs in DB
    if (uploadError) {
      console.error("[POST /api/users/avatar] Storage upload failed:", uploadError);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan foto profil ke storage. Silakan coba lagi." },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

    const updatedUser = await prisma.user.update({
      where: { email: authUser.email },
      data: { avatar_url: data.publicUrl },
    });

    return NextResponse.json({
      success: true,
      data: { avatar_url: updatedUser.avatar_url },
    });
  } catch (error) {
    console.error("[POST /api/users/avatar] Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}
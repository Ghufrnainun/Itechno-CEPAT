import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "File tidak ditemukan." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "Ukuran file maksimal 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes header
    const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { success: false, message: "Format file tidak valid. Hanya gambar JPG, PNG, atau WEBP asli yang diizinkan." },
        { status: 400 }
      );
    }

    const ext = isJpeg ? "jpg" : isPng ? "png" : "webp";
    const fileId = crypto.randomUUID();
    const fileName = `${authUser.id}/${fileId}.${ext}`;

    // Gunakan Service Role Key untuk bypass RLS (karena authUser udah divalidasi di atas)
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await supabaseAdmin.storage
      .from("portfolios")
      .upload(fileName, buffer, {
        contentType: isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload API] Supabase upload failed:", uploadError);
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan file ke storage. Silakan coba lagi." },
        { status: 500 }
      );
    }

    const { data } = supabaseAdmin.storage.from("portfolios").getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
    });

  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal." }, { status: 500 });
  }
}

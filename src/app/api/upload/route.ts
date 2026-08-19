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

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Format file tidak didukung. Gunakan JPG, PNG, atau WEBP." }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `portfolio_${authUser.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("portfolios")
      .upload(fileName, file, { upsert: true });

    let publicUrl = "";

    if (uploadError) {
      console.error("[Upload API] Supabase upload failed, falling back to base64. Error:", uploadError);
      // Fallback if bucket is not created
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      publicUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      const { data } = supabase.storage.from("portfolios").getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });

  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal." }, { status: 500 });
  }
}

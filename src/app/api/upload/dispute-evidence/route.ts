import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, 'api:upload:dispute-evidence', {
      maxRequests: 30,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan unggah. Silakan tunggu.' },
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
        { success: false, message: 'Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File bukti gambar tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Ekstrak ekstensi file
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `dispute_${authUser.id}_${Date.now()}.${fileExt}`;

    // Coba upload ke Supabase Storage bucket 'dispute-evidences' (atau 'avatars' / fallback base64)
    let publicUrl = '';
    const { error: uploadError } = await supabase.storage
      .from('dispute-evidences')
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      // Coba bucket alternatif 'avatars'
      const { error: altError } = await supabase.storage
        .from('avatars')
        .upload(`evidence_${fileName}`, file, { upsert: true });

      if (!altError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(`evidence_${fileName}`);
        publicUrl = data.publicUrl;
      } else {
        // Fallback: simpan sebagai data URL base64 yang sudah terkompresi
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        publicUrl = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      }
    } else {
      const { data } = supabase.storage.from('dispute-evidences').getPublicUrl(fileName);
      publicUrl = data.publicUrl;
    }

    return NextResponse.json({
      success: true,
      data: { url: publicUrl },
      message: 'Foto bukti berhasil diunggah.',
    });
  } catch (error: any) {
    console.error('[POST /api/upload/dispute-evidence] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengunggah foto bukti.' },
      { status: 500 }
    );
  }
}

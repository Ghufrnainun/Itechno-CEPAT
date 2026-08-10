import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id }
    });
    
    if (!dbUser) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { skills } = body; // Array of { id_skill_master, deskripsi_pengalaman, certificate_url }

    // Hapus skill user yang lama (jika ada) biar data fresh
    await prisma.skillsUser.deleteMany({
      where: { id_user: dbUser.id_user }
    });

    // Insert skill user yang baru
    if (skills && Array.isArray(skills) && skills.length > 0) {
      await prisma.skillsUser.createMany({
        data: skills.map((s: any) => ({
          id_user: dbUser.id_user,
          id_skills_master: s.id_skill_master,
          deskripsi_pengalaman: s.deskripsi_pengalaman || null,
          certificate_url: s.certificate_url || null
        }))
      });
    }

    return NextResponse.json({ success: true, message: 'Skills berhasil disimpan' });
  } catch (error) {
    console.error('[POST /api/users/skills] Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id }
    });
    
    if (!dbUser) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const { skills } = body; // Array of { id_skill_master }

    // Jalankan penghapusan dan penambahan skills baru secara atomik dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      await tx.skillsUser.deleteMany({
        where: { id_user: dbUser.id_user }
      });

      if (skills && Array.isArray(skills) && skills.length > 0) {
        await tx.skillsUser.createMany({
          data: skills.map((s: any) => ({
            id_user: dbUser.id_user,
            id_skills_master: s.id_skill_master
          }))
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Skills berhasil disimpan' });
  } catch (error) {
    console.error('[POST /api/users/skills] Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}

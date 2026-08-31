import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/services/notification.service";

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

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: {
        role: true,
        skills_user: {
          include: {
            skills_master: true,
          },
        },
      },
    });

    if (dbUser?.is_banned) {
      const now = new Date();
      if (
        dbUser.ban_type === "TEMPORARY" &&
        dbUser.banned_until &&
        now > dbUser.banned_until
      ) {
        // Auto unban
        await prisma.user.update({
          where: { id_user: dbUser.id_user },
          data: {
            is_banned: false,
            ban_type: null,
            ban_reason: null,
            banned_at: null,
            banned_until: null,
          },
        });
        dbUser.is_banned = false;
      } else {
        await supabase.auth.signOut();
        return NextResponse.json(
          {
            success: false,
            is_banned: true,
            message: "Akun Anda telah ditangguhkan.",
            ban_details: {
              type: dbUser.ban_type ?? "PERMANENT",
              reason: dbUser.ban_reason || "",
              banned_at: dbUser.banned_at ? dbUser.banned_at.toISOString() : null,
              banned_until: dbUser.banned_until ? dbUser.banned_until.toISOString() : null,
            },
          },
          { status: 403 }
        );
      }
    }

    if (!dbUser) {
      const fallbackName =
        authUser.user_metadata?.nama_lengkap ||
        authUser.user_metadata?.full_name ||
        authUser.email.split("@")[0];

      return NextResponse.json({
        success: true,
        data: {
          id_user: authUser.id,
          nama_lengkap: fallbackName,
          email: authUser.email,
          username: authUser.user_metadata?.username || fallbackName.toLowerCase().replace(/\s+/g, ""),
          bio: "",
          total_balance: 0,
        },
      });
    }

    if (dbUser) {
      dbUser.total_balance = dbUser.total_balance - (dbUser.held_balance || 0);
    }

    return NextResponse.json({
      success: true,
      data: dbUser,
    });
  } catch (error: any) {
    console.error("[GET /api/users/me] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil profil user." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { nama_lengkap, bio, pendidikan_terakhir, no_telpon, alamat, role, skills, avatar_url, tagline } = body;

    // Find role ID if provided
    let roleId: string | undefined = undefined;
    if (role) {
      const roleName = role.toLowerCase() === "requester" ? "Requester" : "Worker";
      const targetRole = await prisma.role.findUnique({
        where: { nama_role: roleName },
      });
      if (targetRole) {
        roleId = targetRole.id_role;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: authUser.email },
      data: {
        ...(nama_lengkap && { nama_lengkap }),
        ...(bio !== undefined && { bio }),
        ...(pendidikan_terakhir !== undefined && { pendidikan_terakhir }),
        ...(no_telpon !== undefined && { no_telpon }),
        ...(alamat !== undefined && { alamat }),
        ...(roleId && { id_role: roleId }),
        ...(avatar_url && { avatar_url }),
        ...(tagline !== undefined && { tagline }),
      },
    });

    // Save skills if provided
    if (Array.isArray(skills)) {
      // Clear existing skills to handle updates and removals
      await prisma.skillsUser.deleteMany({
        where: { id_user: updatedUser.id_user },
      });

      for (const skillData of skills) {
        const isObject = typeof skillData === "object" && skillData !== null;
        const skillName = isObject ? skillData.nama_skill : skillData;
        
        if (!skillName) continue;

        const deskripsi_pengalaman = isObject ? skillData.deskripsi_pengalaman : null;
        let certificate_url = isObject ? skillData.certificate_url : null;

        if (certificate_url) {
          if (!certificate_url.startsWith('http://') && !certificate_url.startsWith('https://')) {
            certificate_url = `https://${certificate_url}`;
          }
          // Basic XSS check
          if (certificate_url.toLowerCase().includes('javascript:')) {
            certificate_url = null;
          }
        }

        let skillMaster = await prisma.skillsMaster.findUnique({
          where: { nama_skill: skillName },
        });

        if (!skillMaster) {
          skillMaster = await prisma.skillsMaster.create({
            data: { nama_skill: skillName },
          });
        }

        await prisma.skillsUser.create({
          data: {
            id_user: updatedUser.id_user,
            id_skills_master: skillMaster.id_skill_master,
            deskripsi_pengalaman,
            certificate_url,
          },
        });
      }
    }

    // Kirim notifikasi onboarding selesai jika ada skills (indikasi onboarding pertama kali)
    if (Array.isArray(skills) && skills.length > 0) {
      try {
        await notificationService.createNotification({
          userId: updatedUser.id_user,
          type: 'system',
          title: 'Profil Lengkap! 🎯',
          message: 'Profilmu sudah siap! Mulai jelajahi tugas di sekitarmu atau buat tugas pertamamu sekarang.',
          data: { onboarding_complete: true },
        })
      } catch (_) { /* non-blocking */ }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("[PUT /api/users/me] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengupdate profil." },
      { status: 500 }
    );
  }
}


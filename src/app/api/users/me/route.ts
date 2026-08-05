import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
    const { nama_lengkap, bio, pendidikan_terakhir, no_telpon, alamat, role, skills, avatar_url } = body;

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
        ...(bio && { bio }),
        ...(pendidikan_terakhir && { pendidikan_terakhir }),
        ...(no_telpon && { no_telpon }),
        ...(alamat && { alamat }),
        ...(roleId && { id_role: roleId }),
        ...(avatar_url && { avatar_url }),
      },
    });

    // Save skills if provided
    if (Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills) {
        let skillMaster = await prisma.skillsMaster.findUnique({
          where: { nama_skill: skillName },
        });

        if (!skillMaster) {
          skillMaster = await prisma.skillsMaster.create({
            data: { nama_skill: skillName },
          });
        }

        const existingSkillUser = await prisma.skillsUser.findFirst({
          where: {
            id_user: updatedUser.id_user,
            id_skills_master: skillMaster.id_skill_master,
          },
        });

        if (!existingSkillUser) {
          await prisma.skillsUser.create({
            data: {
              id_user: updatedUser.id_user,
              id_skills_master: skillMaster.id_skill_master,
            },
          });
        }
      }
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


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminToken } from "@/lib/admin/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ID User tidak valid." },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id_user: userId },
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
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const adminAuth = await verifyAdminToken(request);

    const isAdmin = adminAuth.valid;
    const isOwner = authUser?.id === dbUser.id_user || authUser?.email === dbUser.email;

    // Hide PII only if the user is completely unauthenticated (not logged in)
    // Logged-in users can see contact info so they can communicate
    if (!authUser && !isAdmin) {
      dbUser.email = "[Disembunyikan]";
      dbUser.no_telpon = "[Disembunyikan]";
      dbUser.alamat = "[Disembunyikan]";
    }

    return NextResponse.json({
      success: true,
      data: dbUser,
    });
  } catch (error: any) {
    console.error(`[GET /api/users/[id]] Error:`, error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil profil user." },
      { status: 500 }
    );
  }
}

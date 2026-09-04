import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userDbId = request.headers.get("x-user-db-id");
    let email = request.headers.get("x-auth-user-email");

    if (!userDbId && !email) {
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
      email = authUser.email;
    }

    try {
      if (userDbId) {
        await prisma.user.update({
          where: { id_user: userDbId },
          data: { last_seen_at: new Date() },
        });
      } else if (email) {
        await prisma.user.update({
          where: { email },
          data: { last_seen_at: new Date() },
        });
      }
    } catch (dbErr: any) {
      console.warn("[POST /api/users/ping] Heartbeat update deferred (reconnecting):", dbErr?.message || dbErr);
      return NextResponse.json({ success: true, message: "Ping diterima (antrean)" });
    }

    return NextResponse.json({ success: true, message: "Ping berhasil" });
  } catch (error) {
    console.error("[POST /api/users/ping] Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

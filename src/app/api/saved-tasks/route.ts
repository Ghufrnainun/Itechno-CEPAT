import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/saved-tasks — daftar tugas yang disimpan user yang login.
 * POST /api/saved-tasks — toggle bookmark: body { id_tasks }.
 *   - Kalau belum disimpan → simpan (return saved: true)
 *   - Kalau sudah disimpan → hapus (return saved: false)
 */
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

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const savedTasks = await prisma.savedTask.findMany({
      where: { id_user: user.id_user },
      orderBy: { created_at: "desc" },
      include: {
        task: {
          include: {
            status_task: true,
            kategori: true,
            requester: {
              select: {
                id_user: true,
                nama_lengkap: true,
                avatar_url: true,
                rating_avg: true,
              },
            },
          },
        },
      },
    });

    const data = savedTasks.map((s) => {
      const t = s.task;
      return {
        id_saved: s.id_saved,
        saved_at: s.created_at,
        task: {
          id_task: t.id_tasks,
          id_requester: t.id_requester,
          title: t.judul_tugas,
          description: t.deskripsi_tugas,
          compensation: t.kompensasi,
          status: t.status_task?.nama_status?.toLowerCase() ?? "open",
          duration_estimate: t.estimasi_waktu,
          created_at: t.created_at,
          is_bidding: t.is_bidding,
          budget_min: t.budget_min,
          budget_max: t.budget_max,
          scheduled_at: t.scheduled_at,
          scheduled_end: t.scheduled_end,
          max_applicants: t.max_applicants,
          requester_name: t.requester?.nama_lengkap,
          requester_avatar: t.requester?.avatar_url,
        },
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/saved-tasks] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil tugas tersimpan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { id_tasks } = body ?? {};

    if (!id_tasks || typeof id_tasks !== "string") {
      return NextResponse.json(
        { success: false, message: "id_tasks wajib diisi." },
        { status: 400 }
      );
    }

    // Pastikan task benar-benar ada
    const task = await prisma.task.findUnique({
      where: { id_tasks },
      select: { id_tasks: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan." },
        { status: 404 }
      );
    }

    const existing = await prisma.savedTask.findUnique({
      where: {
        id_user_id_tasks: {
          id_user: user.id_user,
          id_tasks,
        },
      },
    });

    if (existing) {
      // Sudah disimpan → hapus (unbookmark)
      await prisma.savedTask.delete({
        where: { id_saved: existing.id_saved },
      });
      return NextResponse.json({ success: true, saved: false });
    }

    // Belum disimpan → tambah
    await prisma.savedTask.create({
      data: {
        id_user: user.id_user,
        id_tasks,
      },
    });
    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error("[POST /api/saved-tasks] Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan tugas." },
      { status: 500 }
    );
  }
}

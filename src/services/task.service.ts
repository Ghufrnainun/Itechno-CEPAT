import { prisma } from '@/lib/prisma';
import { CreateTaskInput } from '@/lib/validations/task.schema';
import { notificationService } from '@/services/notification.service';
import { GamificationService } from '@/services/gamification.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  accepted: 'ASSIGNED',
};

const REVERSE_STATUS_MAP: Record<string, string> = {
  ASSIGNED: 'accepted',
};

function getDbStatusName(namaStatus: string): string {
  return STATUS_MAP[namaStatus.toLowerCase()] ?? namaStatus.toUpperCase();
}

function getFrontendStatusName(dbStatusName: string): string {
  const upper = dbStatusName.toUpperCase();
  return REVERSE_STATUS_MAP[upper] ?? upper.toLowerCase();
}

async function getStatusId(namaStatus: string): Promise<string> {
  const dbName = getDbStatusName(namaStatus);

  const status = await prisma.statusTask.findFirst({
    where: { nama_status: dbName },
  });
  if (!status)
    throw new Error(`Status task '${namaStatus}' tidak ditemukan di database.`);
  return status.id_status_task;
}

async function getApplicantStatusId(namaStatus: string): Promise<string> {
  const status = await prisma.statusTaskApplicants.findFirst({
    where: { nama_status: namaStatus.toUpperCase() },
  });
  if (!status)
    throw new Error(
      `Status applicant '${namaStatus}' tidak ditemukan di database.`,
    );
  return status.id_status_task_applicants;
}

// ─── Task Service ────────────────────────────────────────────────────────────

export const taskService = {
  /**
   * Buat task baru.
   * Simpan lokasi menggunakan raw SQL (PostGIS GEOGRAPHY).
   */
  async createTask(params: CreateTaskInput & { requesterId: string }) {
    const {
      judul_tugas,
      deskripsi_tugas,
      estimasi_waktu,
      kompensasi,
      latitude,
      longitude,
      requesterId,
      id_category,
      kategori,
      skill_requirements,
      max_applicants = 1,
      max_apply_attempts = 3,
      is_bidding = false,
      budget_min,
      budget_max,
    } = params;

    const openStatusId = await getStatusId('open');

    // Cari kategori yang sesuai — atau gunakan default (kategori pertama)
    let categoryId: string;
    if (id_category) {
      categoryId = id_category;
    } else if (kategori) {
      const cat = await prisma.taskCategory.findFirst({
        where: { nama_kategori: { contains: kategori, mode: 'insensitive' } },
      });
      if (cat) {
        categoryId = cat.id_category;
      } else {
        const defaultCat = await prisma.taskCategory.findFirst();
        if (!defaultCat)
          throw new Error('Tidak ada kategori task yang tersedia di database.');
        categoryId = defaultCat.id_category;
      }
    } else {
      const defaultCat = await prisma.taskCategory.findFirst();
      if (!defaultCat)
        throw new Error('Tidak ada kategori task yang tersedia di database.');
      categoryId = defaultCat.id_category;
    }

    const maxApplicantsNum = max_applicants ?? 1;
    const totalEscrow = kompensasi * maxApplicantsNum;

    const scheduledAtDate = params.scheduled_at ? new Date(params.scheduled_at) : null;
    const scheduledEndDate = params.scheduled_end ? new Date(params.scheduled_end) : null;

    // Seluruh pembuatan task dan penguncian escrow dijalankan atomik dalam 1 transaksi
    return await prisma.$transaction(async (tx) => {
      // 1. Kunci baris user requester untuk mencegah race condition double-spend
      const requesterRows = await tx.$queryRaw<Array<{ total_balance: number; held_balance: number }>>`
        SELECT total_balance, held_balance FROM "User" WHERE id_user = ${requesterId} FOR UPDATE
      `;
      const requester = requesterRows[0];
      if (!requester) throw new Error('User requester tidak ditemukan.');

      const availableBalance = requester.total_balance - requester.held_balance;
      if (availableBalance < totalEscrow) {
        throw new Error(
          `Saldo poin Anda tidak mencukupi untuk mengunci total escrow sebesar ${totalEscrow.toLocaleString('id-ID')} poin (${maxApplicantsNum} worker x ${kompensasi.toLocaleString('id-ID')} poin). Saldo tersedia: ${availableBalance.toLocaleString('id-ID')} poin.`
        );
      }

      // 2. Insert task dengan raw SQL agar bisa pakai ST_MakePoint untuk PostGIS
      const result = await tx.$queryRaw<{ id_tasks: string }[]>`
        INSERT INTO "Task" (
          id_tasks, id_requester, id_status_task,
          judul_tugas, deskripsi_tugas, estimasi_waktu, kompensasi,
          lokasi_geo, created_at, id_category, max_applicants, max_apply_attempts,
          is_bidding, budget_min, budget_max,
          scheduled_at, scheduled_end
        ) VALUES (
          gen_random_uuid(),
          ${requesterId},
          ${openStatusId},
          ${judul_tugas},
          ${deskripsi_tugas},
          ${estimasi_waktu},
          ${kompensasi},
          ST_MakePoint(${longitude}, ${latitude})::geography,
          NOW(),
          ${categoryId},
          ${max_applicants},
          ${max_apply_attempts},
          ${is_bidding},
          ${budget_min ?? null},
          ${budget_max ?? null},
          ${scheduledAtDate},
          ${scheduledEndDate}
        )
        RETURNING id_tasks
      `;

      const taskId = result[0]?.id_tasks;
      if (!taskId) throw new Error('Gagal membuat task.');

      // 3. Hold escrow pada Requester
      await tx.user.update({
        where: { id_user: requesterId },
        data: { held_balance: { increment: totalEscrow } },
      });

      // 4. Catat transaksi escrow lock (wajib dalam transaksi yang sama)
      await tx.transactions.create({
        data: {
          id_user: requesterId,
          nominal: totalEscrow,
          tipe_transaksi: 'KELUAR',
          sub_type: 'hold',
          deskripsi: `Escrow dikunci untuk task: ${judul_tugas} (${maxApplicantsNum} worker x ${kompensasi.toLocaleString('id-ID')} poin)`,
        },
      });

      // 5. Link skill requirements jika ada
      if (skill_requirements && skill_requirements.length > 0) {
        await tx.taskRequirements.createMany({
          data: skill_requirements.map((id) => ({ id_tasks: taskId, id_skill_master: id })),
        });
      }

      return taskId;
    });
  },

  /**
   * Ambil semua task dengan filter opsional.
   * Untuk nearby tasks, kita pakai raw PostGIS query.
   */
  async getTasks(params: {
    status?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    requesterId?: string;
  }) {
    const { status, lat, lng, radiusKm = 2, requesterId } = params;

    // Jika ada koordinat, gunakan PostGIS geo-query
    if (lat !== undefined && lng !== undefined) {
      const radiusMeters = radiusKm * 1000;
      const statusValue = getDbStatusName(status ?? 'open');

      const tasks = await prisma.$queryRaw<
        Array<{
          id_tasks: string;
          judul_tugas: string;
          deskripsi_tugas: string;
          estimasi_waktu: string | null;
          kompensasi: number;
          status: string;
          created_at: Date;
          id_requester: string;
          requester_name: string;
          requester_avatar: string | null;
          distance_m: number;
          latitude: number;
          longitude: number;
        }>
      >`
        SELECT
          t.id_tasks,
          t.judul_tugas,
          t.deskripsi_tugas,
          t.estimasi_waktu,
          t.kompensasi,
          st.nama_status AS status,
          t.created_at,
          t.id_requester,
          u.nama_lengkap AS requester_name,
          u.avatar_url AS requester_avatar,
          ST_Distance(t.lokasi_geo, ST_MakePoint(${lng}, ${lat})::geography, true) AS distance_m,
          ST_Y(t.lokasi_geo::geometry) AS latitude,
          ST_X(t.lokasi_geo::geometry) AS longitude
        FROM "Task" t
        JOIN "StatusTask" st ON st.id_status_task = t.id_status_task
        JOIN "User" u ON u.id_user = t.id_requester
        WHERE
          t.lokasi_geo IS NOT NULL
          AND ST_DWithin(t.lokasi_geo, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters}, true)
          AND st.nama_status = ${statusValue}
        ORDER BY distance_m ASC
        LIMIT 50
      `;
      return tasks.map((t) => ({
        ...t,
        status: getFrontendStatusName(t.status),
      }));
    }

    // Tanpa koordinat: filter biasa
    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status_task = { nama_status: getDbStatusName(status) };
    }
    if (requesterId) {
      whereClause.id_requester = requesterId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        status_task: { select: { nama_status: true } },
        requester: {
          select: { id_user: true, nama_lengkap: true, avatar_url: true },
        },
        requirements: {
          include: { skills_master: { select: { id_skill_master: true, nama_skill: true, icon: true } } },
        },
        _count: { select: { applicants: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return tasks.map((t) => ({
      id_tasks: t.id_tasks,
      judul_tugas: t.judul_tugas,
      deskripsi_tugas: t.deskripsi_tugas,
      estimasi_waktu: t.estimasi_waktu,
      kompensasi: t.kompensasi,
      status: getFrontendStatusName(t.status_task.nama_status),
      created_at: t.created_at,
      completed_at: t.completed_at,
      accepted_at: t.accepted_at,
      id_requester: t.id_requester,
      requester_name: t.requester.nama_lengkap,
      requester_avatar: t.requester.avatar_url,
      requirements: t.requirements.map((r) => r.skills_master.nama_skill),
      applicant_count: t._count.applicants,
    }));
  },

  /**
   * Detail task lengkap + applicants + reviews (dari Requester/Worker)
   */
  async getTaskById(taskId: string, viewerUserId?: string) {
    // Jalankan seluruh query database secara paralel untuk memangkas round-trip database dari ~200ms ke ~50ms
    const [task, rawTaskResult, rawApplicantsResult, viewerApp] = await Promise.all([
      prisma.task.findUnique({
        where: { id_tasks: taskId },
        include: {
          status_task: { select: { nama_status: true } },
          requester: {
            select: {
              id_user: true,
              nama_lengkap: true,
              avatar_url: true,
              rating_avg: true,
              total_completed: true,
            },
          },
          requirements: {
            include: { skills_master: { select: { id_skill_master: true, nama_skill: true, icon: true } } },
          },
          applicants: {
            include: {
              worker: {
                select: {
                  id_user: true,
                  nama_lengkap: true,
                  avatar_url: true,
                  rating_avg: true,
                  total_completed: true,
                  pendidikan_terakhir: true,
                },
              },
              status_applicant: { select: { nama_status: true } },
            },
            orderBy: { applied_at: 'asc' },
          },
          reviews: {
            include: {
              rater: {
                select: { id_user: true, nama_lengkap: true, avatar_url: true },
              },
              ratee: {
                select: { id_user: true, nama_lengkap: true, avatar_url: true },
              },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      }),
      // Ambil koordinat & kolom baru via raw query (membypass cached Prisma SELECT list)
      prisma.$queryRaw<
        Array<{
          latitude: number | null;
          longitude: number | null;
          max_applicants: number | null;
          max_apply_attempts: number | null;
          estimasi_waktu: string | null;
          is_bidding: boolean | null;
          budget_min: number | null;
          budget_max: number | null;
          scheduled_at: Date | null;
          scheduled_end: Date | null;
        }>
      >`
        SELECT
          ST_Y(lokasi_geo::geometry) AS latitude,
          ST_X(lokasi_geo::geometry) AS longitude,
          max_applicants,
          max_apply_attempts,
          estimasi_waktu,
          is_bidding,
          budget_min,
          budget_max,
          scheduled_at,
          scheduled_end
        FROM "Task"
        WHERE id_tasks = ${taskId}
      `,
      // Ambil status worker_confirmed & bid_amount secara presisi via raw query
      prisma.$queryRaw<
        Array<{
          id_task_applicants: string;
          worker_confirmed: boolean | null;
          bid_amount: number | null;
        }>
      >`
        SELECT id_task_applicants, worker_confirmed, bid_amount
        FROM "TaskApplicants"
        WHERE id_tasks = ${taskId}
      `,
      viewerUserId
        ? prisma.taskApplicants.findFirst({
            where: { id_tasks: taskId, id_worker: viewerUserId },
            include: { status_applicant: { select: { nama_status: true } } },
          })
        : Promise.resolve(null),
    ]);

    if (!task) return null;

    const rawTask = rawTaskResult[0];
    const geo = {
      latitude: rawTask?.latitude ?? null,
      longitude: rawTask?.longitude ?? null,
    };

    const confirmedMap = new Map<string, boolean>();
    const bidMap = new Map<string, number | null>();
    rawApplicantsResult.forEach((r) => {
      confirmedMap.set(r.id_task_applicants, r.worker_confirmed === true);
      bidMap.set(r.id_task_applicants, r.bid_amount ?? null);
    });

    // Cek apakah viewer sudah apply dan ambil infonya
    let hasApplied = false;
    let viewerApplication: {
      id_task_applicants: string;
      status: string;
      apply_count: number;
      alasan_penolakan: string | null;
      pesan: string | null;
      bid_amount: number | null;
    } | null = null;

    if (viewerApp) {
      hasApplied = viewerApp.status_applicant.nama_status.toLowerCase() !== 'rejected';
      viewerApplication = {
        id_task_applicants: viewerApp.id_task_applicants,
        status: viewerApp.status_applicant.nama_status.toLowerCase(),
        apply_count: viewerApp.apply_count,
        alasan_penolakan: viewerApp.alasan_penolakan,
        pesan: viewerApp.pesan,
        bid_amount: viewerApp.bid_amount ?? null,
      };
    }

    return {
      id_tasks: task.id_tasks,
      judul_tugas: task.judul_tugas,
      deskripsi_tugas: task.deskripsi_tugas,
      estimasi_waktu: rawTask?.estimasi_waktu ?? task.estimasi_waktu,
      kompensasi: task.kompensasi,
      status: getFrontendStatusName(task.status_task.nama_status),
      // worker_started: true ketika SEMUA accepted worker telah konfirmasi
      worker_started: task.applicants
        .filter((a) => a.status_applicant.nama_status.toLowerCase() === 'accepted')
        .every((a) => confirmedMap.get(a.id_task_applicants) === true),
      requester_started: task.requester_started,
      max_applicants: rawTask?.max_applicants ?? task.max_applicants ?? 1,
      max_apply_attempts: rawTask?.max_apply_attempts ?? task.max_apply_attempts ?? 3,
      is_bidding: rawTask?.is_bidding === true,
      budget_min: rawTask?.budget_min ?? null,
      budget_max: rawTask?.budget_max ?? null,
      created_at: task.created_at,
      completed_at: task.completed_at,
      accepted_at: task.accepted_at,
      scheduled_at: rawTask?.scheduled_at ?? (task as any).scheduled_at ?? null,
      scheduled_end: rawTask?.scheduled_end ?? (task as any).scheduled_end ?? null,
      latitude: geo.latitude,
      longitude: geo.longitude,
      id_requester: task.id_requester,
      requester: task.requester,
      requirements: task.requirements.map((r) => ({
        id_skill: r.skills_master.id_skill_master,
        nama_skill: r.skills_master.nama_skill,
        icon: r.skills_master.icon,
      })),
      applicants: (() => {
        const isRequesterViewer = viewerUserId === task.id_requester;
        const bidding = rawTask?.is_bidding === true;
        // Sealed bid: viewer yang bukan pemilik task tidak boleh melihat
        // penawaran worker lain. Pada task bidding, pelamar yang masih
        // pending disembunyikan sepenuhnya dari viewer non-requester
        // (identitas + jumlah penawar adalah informasi sensitif lelang);
        // hanya worker yang sudah accepted yang ditampilkan (dibutuhkan
        // untuk tampilan tim setelah kuota terpenuhi).
        const visibleApplicants = bidding && !isRequesterViewer
          ? task.applicants.filter(
              (a) => a.status_applicant.nama_status.toLowerCase() === 'accepted',
            )
          : task.applicants;
        return visibleApplicants.map((a) => ({
          id_task_applicants: a.id_task_applicants,
          id_worker: a.id_worker,
          pesan: bidding && !isRequesterViewer ? null : a.pesan,
          status: a.status_applicant.nama_status.toLowerCase(),
          apply_count: a.apply_count,
          alasan_penolakan: a.alasan_penolakan,
          applied_at: a.applied_at,
          worker_confirmed: confirmedMap.get(a.id_task_applicants) === true,
          bid_amount: bidding && !isRequesterViewer ? null : bidMap.get(a.id_task_applicants) ?? null,
          worker: a.worker,
        }));
      })(),
      reviews: task.reviews.map((r) => ({
        id_reviews: r.id_reviews,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        rater: r.rater,
        ratee: r.ratee,
      })),
      has_applied: hasApplied,
      viewer_application: viewerApplication,
    };
  },

  /**
   * Worker apply ke task.
   * Untuk task bidding, worker wajib menyertakan harga penawaran (bidAmount)
   * yang berada di dalam range budget_min..budget_max requester (sealed bid).
   */
  async applyToTask(taskId: string, workerId: string, pesan?: string, bidAmount?: number) {
    // Validasi: task harus 'open'
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        requester: { select: { id_user: true, nama_lengkap: true } },
        _count: { select: { applicants: true } },
      },
    });
    if (!task) throw new Error('Task tidak ditemukan.');
    if (task.status_task.nama_status.toLowerCase() !== 'open')
      throw new Error('Task sudah tidak menerima lamaran.');
    if (task.id_requester === workerId)
      throw new Error('Anda tidak bisa melamar task milik sendiri.');

    // Cek duplikasi / status lamaran sebelumnya
    const existing = await prisma.taskApplicants.findFirst({
      where: { id_tasks: taskId, id_worker: workerId },
      include: { status_applicant: true },
    });

    const rawTaskConfig = await prisma.$queryRaw<
      Array<{
        max_applicants: number;
        max_apply_attempts: number;
        is_bidding: boolean | null;
        budget_min: number | null;
        budget_max: number | null;
      }>
    >`
      SELECT max_applicants, max_apply_attempts, is_bidding, budget_min, budget_max
      FROM "Task" WHERE id_tasks = ${taskId}
    `;

    const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
    const maxAttempts = rawTaskConfig[0]?.max_apply_attempts ?? task.max_apply_attempts ?? 3;
    const isBidding = rawTaskConfig[0]?.is_bidding === true;
    const budgetMin = rawTaskConfig[0]?.budget_min ?? null;
    const budgetMax = rawTaskConfig[0]?.budget_max ?? null;

    // ─── Validasi bid untuk task bidding ─────────────────────────────────────
    if (isBidding) {
      if (typeof bidAmount !== 'number' || !Number.isFinite(bidAmount) || bidAmount <= 0) {
        throw new Error(
          'Task ini menggunakan mode bidding: wajib menyertakan harga penawaran.',
        );
      }
      if (budgetMin !== null && bidAmount < budgetMin) {
        throw new Error(
          `Harga penawaran minimal ${budgetMin.toLocaleString('id-ID')} poin sesuai budget requester.`,
        );
      }
      if (budgetMax !== null && bidAmount > budgetMax) {
        throw new Error(
          `Harga penawaran maksimal ${budgetMax.toLocaleString('id-ID')} poin sesuai budget requester.`,
        );
      }
    } else if (typeof bidAmount === 'number') {
      throw new Error(
        'Task ini menggunakan harga tetap, tidak perlu menyertakan harga penawaran.',
      );
    }

    // Kuota pelamar: task bidding terbuka untuk banyak penawar (sealed bids, max 25).
    // Untuk task harga tetap: cek apakah kuota pekerja yang diterima (accepted) sudah penuh.
    // Jika belum penuh, izinkan pelamar baru mendaftar (dengan batas antrean pending 25).
    const BIDDING_APPLICANT_CAP = 25;
    if (!existing) {
      if (isBidding) {
        if (task._count.applicants >= BIDDING_APPLICANT_CAP) {
          throw new Error(`Task ini sudah menerima jumlah penawaran maksimal (${BIDDING_APPLICANT_CAP} bid).`);
        }
      } else {
        const acceptedCount = await prisma.taskApplicants.count({
          where: {
            id_tasks: taskId,
            status_applicant: { nama_status: { equals: 'ACCEPTED', mode: 'insensitive' } },
          },
        });
        if (acceptedCount >= maxApplicants) {
          throw new Error(`Tugas ini sudah memiliki pekerja yang cukup (${maxApplicants} pekerja telah diterima).`);
        }

        const pendingCount = await prisma.taskApplicants.count({
          where: {
            id_tasks: taskId,
            status_applicant: { nama_status: { equals: 'PENDING', mode: 'insensitive' } },
          },
        });
        if (pendingCount >= 25) {
          throw new Error('Tugas ini sedang meninjau batas maksimal antrean pelamar (25 pelamar).');
        }
      }
    }

    const pendingStatusId = await getApplicantStatusId('pending');

    if (existing) {
      const currentAppStatus = existing.status_applicant.nama_status.toLowerCase();
      if (currentAppStatus === 'pending' || currentAppStatus === 'accepted') {
        throw new Error('Anda sudah melamar task ini sebelumnya.');
      }

      // Jika status REJECTED, cek batas percobaan
      if (existing.apply_count >= maxAttempts) {
        throw new Error(`Anda telah mencapai batas maksimal percobaan melamar (${maxAttempts} kali) untuk tugas ini.`);
      }

      // Worker melamar kembali (re-apply) — sekalian memperbarui bid
      const updatedApplicant = await prisma.taskApplicants.update({
        where: { id_task_applicants: existing.id_task_applicants },
        data: {
          id_status_task_applicants: pendingStatusId,
          apply_count: { increment: 1 },
          pesan: pesan ?? null,
          bid_amount: bidAmount ?? null,
          alasan_penolakan: null,
          applied_at: new Date(),
        },
      });

      // Notifikasi ke Requester
      const workerData = await prisma.user.findUnique({
        where: { id_user: workerId },
        select: { nama_lengkap: true },
      });

      try {
        await notificationService.createNotification({
          userId: task.id_requester,
          type: 'apply',
          title: isBidding ? 'Bid Baru Masuk! 🏷️' : 'Pelamar Melamar Kembali! 🔄',
          message: isBidding
            ? `${workerData?.nama_lengkap ?? 'Seseorang'} menawar ${bidAmount!.toLocaleString('id-ID')} poin untuk task "${task.judul_tugas}".`
            : `${workerData?.nama_lengkap ?? 'Seseorang'} mengajukan lamaran kembali untuk task "${task.judul_tugas}".`,
          data: { task_id: taskId, applicant_id: updatedApplicant.id_task_applicants },
        });
      } catch (_) {
        /* non-blocking */
      }

      return updatedApplicant;
    }

    const applicant = await prisma.taskApplicants.create({
      data: {
        id_tasks: taskId,
        id_worker: workerId,
        id_status_task_applicants: pendingStatusId,
        pesan: pesan ?? null,
        bid_amount: bidAmount ?? null,
        apply_count: 1,
      },
    });

    // Notifikasi ke Requester
    const workerData = await prisma.user.findUnique({
      where: { id_user: workerId },
      select: { nama_lengkap: true },
    });

    try {
      await notificationService.createNotification({
        userId: task.id_requester,
        type: 'apply',
        title: isBidding ? 'Bid Baru Masuk! 🏷️' : 'Ada Pelamar Baru! 🎉',
        message: isBidding
          ? `${workerData?.nama_lengkap ?? 'Seseorang'} menawar ${bidAmount!.toLocaleString('id-ID')} poin untuk task "${task.judul_tugas}".`
          : `${workerData?.nama_lengkap ?? 'Seseorang'} melamar task "${task.judul_tugas}".`,
        data: { task_id: taskId, applicant_id: applicant.id_task_applicants },
      });
    } catch (_) {
      /* non-blocking */
    }

    return applicant;
  },

  /**
   * Worker membatalkan lamaran (hanya jika task masih open)
   */
  async cancelApplication(taskId: string, workerId: string) {
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: { status_task: true },
    });

    if (!task) throw new Error('Task tidak ditemukan.');
    if (task.status_task.nama_status.toLowerCase() !== 'open') {
      throw new Error(
        'Tidak dapat membatalkan lamaran, task sudah tidak menerima pelamar.',
      );
    }

    const existing = await prisma.taskApplicants.findFirst({
      where: { id_tasks: taskId, id_worker: workerId },
      include: { status_applicant: { select: { nama_status: true } } },
    });

    if (!existing) throw new Error('Lamaran tidak ditemukan.');

    // Task bidding: penawaran yang sudah diterima tidak boleh ditarik mundur.
    // Escrow slot tersebut sudah disesuaikan ke nilai bid (selisihnya
    // di-refund ke requester saat accept), jadi penarikan akan membuat
    // pembukuan held_balance tidak seimbang saat task dibatalkan.
    if (
      task.is_bidding &&
      existing.status_applicant.nama_status.toLowerCase() === 'accepted'
    ) {
      throw new Error(
        'Penawaran Anda sudah diterima dan dana escrow telah disesuaikan. Hubungi pemberi tugas bila ingin mengundurkan diri.',
      );
    }

    const rejectedStatusId = await getApplicantStatusId('rejected');

    await prisma.taskApplicants.update({
      where: { id_task_applicants: existing.id_task_applicants },
      data: {
        id_status_task_applicants: rejectedStatusId,
        alasan_penolakan: 'Dibatalkan oleh pelamar',
      },
    });

    return { success: true };
  },

  /**
   * Worker mengubah penawaran (bid) miliknya yang masih pending.
   * Hanya untuk task bidding. Bid baru harus tetap dalam range budget.
   * Bid yang sudah accepted/rejected tidak bisa diubah.
   */
  async updateBid(taskId: string, workerId: string, newBidAmount: number) {
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: { status_task: true },
    });

    if (!task) throw new Error('Task tidak ditemukan.');
    if (!task.is_bidding) {
      throw new Error('Task ini menggunakan harga tetap, tidak ada penawaran yang bisa diubah.');
    }
    if (task.status_task.nama_status.toLowerCase() !== 'open') {
      throw new Error('Task sudah tidak menerima penawaran.');
    }

    const existing = await prisma.taskApplicants.findFirst({
      where: { id_tasks: taskId, id_worker: workerId },
      include: { status_applicant: { select: { nama_status: true } } },
    });
    if (!existing) throw new Error('Anda belum melamar task ini.');

    const status = existing.status_applicant.nama_status.toLowerCase();
    if (status !== 'pending') {
      throw new Error(
        status === 'accepted'
          ? 'Penawaran Anda sudah diterima dan tidak dapat diubah.'
          : 'Penawaran Anda sudah ditolak dan tidak dapat diubah.',
      );
    }

    // Validasi range budget (sealed bid)
    const rawRange = await prisma.$queryRaw<Array<{ budget_min: number | null; budget_max: number | null }>>`
      SELECT budget_min, budget_max FROM "Task" WHERE id_tasks = ${taskId}
    `;
    const budgetMin = rawRange[0]?.budget_min ?? null;
    const budgetMax = rawRange[0]?.budget_max ?? null;

    if (!Number.isFinite(newBidAmount) || newBidAmount <= 0) {
      throw new Error('Harga penawaran tidak valid.');
    }
    if (budgetMin !== null && newBidAmount < budgetMin) {
      throw new Error(`Harga penawaran minimal ${budgetMin.toLocaleString('id-ID')} poin sesuai budget requester.`);
    }
    if (budgetMax !== null && newBidAmount > budgetMax) {
      throw new Error(`Harga penawaran maksimal ${budgetMax.toLocaleString('id-ID')} poin sesuai budget requester.`);
    }

    // Update bid di bawah lock baris Task — serialisasi dengan transaksi accept.
    // Tanpa ini, edit bid bisa terjadi tepat saat requester meng-accept:
    // refund selisih dihitung dari bid lama, tapi payout memakai bid baru
    // (atau sebaliknya) → pembukuan escrow tidak seimbang.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE`;

      // Re-cek status di bawah lock (mungkin baru di-accept paralel)
      const freshStatus = await tx.$queryRaw<Array<{ nama_status: string }>>`
        SELECT sta.nama_status FROM "TaskApplicants" ta
        JOIN "StatusTaskApplicants" sta ON sta.id_status_task_applicants = ta.id_status_task_applicants
        WHERE ta.id_task_applicants = ${existing.id_task_applicants}
      `;
      const statusNow = freshStatus[0]?.nama_status.toLowerCase() ?? status;
      if (statusNow !== 'pending') {
        throw new Error(
          statusNow === 'accepted'
            ? 'Penawaran Anda baru saja diterima dan tidak dapat diubah.'
            : 'Penawaran Anda sudah ditolak dan tidak dapat diubah.',
        );
      }

      return tx.taskApplicants.update({
        where: { id_task_applicants: existing.id_task_applicants },
        data: { bid_amount: newBidAmount },
      });
    });

    return { success: true, data: { id_task_applicants: updated.id_task_applicants, bid_amount: updated.bid_amount } };
  },

  /**
   * Requester: accept atau reject applicant (dengan alasan penolakan opsional)
   */
  async updateApplicantStatus(
    applicantId: string,
    requesterId: string,
    action: 'accept' | 'reject',
    alasan_penolakan?: string,
    expectedBidAmount?: number,
  ) {
    const applicant = await prisma.taskApplicants.findUnique({
      where: { id_task_applicants: applicantId },
      include: {
        task: { include: { status_task: true, requester: true } },
        worker: { select: { id_user: true, nama_lengkap: true } },
        status_applicant: true,
      },
    });

    if (!applicant) throw new Error('Data lamaran tidak ditemukan.');
    if (applicant.task.id_requester !== requesterId)
      throw new Error('Anda tidak memiliki akses ke task ini.');
    if (applicant.task.status_task.nama_status.toLowerCase() !== 'open')
      throw new Error('Task sudah tidak dalam status open.');

    // Guard idempotensi: lamaran yang sudah diputuskan tidak boleh diproses ulang.
    // Tanpa ini, double-click / request ganda pada "Terima Bid" bisa memicu
    // refund selisih escrow dua kali (held_balance jebol).
    const currentApplicantStatus = applicant.status_applicant.nama_status.toLowerCase();
    if (currentApplicantStatus !== 'pending') {
      throw new Error(
        currentApplicantStatus === 'accepted'
          ? 'Lamaran ini sudah diterima sebelumnya.'
          : 'Lamaran ini sudah ditolak sebelumnya.',
      );
    }

    if (
      action === 'accept' &&
      expectedBidAmount !== undefined &&
      applicant.bid_amount !== null &&
      expectedBidAmount !== applicant.bid_amount
    ) {
      throw new Error('Penawaran harga telah berubah. Silakan muat ulang daftar penawaran.');
    }

    if (action === 'accept') {
      const acceptedStatusId = await getApplicantStatusId('accepted');
      const rejectedStatusId = await getApplicantStatusId('rejected');
      const taskAcceptedStatusId = await getStatusId('accepted');
      const pendingStatusId = await getApplicantStatusId('pending');

      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number }>>`
        SELECT max_applicants FROM "Task" WHERE id_tasks = ${applicant.id_tasks}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? applicant.task.max_applicants ?? 1;

      // ─── Accept ter-serialisasi: lock baris Task (FOR UPDATE) ──────────────
      // Semua accept paralel untuk task ini antre di lock yang sama, sehingga:
      //  • double-click / retry / dua tab pada bid yang sama → cuma 1 yang lolos
      //    (compare-and-swap pending→accepted), sisanya gagal tanpa efek;
      //  • dua bid BERBEDA di-accept bersamaan → kuota dicek di bawah lock,
      //    accept yang melebihi kuota di-rollback total (tanpa refund).
      // Seluruh mutasi escrow terjadi atomik dalam satu transaksi.
      const acceptedCount = await prisma.$transaction(async (tx) => {
        // 1. Kunci baris task — titik serialisasi semua accept paralel
        await tx.$queryRaw`SELECT 1 FROM "Task" WHERE id_tasks = ${applicant.id_tasks} FOR UPDATE`;

        // 2. Compare-and-swap pending→accepted: hanya 1 request menang per lamaran
        const casResult = await tx.$executeRaw`
          UPDATE "TaskApplicants"
          SET id_status_task_applicants = ${acceptedStatusId}
          WHERE id_task_applicants = ${applicantId}
            AND id_status_task_applicants = ${pendingStatusId}
        `;
        if (Number(casResult) === 0) {
          throw new Error('Lamaran ini baru saja diproses oleh request lain. Muat ulang daftar pelamar.');
        }

        // 3. Cek kuota di bawah lock (count sudah termasuk applicant ini)
        const countRow = await tx.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::bigint AS count FROM "TaskApplicants"
          WHERE id_tasks = ${applicant.id_tasks}
            AND id_status_task_applicants = ${acceptedStatusId}
        `;
        const totalAccepted = Number(countRow[0]?.count ?? 0);
        if (totalAccepted > maxApplicants) {
          throw new Error(`Kuota worker sudah penuh (${maxApplicants} worker). Muat ulang daftar pelamar.`);
        }

        // 4. Bidding escrow (spek C): refund selisih budget_max − bid
        const rawBiddingConfig = await tx.$queryRaw<
          Array<{ is_bidding: boolean | null; budget_max: number | null }>
        >`
          SELECT is_bidding, budget_max FROM "Task" WHERE id_tasks = ${applicant.id_tasks}
        `;
        const biddingCfg = rawBiddingConfig[0];

        const slotHeldAmount =
          typeof applicant.bid_amount === 'number'
            ? applicant.bid_amount
            : applicant.task.kompensasi;

        // Pembukuan hold per slot (dipakai saat task selesai/dibatalkan)
        await tx.$executeRaw`
          UPDATE "Task"
          SET held_slots_json = COALESCE(
                COALESCE(held_slots_json, '{}')::jsonb
                || jsonb_build_object(${applicant.id_task_applicants}::text, ${slotHeldAmount}::float8),
                '{}'::jsonb
              )::text
          WHERE id_tasks = ${applicant.id_tasks}
        `;

        if (biddingCfg?.is_bidding === true && typeof applicant.bid_amount === 'number') {
          const bidDiff =
            (biddingCfg.budget_max ?? applicant.task.kompensasi) - applicant.bid_amount;
          if (bidDiff > 0) {
            await tx.user.update({
              where: { id_user: applicant.task.id_requester },
              data: { held_balance: { decrement: bidDiff } },
            });

            await tx.transactions.create({
              data: {
                id_user: applicant.task.id_requester,
                nominal: bidDiff,
                tipe_transaksi: 'MASUK',
                sub_type: 'refund',
                deskripsi: `Pengembalian selisih bid (${bidDiff.toLocaleString('id-ID')} poin) untuk task: ${applicant.task.judul_tugas}`,
              },
            });
          }
        }

        return totalAccepted;
      });

      const isQuotaFull = acceptedCount >= maxApplicants;

      if (isQuotaFull) {
        // Jika kuota sudah penuh, reject semua pelamar tersisa dan ubah task status ke 'accepted'
        const otherApplicants = await prisma.taskApplicants.findMany({
          where: {
            id_tasks: applicant.id_tasks,
            status_applicant: { nama_status: { equals: 'pending', mode: 'insensitive' } },
          },
          select: { id_worker: true },
        });

        await prisma.taskApplicants.updateMany({
          where: {
            id_tasks: applicant.id_tasks,
            status_applicant: { nama_status: { equals: 'pending', mode: 'insensitive' } },
          },
          data: { id_status_task_applicants: rejectedStatusId },
        });

        await prisma.task.update({
          where: { id_tasks: applicant.id_tasks },
          data: {
            id_status_task: taskAcceptedStatusId,
            accepted_at: new Date(),
          },
        });

        // Notifikasi ke SEMUA pelamar lain yang di-reject
        try {
          await Promise.allSettled(
            otherApplicants.map((other) =>
              notificationService.createNotification({
                userId: other.id_worker,
                type: 'reject',
                title: 'Kuota Worker Penuh 😔',
                message: `Maaf, kuota worker untuk task "${applicant.task.judul_tugas}" sudah penuh. Coba task lain!`,
                data: { task_id: applicant.id_tasks },
              }),
            ),
          );
        } catch (_) {}
      }

      // Notifikasi ke worker yang diterima
      try {
        await notificationService.createNotification({
          userId: applicant.id_worker,
          type: 'accept',
          title: 'Lamaranmu Diterima! ✅',
          message: isQuotaFull
            ? `Kamu dipilih untuk mengerjakan "${applicant.task.judul_tugas}". Segera mulai!`
            : `Kamu diterima untuk task "${applicant.task.judul_tugas}"! Mohon tunggu Requester mencari worker tambahan.`,
          data: { task_id: applicant.id_tasks },
        });
      } catch (_) {
        /* non-blocking */
      }
    } else {
      // Reject
      const rejectedStatusId = await getApplicantStatusId('rejected');
      await prisma.taskApplicants.update({
        where: { id_task_applicants: applicantId },
        data: {
          id_status_task_applicants: rejectedStatusId,
          alasan_penolakan: alasan_penolakan ?? null,
        },
      });

      // Notifikasi ke worker yang ditolak
      try {
        const notifMsg = alasan_penolakan
          ? `Maaf, lamaranmu untuk task "${applicant.task.judul_tugas}" ditolak. Alasan: "${alasan_penolakan}".`
          : `Maaf, lamaranmu untuk task "${applicant.task.judul_tugas}" belum terpilih. Jangan menyerah dan coba task lain!`;

        await notificationService.createNotification({
          userId: applicant.id_worker,
          type: 'reject',
          title: 'Lamaran Ditolak 😔',
          message: notifMsg,
          data: { task_id: applicant.id_tasks },
        });
      } catch (_) {
        /* non-blocking */
      }
    }

    return { success: true };
  },

  /**
   * Update status task (worker: confirm_start; requester: confirm_start/completed/cancelled)
   */
  async updateTaskStatus(
    taskId: string,
    userId: string,
    newStatus: 'start' | 'confirm_start' | 'completed' | 'cancelled',
  ) {
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        applicants: {
          where: {
            status_applicant: {
              nama_status: { equals: 'accepted', mode: 'insensitive' },
            },
          },
          include: {
            worker: { select: { id_user: true, nama_lengkap: true } },
          },
        },
      },
    });

    if (!task) throw new Error('Task tidak ditemukan.');

    const currentStatus = getFrontendStatusName(task.status_task.nama_status);
    const isRequester = task.id_requester === userId;
    const acceptedWorkers = task.applicants;
    const isWorker = acceptedWorkers.some((a) => a.id_worker === userId);

    // 1. Action 'start': Requester memulai tugas (menutup slot pendaftaran & melepas sisa escrow slot tak terpakai)
    if (newStatus === 'start' && currentStatus === 'open' && isRequester) {
      if (acceptedWorkers.length === 0) {
        throw new Error('Minimal 1 worker harus diterima sebelum Anda dapat memulai tugas.');
      }

      const taskAcceptedStatusId = await getStatusId('accepted');
      const rejectedStatusId = await getApplicantStatusId('rejected');

      // Ambil pelamar pending yang tersisa
      const pendingApplicants = await prisma.taskApplicants.findMany({
        where: {
          id_tasks: taskId,
          status_applicant: { nama_status: { equals: 'pending', mode: 'insensitive' } },
        },
        select: { id_worker: true },
      });

      // Seluruh operasi status update, reject pelamar tersisa, dan refund slot sisa dijalankan atomik
      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number }>>`
        SELECT max_applicants FROM "Task" WHERE id_tasks = ${taskId}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
      const unusedSlots = maxApplicants - acceptedWorkers.length;
      const refundAmount = unusedSlots > 0 ? unusedSlots * task.kompensasi : 0;

      await prisma.$transaction(async (tx) => {
        // 1. Lock baris user requester & task
        await tx.$queryRaw`SELECT 1 FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE`;

        // 2. Reject pelamar pending yang tersisa
        await tx.taskApplicants.updateMany({
          where: {
            id_tasks: taskId,
            status_applicant: { nama_status: { equals: 'pending', mode: 'insensitive' } },
          },
          data: { id_status_task_applicants: rejectedStatusId },
        });

        // 3. Update status task ke 'accepted'
        await tx.task.update({
          where: { id_tasks: taskId },
          data: {
            id_status_task: taskAcceptedStatusId,
            accepted_at: new Date(),
          },
        });

        // 4. Jika ada sisa slot tak terpakai, refund escrow secara atomik
        if (unusedSlots > 0 && refundAmount > 0) {
          await tx.user.update({
            where: { id_user: task.id_requester },
            data: { held_balance: { decrement: refundAmount } },
          });

          await tx.transactions.create({
            data: {
              id_user: task.id_requester,
              nominal: refundAmount,
              tipe_transaksi: 'MASUK',
              sub_type: 'refund',
              deskripsi: `Pengembalian sisa escrow (${unusedSlots} slot tidak terpakai) untuk task: ${task.judul_tugas}`,
            },
          });
        }
      });

      // Notifikasi ke seluruh worker yang diterima bahwa tugas dimulai
      for (const w of acceptedWorkers) {
        try {
          await notificationService.createNotification({
            userId: w.id_worker,
            type: 'accept',
            title: 'Tugas Resmi Dimulai! 🚀',
            message: `Requester telah memulai tugas "${task.judul_tugas}". Segera berikan konfirmasi mulai!`,
            data: { task_id: taskId },
          });
        } catch (_) {}
      }

      // Notifikasi ke pelamar pending yang di-reject
      for (const p of pendingApplicants) {
        try {
          await notificationService.createNotification({
            userId: p.id_worker,
            type: 'reject',
            title: 'Pendaftaran Ditutup 🔒',
            message: `Pendaftaran untuk task "${task.judul_tugas}" telah ditutup oleh Requester.`,
            data: { task_id: taskId },
          });
        } catch (_) {}
      }

      return { success: true };
    }

    // 2. Action 'confirm_start': Konfirmasi mulai dari Requester / Worker
    if (
      newStatus === 'confirm_start' &&
      currentStatus === 'accepted' &&
      (isWorker || isRequester)
    ) {
      if (isWorker) {
        // Tandai worker_confirmed pada baris TaskApplicants milik worker ini (pakai raw SQL agar bypass Prisma cached validation)
        await prisma.$executeRaw`
          UPDATE "TaskApplicants"
          SET worker_confirmed = true
          WHERE id_tasks = ${taskId}
            AND id_worker = ${userId}
        `;
        try {
          const currentWorker = acceptedWorkers.find((w) => w.id_worker === userId);
          await notificationService.createNotification({
            userId: task.id_requester,
            type: 'progress',
            title: 'Task Dikerjakan 🏃‍♂️',
            message: `${currentWorker?.worker.nama_lengkap ?? 'Worker'} telah konfirmasi mulai mengerjakan task "${task.judul_tugas}".`,
            data: { task_id: taskId },
          });
        } catch (_) {}
      }

      if (isRequester) {
        await prisma.task.update({
          where: { id_tasks: taskId },
          data: { requester_started: true },
        });
      }

      // Re-fetch data konfirmasi terkini dari database
      const unconfirmedCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "TaskApplicants" ta
        JOIN "StatusTaskApplicants" sta ON sta.id_status_task_applicants = ta.id_status_task_applicants
        WHERE ta.id_tasks = ${taskId}
          AND LOWER(sta.nama_status) = 'accepted'
          AND (ta.worker_confirmed IS FALSE OR ta.worker_confirmed IS NULL)
      `;

      const refreshedTask = await prisma.task.findUnique({
        where: { id_tasks: taskId },
        select: { requester_started: true },
      });

      const allWorkersConfirmed = acceptedWorkers.length > 0 && Number(unconfirmedCount[0]?.count ?? 1) === 0;
      const requesterConfirmed = refreshedTask?.requester_started ?? false;

      if (allWorkersConfirmed && requesterConfirmed) {
        const inProgressStatusId = await getStatusId('in_progress');
        await prisma.task.update({
          where: { id_tasks: taskId },
          data: { id_status_task: inProgressStatusId, worker_started: true },
        });
        // Notifikasi ke semua worker bahwa task in_progress
        for (const w of acceptedWorkers) {
          try {
            await notificationService.createNotification({
              userId: w.id_worker,
              type: 'progress',
              title: 'Semua Siap! Task Dimulai 🚀',
              message: `Semua pihak telah konfirmasi. Task "${task.judul_tugas}" resmi dimulai!`,
              data: { task_id: taskId },
            });
          } catch (_) {}
        }
      }

      return { success: true };
    }

    // Validasi lain
    if (
      newStatus === 'completed' &&
      (currentStatus === 'accepted' || currentStatus === 'in_progress') &&
      isRequester
    ) {
      // Valid
    } else if (
      newStatus === 'cancelled' &&
      (
        ((currentStatus === 'open' || currentStatus === 'accepted' || currentStatus === 'in_progress') && isRequester) ||
        ((currentStatus === 'accepted' || currentStatus === 'in_progress') && isWorker)
      )
    ) {
      // Valid
    } else {
      throw new Error(
        `Transisi status dari '${currentStatus}' ke '${newStatus}' tidak diizinkan.`,
      );
    }

    const newStatusId = await getStatusId(newStatus);
    const updateData: Record<string, unknown> = { id_status_task: newStatusId };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date();

      // Release escrow ke SETIAP accepted worker.
      // Task bidding: jumlah per worker diambil dari pembukuan slot (held_slots_json)
      // karena tiap bid bisa berbeda; task harga tetap fallback ke kompensasi.
      const rawSlotHeld = await prisma.$queryRaw<Array<{ held_slots_json: string | null }>>`
        SELECT held_slots_json FROM "Task" WHERE id_tasks = ${taskId}
      `;
      const slotHeldMap: Record<string, number> = (() => {
        try {
          return JSON.parse(rawSlotHeld[0]?.held_slots_json ?? '{}') as Record<string, number>;
        } catch {
          return {};
        }
      })();

      if (acceptedWorkers.length > 0) {
        // Cek apakah ada sengketa yang telah selesai pada task ini
        const settledDisputes = await prisma.dispute.findMany({
          where: {
            id_task: taskId,
            status: { in: ['RESOLVED_FAVOR_WORKER', 'RESOLVED_FAVOR_REQUESTER', 'CLOSED'] },
          },
          select: { id_reporter: true, id_respondent: true },
        });
        const settledWorkerIds = new Set(
          settledDisputes.map((d) => (d.id_reporter === task.id_requester ? d.id_respondent : d.id_reporter))
        );

        // Hanya cairkan ke worker yang aktif dan belum diselesaikan melalui sengketa
        const workersToPayout = acceptedWorkers.filter((workerApp) => {
          if (settledWorkerIds.has(workerApp.id_worker)) return false;
          // Bila held_slots_json ada, cek apakah slotnya masih aktif
          if (rawSlotHeld[0]?.held_slots_json && typeof slotHeldMap[workerApp.id_task_applicants] !== 'number') {
            return false;
          }
          return true;
        });

        const txResult = await prisma.$transaction(async (tx) => {
          // 1. Kunci baris Task dengan FOR UPDATE untuk mencegah race condition / double payout
          const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string }>>`
            SELECT id_status_task FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE
          `;
          const currentDbStatusId = lockedTask[0]?.id_status_task;
          if (currentDbStatusId === newStatusId) {
            return { alreadyHandled: true };
          }

          for (const workerApp of workersToPayout) {
            const payoutAmount =
              typeof slotHeldMap[workerApp.id_task_applicants] === 'number'
                ? slotHeldMap[workerApp.id_task_applicants]
                : (workerApp.bid_amount ?? task.kompensasi);

            await tx.user.update({
              where: { id_user: task.id_requester },
              data: {
                total_balance: { decrement: payoutAmount },
                held_balance: { decrement: payoutAmount },
              },
            });

            await tx.transactions.create({
              data: {
                id_user: task.id_requester,
                nominal: payoutAmount,
                tipe_transaksi: 'KELUAR',
                sub_type: 'task_payment',
                deskripsi: `Pembayaran task ke ${workerApp.worker.nama_lengkap}: ${task.judul_tugas}`,
              },
            });

            await tx.user.update({
              where: { id_user: workerApp.id_worker },
              data: {
                total_balance: { increment: payoutAmount },
                total_completed: { increment: 1 },
              },
            });

            await tx.transactions.create({
              data: {
                id_user: workerApp.id_worker,
                nominal: payoutAmount,
                tipe_transaksi: 'MASUK',
                sub_type: 'task_earning',
                deskripsi: `Kompensasi dari task: ${task.judul_tugas}`,
              },
            });
          }

          await tx.task.update({
            where: { id_tasks: taskId },
            data: {
              ...updateData,
              held_slots_json: null,
            },
          });

          return { alreadyHandled: false };
        });

        if (txResult?.alreadyHandled) {
          return { success: true, message: 'Task sudah diselesaikan sebelumnya.' };
        }

        // Notifications & Gamification hooks (post-transaction)
        for (const workerApp of workersToPayout) {
          const payoutAmount =
            typeof slotHeldMap[workerApp.id_task_applicants] === 'number'
              ? slotHeldMap[workerApp.id_task_applicants]
              : (workerApp.bid_amount ?? task.kompensasi);

          try {
            await notificationService.createNotification({
              userId: workerApp.id_worker,
              type: 'points',
              title: 'Poin Diterima! 💰',
              message: `Task "${task.judul_tugas}" selesai. ${payoutAmount.toLocaleString('id-ID')} poin telah masuk ke saldo kamu.`,
              data: { task_id: taskId },
            });
          } catch (_) {}

          // Gamification Hooks
          try {
            await GamificationService.addXP(workerApp.id_worker, 50);
            await GamificationService.updateStreak(workerApp.id_worker);
            // Bonus XP streak — dihitung setelah streak ter-update (3+ hari berturut-turut)
            await GamificationService.awardStreakBonusXP(workerApp.id_worker);
            await GamificationService.checkAndAwardBadges(workerApp.id_worker);
          } catch (e) {
            console.error("Gamification hook failed", e);
          }
        }
      } else {
        await prisma.$transaction(async (tx) => {
          const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string }>>`
            SELECT id_status_task FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE
          `;
          if (lockedTask[0]?.id_status_task === newStatusId) {
            return;
          }
          await tx.task.update({
            where: { id_tasks: taskId },
            data: updateData,
          });
        });
      }
    } else if (newStatus === 'cancelled') {
      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number; held_slots_json: string | null }>>`
        SELECT max_applicants, held_slots_json FROM "Task" WHERE id_tasks = ${taskId}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
      const cancelSlotMap: Record<string, number> = (() => {
        try {
          return JSON.parse(rawTaskConfig[0]?.held_slots_json ?? '{}') as Record<string, number>;
        } catch {
          return {};
        }
      })();

      // ─── SKENARIO 1: WORKER MEMBATALKAN / MENGUNDURKAN DIRI ───
      // Jika pemanggil adalah Worker (bukan Requester), worker hanya mengundurkan diri
      // dari lamaran miliknya. Task TIDAK dibatalkan secara keseluruhan untuk worker lain.
      if (isWorker && !isRequester) {
        const myApp = acceptedWorkers.find((a) => a.id_worker === userId);
        if (!myApp) {
          throw new Error('Anda bukan pekerja yang diterima pada tugas ini.');
        }

        const mySlotRefund =
          typeof cancelSlotMap[myApp.id_task_applicants] === 'number'
            ? cancelSlotMap[myApp.id_task_applicants]
            : task.kompensasi;

        const rejectedStatusId = await getApplicantStatusId('rejected');
        const remainingWorkers = acceptedWorkers.filter((w) => w.id_worker !== userId);
        delete cancelSlotMap[myApp.id_task_applicants];
        const updatedHeldSlotsJson = Object.keys(cancelSlotMap).length > 0 ? JSON.stringify(cancelSlotMap) : null;

        await prisma.$transaction(async (tx) => {
          // Lock baris task
          await tx.$queryRaw`SELECT 1 FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE`;

          // 1. Update status lamaran worker yang bersangkutan menjadi rejected (mengundurkan diri)
          await tx.taskApplicants.update({
            where: { id_task_applicants: myApp.id_task_applicants },
            data: {
              id_status_task_applicants: rejectedStatusId,
              alasan_penolakan: 'Pekerja mengundurkan diri',
              worker_confirmed: false,
            },
          });

          // 2. Refund porsi escrow untuk slot worker tersebut saja ke requester
          if (mySlotRefund > 0) {
            await tx.user.update({
              where: { id_user: task.id_requester },
              data: { held_balance: { decrement: mySlotRefund } },
            });

            await tx.transactions.create({
              data: {
                id_user: task.id_requester,
                nominal: mySlotRefund,
                tipe_transaksi: 'MASUK',
                sub_type: 'refund',
                deskripsi: `Pengembalian dana slot pekerja mengundurkan diri (${myApp.worker.nama_lengkap}): ${task.judul_tugas}`,
              },
            });
          }

          // 3. Tentukan status task selanjutnya:
          // Jika masih ada worker yang aktif, task TETAP berjalan (tidak dibatalkan!)
          // Jika tidak ada worker tersisa sama sekali, kembalikan status task ke 'open' agar bisa menerima pelamar baru
          if (remainingWorkers.length > 0) {
            await tx.task.update({
              where: { id_tasks: taskId },
              data: {
                held_slots_json: updatedHeldSlotsJson,
              },
            });
          } else {
            const openStatusId = await getStatusId('open');
            await tx.task.update({
              where: { id_tasks: taskId },
              data: {
                id_status_task: openStatusId,
                accepted_at: null,
                worker_started: false,
                requester_started: false,
                held_slots_json: updatedHeldSlotsJson,
              },
            });
          }
        });

        // Notifikasi ke Requester
        try {
          await notificationService.createNotification({
            userId: task.id_requester,
            type: 'cancel',
            title: 'Pekerja Mengundurkan Diri ⚠️',
            message: `${myApp.worker.nama_lengkap} telah mengundurkan diri dari task "${task.judul_tugas}". Dana escrow slot (${mySlotRefund.toLocaleString('id-ID')} poin) telah dikembalikan ke saldo kamu, dan slot tugas telah dibuka kembali.`,
            data: { task_id: taskId, resigned_worker_id: userId },
          });
        } catch (_) {}

        // Notifikasi konfirmasi ke Worker yang mengundurkan diri
        try {
          await notificationService.createNotification({
            userId,
            type: 'cancel',
            title: 'Pengunduran Diri Berhasil ℹ️',
            message: `Kamu telah berhasil mengundurkan diri dari task "${task.judul_tugas}".`,
            data: { task_id: taskId },
          });
        } catch (_) {}

        return {
          success: true,
          message: 'Berhasil mengundurkan diri dari tugas. Slot telah dikembalikan.',
          new_status: remainingWorkers.length > 0 ? currentStatus : 'open',
        };
      }

      // ─── SKENARIO 2: REQUESTER MEMBATALKAN TUGAS ───
      // Requester membatalkan seluruh tugas dan me-refund semua escrow yang tersisa.
      let totalRefund = 0;
      for (const workerApp of acceptedWorkers) {
        totalRefund +=
          typeof cancelSlotMap[workerApp.id_task_applicants] === 'number'
            ? cancelSlotMap[workerApp.id_task_applicants]
            : task.kompensasi;
      }
      const unfilledSlots = Math.max(0, maxApplicants - acceptedWorkers.length);
      // Slot kosong hanya di-refund bila cancel terjadi dari status 'open'.
      if (currentStatus === 'open') {
        totalRefund += unfilledSlots * task.kompensasi;
      }

      const rejectedStatusId = await getApplicantStatusId('rejected');

      const txResult = await prisma.$transaction(async (tx) => {
        const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string }>>`
          SELECT id_status_task FROM "Task" WHERE id_tasks = ${taskId} FOR UPDATE
        `;
        const currentDbStatusId = lockedTask[0]?.id_status_task;
        if (currentDbStatusId === newStatusId) {
          return { alreadyHandled: true };
        }

        // Tolak semua lamaran yang tersisa (accepted maupun pending)
        await tx.taskApplicants.updateMany({
          where: {
            id_tasks: taskId,
            status_applicant: {
              nama_status: { in: ['ACCEPTED', 'PENDING', 'accepted', 'pending'] },
            },
          },
          data: {
            id_status_task_applicants: rejectedStatusId,
            alasan_penolakan: 'Tugas dibatalkan oleh pemberi tugas (Requester)',
          },
        });

        if (totalRefund > 0) {
          await tx.user.update({
            where: { id_user: task.id_requester },
            data: { held_balance: { decrement: totalRefund } },
          });

          await tx.transactions.create({
            data: {
              id_user: task.id_requester,
              nominal: totalRefund,
              tipe_transaksi: 'MASUK',
              sub_type: 'refund',
              deskripsi: `Pengembalian dana (refund) dari task dibatalkan: ${task.judul_tugas}`,
            },
          });
        }

        await tx.task.update({
          where: { id_tasks: taskId },
          data: updateData,
        });

        return { alreadyHandled: false };
      });

      if (txResult?.alreadyHandled) {
        return { success: true, message: 'Task sudah dibatalkan sebelumnya.' };
      }

      try {
        await notificationService.createNotification({
          userId: task.id_requester,
          type: 'points',
          title: 'Dana Dikembalikan! 🔄',
          message: `Task "${task.judul_tugas}" dibatalkan. ${totalRefund.toLocaleString('id-ID')} poin telah dikembalikan ke saldo kamu.`,
          data: { task_id: taskId },
        });
      } catch (_) {}

      for (const w of acceptedWorkers) {
        try {
          await notificationService.createNotification({
            userId: w.id_worker,
            type: 'cancel',
            title: 'Task Dibatalkan ❌',
            message: `Maaf, task "${task.judul_tugas}" telah dibatalkan oleh requester.`,
            data: { task_id: taskId },
          });
        } catch (_) {}
      }
    } else {
      await prisma.task.update({
        where: { id_tasks: taskId },
        data: updateData,
      });
    }

    return { success: true, new_status: newStatus };
  },

  /**
   * Mengambil riwayat tugas user (baik sebagai requester maupun worker).
   */
  async getUserTaskHistory(
    userId: string,
    role: 'requester' | 'worker',
    status?: string
  ) {
    if (role === 'requester') {
      const where: Record<string, unknown> = { id_requester: userId };
      if (status) {
        where.status_task = {
          nama_status: { equals: getDbStatusName(status), mode: 'insensitive' },
        };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          status_task: { select: { nama_status: true } },
          applicants: {
            include: {
              status_applicant: { select: { nama_status: true } },
              worker: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
            },
          },
          reviews: {
            select: { rating: true, id_rater: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return tasks.map((t) => {
        const acceptedApps = t.applicants.filter(
          (a) => a.status_applicant?.nama_status?.toLowerCase() === 'accepted'
        );
        const acceptedApp = acceptedApps[0] || null;
        const workerReview = acceptedApp
          ? t.reviews.find((r) => r.id_rater === acceptedApp.id_worker)
          : (t.reviews[0] ?? null);
        const isBidding = t.is_bidding;

        return {
          id_tasks: t.id_tasks,
          judul_tugas: t.judul_tugas,
          estimasi_waktu: t.estimasi_waktu,
          kompensasi: (isBidding && acceptedApp && acceptedApp.bid_amount != null)
            ? acceptedApp.bid_amount
            : t.kompensasi,
          status: getFrontendStatusName(t.status_task.nama_status),
          created_at: t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at),
          completed_at: t.completed_at ? (t.completed_at instanceof Date ? t.completed_at.toISOString() : String(t.completed_at)) : null,
          applicant_count: t.applicants.length,
          accepted_worker: acceptedApp?.worker
            ? {
                id_user: acceptedApp.worker.id_user,
                nama_lengkap: acceptedApp.worker.nama_lengkap,
                avatar_url: acceptedApp.worker.avatar_url,
              }
            : null,
          accepted_workers: acceptedApps.map((a) => ({
            id_user: a.worker.id_user,
            nama_lengkap: a.worker.nama_lengkap,
            avatar_url: a.worker.avatar_url,
            bid_amount: a.bid_amount,
          })),
          received_rating: workerReview?.rating ?? null,
        };
      });
    } else {
      // Worker history
      const where: Record<string, unknown> = { id_worker: userId };
      if (status) {
        where.status_applicant = {
          nama_status: { equals: status, mode: 'insensitive' },
        };
      }

      const applications = await prisma.taskApplicants.findMany({
        where,
        include: {
          status_applicant: { select: { nama_status: true } },
          task: {
            include: {
              status_task: { select: { nama_status: true } },
              requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
              reviews: {
                where: { id_ratee: userId },
                select: { rating: true, comment: true },
              },
            },
          },
        },
        orderBy: { applied_at: 'desc' },
      });

      return applications.map((app) => {
        const t = app.task;
        const reviewForWorker = t.reviews[0] ?? null;
        const isBidding = t.is_bidding;

        return {
          id_task_applicants: app.id_task_applicants,
          id_tasks: t.id_tasks,
          judul_tugas: t.judul_tugas,
          estimasi_waktu: t.estimasi_waktu,
          kompensasi: (isBidding && app.bid_amount != null)
            ? app.bid_amount
            : (app.bid_amount ?? t.kompensasi),
          task_status: getFrontendStatusName(t.status_task.nama_status),
          application_status: app.status_applicant?.nama_status?.toLowerCase() ?? 'pending',
          apply_count: app.apply_count,
          alasan_penolakan: app.alasan_penolakan,
          max_apply_attempts: t.max_apply_attempts ?? 3,
          applied_at: app.applied_at instanceof Date ? app.applied_at.toISOString() : String(app.applied_at),
          completed_at: t.completed_at ? (t.completed_at instanceof Date ? t.completed_at.toISOString() : String(t.completed_at)) : null,
          requester: t.requester
            ? {
                id_user: t.requester.id_user,
                nama_lengkap: t.requester.nama_lengkap,
                avatar_url: t.requester.avatar_url,
              }
            : null,
          received_rating: reviewForWorker?.rating ?? null,
          received_comment: reviewForWorker?.comment ?? null,
        };
      });
    }
  },

  /**
   * Mengambil daftar tugas yang memiliki jadwal (scheduled_at).
   * Mendukung filter berdasarkan role (worker, requester, all) dan bulan/tahun.
   */
  async getScheduledTasks(
    userId: string,
    options?: {
      month?: number;
      year?: number;
      role?: 'worker' | 'requester' | 'all';
    }
  ) {
    const { month, year, role = 'all' } = options || {};

    let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;
    if (year && month) {
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      dateFilter = { gte: startDate, lte: endDate };
    } else if (year) {
      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      dateFilter = { gte: startDate, lte: endDate };
    }

    const whereConditions: any[] = [
      { scheduled_at: { not: null } },
      ...(dateFilter ? [{ scheduled_at: dateFilter }] : []),
    ];

    if (role === 'requester') {
      whereConditions.push({ id_requester: userId });
    } else if (role === 'worker') {
      whereConditions.push({
        applicants: {
          some: {
            id_worker: userId,
            status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
          },
        },
      });
    } else {
      whereConditions.push({
        OR: [
          { id_requester: userId },
          {
            applicants: {
              some: {
                id_worker: userId,
                status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
              },
            },
          },
        ],
      });
    }

    const tasks = await prisma.task.findMany({
      where: { AND: whereConditions },
      include: {
        status_task: { select: { nama_status: true } },
        kategori: { select: { id_category: true, nama_kategori: true, icon: true } },
        requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
        applicants: {
          where: {
            status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
          },
          include: {
            worker: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
          },
          take: 1,
        },
      },
      orderBy: { scheduled_at: 'asc' },
    });

    return tasks.map((t) => {
      const isRequester = t.id_requester === userId;
      const acceptedApplicant = t.applicants[0];
      const isBidding = t.is_bidding;
      
      return {
        id_tasks: t.id_tasks,
        judul_tugas: t.judul_tugas,
        deskripsi_tugas: t.deskripsi_tugas,
        estimasi_waktu: t.estimasi_waktu,
        kompensasi: (isBidding && acceptedApplicant && acceptedApplicant.bid_amount != null)
                      ? acceptedApplicant.bid_amount
                      : t.kompensasi,
        status: getFrontendStatusName(t.status_task.nama_status),
        scheduled_at: t.scheduled_at,
        scheduled_end: t.scheduled_end,
        kategori: t.kategori,
        requester: t.requester,
        worker: acceptedApplicant?.worker || null,
        user_role: isRequester ? 'requester' : 'worker',
      };
    });
  },

  async getScheduledTasksCount(
    userId: string,
    options?: {
      role?: 'worker' | 'requester' | 'all';
    }
  ) {
    const { role = 'all' } = options || {};
    const whereConditions: any[] = [
      { scheduled_at: { not: null } },
    ];

    if (role === 'requester') {
      whereConditions.push({ id_requester: userId });
    } else if (role === 'worker') {
      whereConditions.push({
        applicants: {
          some: {
            id_worker: userId,
            status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
          },
        },
      });
    } else {
      whereConditions.push({
        OR: [
          { id_requester: userId },
          {
            applicants: {
              some: {
                id_worker: userId,
                status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
              },
            },
          },
        ],
      });
    }

    return await prisma.task.count({
      where: { AND: whereConditions },
    });
  },
};



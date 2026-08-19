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

    // Cek saldo ketersediaan Requester
    const requester = await prisma.user.findUnique({
      where: { id_user: requesterId },
      select: { total_balance: true, held_balance: true },
    });
    if (!requester) throw new Error('User requester tidak ditemukan.');

    const availableBalance = requester.total_balance - requester.held_balance;
    if (availableBalance < totalEscrow) {
      throw new Error(
        `Saldo poin Anda tidak mencukupi untuk mengunci total escrow sebesar ${totalEscrow.toLocaleString('id-ID')} poin (${maxApplicantsNum} worker x ${kompensasi.toLocaleString('id-ID')} poin). Saldo tersedia: ${availableBalance.toLocaleString('id-ID')} poin.`
      );
    }

    // Insert task dengan raw SQL agar bisa pakai ST_MakePoint untuk PostGIS
    const result = await prisma.$queryRaw<{ id_tasks: string }[]>`
      INSERT INTO "Task" (
        id_tasks, id_requester, id_status_task,
        judul_tugas, deskripsi_tugas, estimasi_waktu, kompensasi,
        lokasi_geo, created_at, id_category, max_applicants, max_apply_attempts,
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
        ${scheduledAtDate},
        ${scheduledEndDate}
      )
      RETURNING id_tasks
    `;

    const taskId = result[0]?.id_tasks;
    if (!taskId) throw new Error('Gagal membuat task.');

    // Hold escrow pada Requester
    await prisma.user.update({
      where: { id_user: requesterId },
      data: { held_balance: { increment: totalEscrow } },
    });

    // Catat transaksi escrow lock
    try {
      await prisma.transactions.create({
        data: {
          id_user: requesterId,
          nominal: totalEscrow,
          tipe_transaksi: 'KELUAR',
          sub_type: 'hold',
          deskripsi: `Escrow dikunci untuk task: ${judul_tugas} (${maxApplicantsNum} worker x ${kompensasi.toLocaleString('id-ID')} poin)`,
        },
      });
    } catch (_) {}

    // Link skill requirements jika ada
    if (skill_requirements && skill_requirements.length > 0) {
      try {
        await prisma.taskRequirements.createMany({
          data: skill_requirements.map(id => ({ id_tasks: taskId, id_skill_master: id })),
        });
      } catch (error) {
        console.error('Error creating task requirements', error);
      }
    }

    return taskId;
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
          getFrontendStatusName(st.nama_status) AS status,
          t.created_at,
          t.id_requester,
          u.nama_lengkap AS requester_name,
          u.avatar_url AS requester_avatar,
          ST_Distance(t.lokasi_geo, ST_MakePoint(${lng}, ${lat})::geography) AS distance_m,
          ST_Y(t.lokasi_geo::geometry) AS latitude,
          ST_X(t.lokasi_geo::geometry) AS longitude
        FROM "Task" t
        JOIN "StatusTask" st ON st.id_status_task = t.id_status_task
        JOIN "User" u ON u.id_user = t.id_requester
        WHERE
          t.lokasi_geo IS NOT NULL
          AND ST_DWithin(t.lokasi_geo, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})
          AND st.nama_status = ${statusValue}
        ORDER BY distance_m ASC
        LIMIT 50
      `;
      return tasks;
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
    // Ambil task dari Prisma
    const task = await prisma.task.findUnique({
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
    });

    if (!task) return null;

    // Ambil koordinat & kolom baru via raw query (membypass cached Prisma SELECT list)
    const rawTaskResult = await prisma.$queryRaw<
      Array<{
        latitude: number | null;
        longitude: number | null;
        max_applicants: number | null;
        max_apply_attempts: number | null;
        estimasi_waktu: string | null;
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
        scheduled_at,
        scheduled_end
      FROM "Task"
      WHERE id_tasks = ${taskId}
    `;

    const rawTask = rawTaskResult[0];
    const geo = {
      latitude: rawTask?.latitude ?? null,
      longitude: rawTask?.longitude ?? null,
    };

    // Ambil status worker_confirmed secara presisi via raw query
    const rawApplicantsResult = await prisma.$queryRaw<
      Array<{ id_task_applicants: string; worker_confirmed: boolean | null }>
    >`
      SELECT id_task_applicants, worker_confirmed
      FROM "TaskApplicants"
      WHERE id_tasks = ${taskId}
    `;

    const confirmedMap = new Map<string, boolean>();
    rawApplicantsResult.forEach((r) => {
      confirmedMap.set(r.id_task_applicants, r.worker_confirmed === true);
    });

    // Cek apakah viewer sudah apply dan ambil infonya
    let hasApplied = false;
    let viewerApplication: {
      id_task_applicants: string;
      status: string;
      apply_count: number;
      alasan_penolakan: string | null;
      pesan: string | null;
    } | null = null;

    if (viewerUserId) {
      const app = await prisma.taskApplicants.findFirst({
        where: { id_tasks: taskId, id_worker: viewerUserId },
        include: { status_applicant: { select: { nama_status: true } } },
      });
      if (app) {
        hasApplied = app.status_applicant.nama_status.toLowerCase() !== 'rejected';
        viewerApplication = {
          id_task_applicants: app.id_task_applicants,
          status: app.status_applicant.nama_status.toLowerCase(),
          apply_count: app.apply_count,
          alasan_penolakan: app.alasan_penolakan,
          pesan: app.pesan,
        };
      }
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
      applicants: task.applicants.map((a) => ({
        id_task_applicants: a.id_task_applicants,
        id_worker: a.id_worker,
        pesan: a.pesan,
        status: a.status_applicant.nama_status.toLowerCase(),
        apply_count: a.apply_count,
        alasan_penolakan: a.alasan_penolakan,
        applied_at: a.applied_at,
        worker_confirmed: confirmedMap.get(a.id_task_applicants) === true,
        worker: a.worker,
      })),
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
   * Worker apply ke task
   */
  async applyToTask(taskId: string, workerId: string, pesan?: string) {
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
      Array<{ max_applicants: number; max_apply_attempts: number }>
    >`
      SELECT max_applicants, max_apply_attempts FROM "Task" WHERE id_tasks = ${taskId}
    `;

    const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
    const maxAttempts = rawTaskConfig[0]?.max_apply_attempts ?? task.max_apply_attempts ?? 3;

    if (!existing && task._count.applicants >= maxApplicants) {
      throw new Error(`Tugas ini sudah mencapai kuota maksimal (${maxApplicants} pelamar).`);
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

      // Worker melamar kembali (re-apply)
      const updatedApplicant = await prisma.taskApplicants.update({
        where: { id_task_applicants: existing.id_task_applicants },
        data: {
          id_status_task_applicants: pendingStatusId,
          apply_count: { increment: 1 },
          pesan: pesan ?? null,
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
          title: 'Pelamar Melamar Kembali! 🔄',
          message: `${workerData?.nama_lengkap ?? 'Seseorang'} mengajukan lamaran kembali untuk task "${task.judul_tugas}".`,
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
        title: 'Ada Pelamar Baru! 🎉',
        message: `${workerData?.nama_lengkap ?? 'Seseorang'} melamar task "${task.judul_tugas}".`,
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
    });

    if (!existing) throw new Error('Lamaran tidak ditemukan.');

    await prisma.taskApplicants.delete({
      where: { id_task_applicants: existing.id_task_applicants },
    });

    return { success: true };
  },

  /**
   * Requester: accept atau reject applicant (dengan alasan penolakan opsional)
   */
  async updateApplicantStatus(
    applicantId: string,
    requesterId: string,
    action: 'accept' | 'reject',
    alasan_penolakan?: string,
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

    if (action === 'accept') {
      const acceptedStatusId = await getApplicantStatusId('accepted');
      const rejectedStatusId = await getApplicantStatusId('rejected');
      const taskAcceptedStatusId = await getStatusId('accepted');

      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number }>>`
        SELECT max_applicants FROM "Task" WHERE id_tasks = ${applicant.id_tasks}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? applicant.task.max_applicants ?? 1;

      // Update applicant ini ke accepted
      await prisma.taskApplicants.update({
        where: { id_task_applicants: applicantId },
        data: { id_status_task_applicants: acceptedStatusId },
      });

      // Hitung berapa total applicant yang sudah accepted untuk task ini
      const acceptedCount = await prisma.taskApplicants.count({
        where: {
          id_tasks: applicant.id_tasks,
          status_applicant: { nama_status: { equals: 'accepted', mode: 'insensitive' } },
        },
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

      // Reject pelamar pending yang tersisa
      await prisma.taskApplicants.updateMany({
        where: {
          id_tasks: taskId,
          status_applicant: { nama_status: { equals: 'pending', mode: 'insensitive' } },
        },
        data: { id_status_task_applicants: rejectedStatusId },
      });

      // Update status task ke 'accepted'
      await prisma.task.update({
        where: { id_tasks: taskId },
        data: {
          id_status_task: taskAcceptedStatusId,
          accepted_at: new Date(),
        },
      });

      // Jika acceptedWorkers < max_applicants, kembalikan (refund) sisa escrow slot tak terpakai ke requester
      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number }>>`
        SELECT max_applicants FROM "Task" WHERE id_tasks = ${taskId}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
      const unusedSlots = maxApplicants - acceptedWorkers.length;
      if (unusedSlots > 0) {
        const refundAmount = unusedSlots * task.kompensasi;
        await prisma.user.update({
          where: { id_user: task.id_requester },
          data: { held_balance: { decrement: refundAmount } },
        });
        try {
          await prisma.transactions.create({
            data: {
              id_user: task.id_requester,
              nominal: refundAmount,
              tipe_transaksi: 'MASUK',
              sub_type: 'refund',
              deskripsi: `Pengembalian sisa escrow (${unusedSlots} slot tidak terpakai) untuk task: ${task.judul_tugas}`,
            },
          });
        } catch (_) {}
      }

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
      (currentStatus === 'open' || currentStatus === 'accepted') &&
      isRequester
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

      // Release escrow ke SETIAP accepted worker
      if (acceptedWorkers.length > 0) {
        for (const workerApp of acceptedWorkers) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id_user: task.id_requester },
              data: {
                total_balance: { decrement: task.kompensasi },
                held_balance: { decrement: task.kompensasi },
              },
            }),
            prisma.transactions.create({
              data: {
                id_user: task.id_requester,
                nominal: task.kompensasi,
                tipe_transaksi: 'KELUAR',
                sub_type: 'task_payment',
                deskripsi: `Pembayaran task ke ${workerApp.worker.nama_lengkap}: ${task.judul_tugas}`,
              },
            }),
            prisma.user.update({
              where: { id_user: workerApp.id_worker },
              data: {
                total_balance: { increment: task.kompensasi },
                total_completed: { increment: 1 },
              },
            }),
            prisma.transactions.create({
              data: {
                id_user: workerApp.id_worker,
                nominal: task.kompensasi,
                tipe_transaksi: 'MASUK',
                sub_type: 'task_earning',
                deskripsi: `Kompensasi dari task: ${task.judul_tugas}`,
              },
            }),
          ]);

          try {
            await notificationService.createNotification({
              userId: workerApp.id_worker,
              type: 'points',
              title: 'Poin Diterima! 💰',
              message: `Task "${task.judul_tugas}" selesai. ${task.kompensasi.toLocaleString('id-ID')} poin telah masuk ke saldo kamu.`,
              data: { task_id: taskId },
            });
          } catch (_) {}

          // Gamification Hooks
          try {
            await GamificationService.addXP(workerApp.id_worker, 50);
            await GamificationService.updateStreak(workerApp.id_worker);
            await GamificationService.checkAndAwardBadges(workerApp.id_worker);
          } catch (e) {
            console.error("Gamification hook failed", e);
          }
        }
      }
    } else if (newStatus === 'cancelled') {
      // Refund sisa held_balance escrow penuh ke requester (sesuai slot max_applicants)
      const rawTaskConfig = await prisma.$queryRaw<Array<{ max_applicants: number }>>`
        SELECT max_applicants FROM "Task" WHERE id_tasks = ${taskId}
      `;
      const maxApplicants = rawTaskConfig[0]?.max_applicants ?? task.max_applicants ?? 1;
      const totalRefund = maxApplicants * task.kompensasi;

      await prisma.user.update({
        where: { id_user: task.id_requester },
        data: { held_balance: { decrement: totalRefund } },
      });
      try {
        await prisma.transactions.create({
          data: {
            id_user: task.id_requester,
            nominal: totalRefund,
            tipe_transaksi: 'MASUK',
            sub_type: 'refund',
            deskripsi: `Pengembalian dana (refund) dari task dibatalkan: ${task.judul_tugas}`,
          },
        });
      } catch (_) {}

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
    }

    await prisma.task.update({
      where: { id_tasks: taskId },
      data: updateData,
    });

    return { success: true, new_status: newStatus };
  },

  /**
   * Histori task user (sebagai requester & sebagai worker)
   */
  async getUserTaskHistory(
    userId: string,
    role: 'requester' | 'worker',
    statusFilter?: string,
  ) {
    if (role === 'requester') {
      const where: Record<string, unknown> = { id_requester: userId };
      if (statusFilter) {
        where.status_task = { nama_status: statusFilter.toUpperCase() };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          status_task: { select: { nama_status: true } },
          _count: { select: { applicants: true } },
          applicants: {
            where: { status_applicant: { nama_status: 'accepted' } },
            include: {
              worker: {
                select: { id_user: true, nama_lengkap: true, avatar_url: true },
              },
            },
            take: 1,
          },
          reviews: { where: { id_rater: { not: userId } }, take: 1 }, // review dari worker ke requester
        },
        orderBy: { created_at: 'desc' },
      });

      return tasks.map((t) => ({
        id_tasks: t.id_tasks,
        judul_tugas: t.judul_tugas,
        estimasi_waktu: t.estimasi_waktu,
        kompensasi: t.kompensasi,
        status: t.status_task.nama_status.toLowerCase(),
        created_at: t.created_at,
        completed_at: t.completed_at,
        applicant_count: t._count.applicants,
        accepted_worker: t.applicants[0]?.worker ?? null,
        received_rating: t.reviews[0]?.rating ?? null,
      }));
    } else {
      // Worker: ambil semua task yang pernah diapply (berbagai status)
      const applications = await prisma.taskApplicants.findMany({
        where: {
          id_worker: userId,
          ...(statusFilter
            ? {
                task: {
                  status_task: { nama_status: statusFilter.toUpperCase() },
                },
              }
            : {}),
        },
        include: {
          task: {
            include: {
              status_task: { select: { nama_status: true } },
              requester: {
                select: { id_user: true, nama_lengkap: true, avatar_url: true },
              },
              reviews: { where: { id_ratee: userId }, take: 1 }, // review yang diterima worker
            },
          },
          status_applicant: { select: { nama_status: true } },
        },
        orderBy: { applied_at: 'desc' },
      });

      return applications.map((a) => ({
        id_task_applicants: a.id_task_applicants,
        id_tasks: a.id_tasks,
        judul_tugas: a.task.judul_tugas,
        estimasi_waktu: a.task.estimasi_waktu,
        kompensasi: a.task.kompensasi,
        task_status: a.task.status_task.nama_status.toLowerCase(),
        application_status: a.status_applicant.nama_status.toLowerCase(),
        apply_count: a.apply_count,
        alasan_penolakan: a.alasan_penolakan,
        max_apply_attempts: a.task.max_apply_attempts ?? 3,
        applied_at: a.applied_at,
        completed_at: a.task.completed_at,
        requester: a.task.requester,
        received_rating: a.task.reviews[0]?.rating ?? null,
        received_comment: a.task.reviews[0]?.comment ?? null,
      }));
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
      return {
        id_tasks: t.id_tasks,
        judul_tugas: t.judul_tugas,
        deskripsi_tugas: t.deskripsi_tugas,
        estimasi_waktu: t.estimasi_waktu,
        kompensasi: t.kompensasi,
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
};


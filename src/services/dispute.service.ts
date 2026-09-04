import { prisma } from '@/lib/prisma';
import { DisputeStatus } from '@prisma/client';
import { walletService } from '@/services/wallet.service';
import { notificationService } from '@/services/notification.service';

export interface CreateDisputeInput {
  taskId: string;
  reporterId: string;
  reason: string;
  description: string;
  evidence?: { type: 'text' | 'image'; content: string }[];
}

export interface DisputeFilterOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const disputeService = {
  /**
   * Membuat dispute (sengketa) baru terkait suatu tugas.
   */
  async createDispute(input: CreateDisputeInput) {
    const { taskId, reporterId, reason, description, evidence } = input;

    // 1. Ambil task dan verifikasi status & pihak terkait
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: { select: { nama_status: true } },
        requester: { select: { id_user: true, nama_lengkap: true } },
        applicants: {
          include: {
            worker: { select: { id_user: true, nama_lengkap: true } },
            status_applicant: { select: { nama_status: true } },
          },
        },
      },
    });

    if (!task) {
      throw new Error('Tugas tidak ditemukan.');
    }

    const isRequester = task.id_requester === reporterId;
    const acceptedApplicant = task.applicants.find(
      (a) => a.status_applicant?.nama_status?.toUpperCase() === 'ACCEPTED'
    );
    const workerApplicant = task.applicants.find((a) => a.id_worker === reporterId);
    const isWorker = Boolean(workerApplicant);

    if (!isRequester && !isWorker) {
      throw new Error('Hanya pemberi tugas atau pekerja yang berhak mengajukan sengketa.');
    }

    let respondentId = '';
    if (isRequester) {
      const targetWorker = acceptedApplicant || task.applicants[0];
      if (!targetWorker) {
        throw new Error('Belum ada pekerja atau pelamar pada tugas ini untuk diajukan sengketa.');
      }
      respondentId = targetWorker.id_worker;
    } else {
      respondentId = task.id_requester;
    }

    // 2. Cek apakah ada sengketa yang masih terbuka / dalam peninjauan untuk tugas ini
    let existingDispute: any = null;
    if (typeof (prisma as any).dispute?.findFirst === 'function') {
      existingDispute = await (prisma as any).dispute.findFirst({
        where: {
          id_task: taskId,
          status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW] },
        },
      });
    } else {
      const raw = await prisma.$queryRaw<Array<{ id_dispute: string }>>`
        SELECT id_dispute FROM "Dispute"
        WHERE id_task = ${taskId} AND status IN ('OPEN', 'IN_REVIEW')
        LIMIT 1
      `;
      existingDispute = raw[0] || null;
    }

    if (existingDispute) {
      throw new Error('Tugas ini sudah memiliki pengajuan sengketa yang sedang aktif.');
    }

    // 3. Buat entri Dispute baru
    let dispute: any = null;
    if (typeof (prisma as any).dispute?.create === 'function') {
      dispute = await (prisma as any).dispute.create({
        data: {
          id_task: taskId,
          id_reporter: reporterId,
          id_respondent: respondentId,
          reason,
          description,
          status: DisputeStatus.OPEN,
          evidences:
            evidence && evidence.length > 0
              ? {
                  create: evidence.map((e) => ({
                    id_user: reporterId,
                    type: e.type,
                    content: e.content,
                  })),
                }
              : undefined,
        },
        include: {
          task: { select: { judul_tugas: true, kompensasi: true } },
          reporter: { select: { id_user: true, nama_lengkap: true } },
          respondent: { select: { id_user: true, nama_lengkap: true } },
        },
      });
    } else {
      const insertResult = await prisma.$queryRaw<Array<{ id_dispute: string }>>`
        INSERT INTO "Dispute" (
          id_dispute, id_task, id_reporter, id_respondent, reason, description, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid()::text, ${taskId}, ${reporterId}, ${respondentId}, ${reason}, ${description}, 'OPEN'::"DisputeStatus", NOW(), NOW()
        )
        RETURNING id_dispute
      `;
      const disputeId = insertResult[0]?.id_dispute;
      if (!disputeId) throw new Error('Gagal membuat entri sengketa.');

      if (evidence && evidence.length > 0) {
        for (const e of evidence) {
          await prisma.$executeRaw`
            INSERT INTO "DisputeEvidence" (
              id_evidence, id_dispute, id_user, type, content, created_at
            ) VALUES (
              gen_random_uuid()::text, ${disputeId}, ${reporterId}, ${e.type}, ${e.content}, NOW()
            )
          `;
        }
      }

      dispute = {
        id_dispute: disputeId,
        id_task: taskId,
        id_reporter: reporterId,
        id_respondent: respondentId,
        reason,
        description,
        status: 'OPEN',
        task: { judul_tugas: task.judul_tugas, kompensasi: task.kompensasi },
        reporter: { id_user: reporterId, nama_lengkap: task.requester?.nama_lengkap || '' },
      };
    }

    // 4. Notifikasi ke pihak lawan
    try {
      const reporterName = isRequester ? task.requester?.nama_lengkap : 'Pekerja';
      await notificationService.createNotification({
        userId: respondentId,
        type: 'reminder',
        title: '⚠️ Pengajuan Sengketa Tugas',
        message: `${reporterName} telah mengajukan mediasi sengketa untuk tugas "${task.judul_tugas}". Alasan: ${reason}.`,
        data: { disputeId: dispute.id_dispute, taskId: task.id_tasks },
      });
    } catch (_) {}

    return dispute;
  },

  /**
   * Mengambil detail lengkap satu sengketa.
   */
  async getDisputeDetail(disputeId: string, viewerUserId?: string, isAdmin = false) {
    if (typeof (prisma as any).dispute?.findUnique === 'function') {
      const dispute = await (prisma as any).dispute.findUnique({
        where: { id_dispute: disputeId },
        include: {
          task: {
            include: {
              status_task: { select: { nama_status: true } },
              kategori: { select: { id_category: true, nama_kategori: true, icon: true } },
              requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
            },
          },
          reporter: {
            select: {
              id_user: true,
              nama_lengkap: true,
              avatar_url: true,
              email: true,
              rating_avg: true,
              total_completed: true,
            },
          },
          respondent: {
            select: {
              id_user: true,
              nama_lengkap: true,
              avatar_url: true,
              email: true,
              rating_avg: true,
              total_completed: true,
            },
          },
          evidences: {
            orderBy: { created_at: 'asc' },
          },
          messages: {
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (!dispute) return null;

      if (!isAdmin && viewerUserId) {
        if (dispute.id_reporter !== viewerUserId && dispute.id_respondent !== viewerUserId) {
          throw new Error('Anda tidak memiliki akses ke ruang sengketa ini.');
        }
      }

      return dispute;
    } else {
      const rawDisputes = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Dispute" WHERE id_dispute = ${disputeId} LIMIT 1
      `;
      const dispute = rawDisputes[0];
      if (!dispute) return null;

      if (!isAdmin && viewerUserId) {
        if (dispute.id_reporter !== viewerUserId && dispute.id_respondent !== viewerUserId) {
          throw new Error('Anda tidak memiliki akses ke ruang sengketa ini.');
        }
      }

      const [task, reporter, respondent, evidences, messages] = await Promise.all([
        prisma.task.findUnique({
          where: { id_tasks: dispute.id_task },
          include: {
            status_task: { select: { nama_status: true } },
            kategori: { select: { id_category: true, nama_kategori: true, icon: true } },
            requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
          },
        }),
        prisma.user.findUnique({
          where: { id_user: dispute.id_reporter },
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true,
            email: true,
            rating_avg: true,
            total_completed: true,
          },
        }),
        prisma.user.findUnique({
          where: { id_user: dispute.id_respondent },
          select: {
            id_user: true,
            nama_lengkap: true,
            avatar_url: true,
            email: true,
            rating_avg: true,
            total_completed: true,
          },
        }),
        prisma.$queryRaw<any[]>`
          SELECT * FROM "DisputeEvidence" WHERE id_dispute = ${disputeId} ORDER BY created_at ASC
        `,
        prisma.$queryRaw<any[]>`
          SELECT * FROM "DisputeMessage" WHERE id_dispute = ${disputeId} ORDER BY created_at ASC
        `,
      ]);

      return {
        ...dispute,
        task,
        reporter,
        respondent,
        evidences,
        messages,
      };
    }
  },

  /**
   * Mengambil daftar sengketa milik user tertentu.
   */
  async getDisputesByUser(userId: string) {
    if (typeof (prisma as any).dispute?.findMany === 'function') {
      return (prisma as any).dispute.findMany({
        where: {
          OR: [{ id_reporter: userId }, { id_respondent: userId }],
        },
        include: {
          task: {
            select: {
              id_tasks: true,
              judul_tugas: true,
              kompensasi: true,
              status_task: { select: { nama_status: true } },
            },
          },
          reporter: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
          respondent: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
          _count: { select: { evidences: true, messages: true } },
        },
        orderBy: { created_at: 'desc' },
      });
    } else {
      const rawDisputes = await prisma.$queryRaw<any[]>`
        SELECT
          d.*,
          t.judul_tugas,
          t.kompensasi,
          st.nama_status as status_task_nama,
          u1.nama_lengkap as reporter_nama,
          u1.avatar_url as reporter_avatar,
          u2.nama_lengkap as respondent_nama,
          u2.avatar_url as respondent_avatar,
          (SELECT COUNT(*) FROM "DisputeEvidence" e WHERE e.id_dispute = d.id_dispute)::int as count_evidences,
          (SELECT COUNT(*) FROM "DisputeMessage" m WHERE m.id_dispute = d.id_dispute)::int as count_messages
        FROM "Dispute" d
        JOIN "Task" t ON d.id_task = t.id_tasks
        JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
        JOIN "User" u1 ON d.id_reporter = u1.id_user
        JOIN "User" u2 ON d.id_respondent = u2.id_user
        WHERE d.id_reporter = ${userId} OR d.id_respondent = ${userId}
        ORDER BY d.created_at DESC
      `;

      return rawDisputes.map((r) => ({
        id_dispute: r.id_dispute,
        id_task: r.id_task,
        id_reporter: r.id_reporter,
        id_respondent: r.id_respondent,
        reason: r.reason,
        description: r.description,
        status: r.status,
        resolution: r.resolution,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        task: {
          id_tasks: r.id_task,
          judul_tugas: r.judul_tugas,
          kompensasi: r.kompensasi,
          status_task: { nama_status: r.status_task_nama },
        },
        reporter: {
          id_user: r.id_reporter,
          nama_lengkap: r.reporter_nama,
          avatar_url: r.reporter_avatar,
        },
        respondent: {
          id_user: r.id_respondent,
          nama_lengkap: r.respondent_nama,
          avatar_url: r.respondent_avatar,
        },
        _count: {
          evidences: r.count_evidences || 0,
          messages: r.count_messages || 0,
        },
      }));
    }
  },

  /**
   * Mengambil daftar semua sengketa untuk Panel Admin (dengan filter & KPI).
   */
  async getAllDisputes(options?: DisputeFilterOptions) {
    const { status, search, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    if (typeof (prisma as any).dispute?.findMany === 'function') {
      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as DisputeStatus;
      }
      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { reason: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { task: { judul_tugas: { contains: q, mode: 'insensitive' } } },
          { reporter: { nama_lengkap: { contains: q, mode: 'insensitive' } } },
          { respondent: { nama_lengkap: { contains: q, mode: 'insensitive' } } },
        ];
      }

      const [items, total, countOpen, countInReview, countResolvedWorker, countResolvedRequester] =
        await Promise.all([
          (prisma as any).dispute.findMany({
            where,
            include: {
              task: {
                select: {
                  id_tasks: true,
                  judul_tugas: true,
                  kompensasi: true,
                  status_task: { select: { nama_status: true } },
                },
              },
              reporter: { select: { id_user: true, nama_lengkap: true, email: true, avatar_url: true } },
              respondent: { select: { id_user: true, nama_lengkap: true, email: true, avatar_url: true } },
              _count: { select: { evidences: true, messages: true } },
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
          }),
          (prisma as any).dispute.count({ where }),
          (prisma as any).dispute.count({ where: { status: DisputeStatus.OPEN } }),
          (prisma as any).dispute.count({ where: { status: DisputeStatus.IN_REVIEW } }),
          (prisma as any).dispute.count({ where: { status: DisputeStatus.RESOLVED_FAVOR_WORKER } }),
          (prisma as any).dispute.count({ where: { status: DisputeStatus.RESOLVED_FAVOR_REQUESTER } }),
        ]);

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total,
          open: countOpen,
          inReview: countInReview,
          resolvedWorker: countResolvedWorker,
          resolvedRequester: countResolvedRequester,
        },
      };
    } else {
      const rawDisputes = await prisma.$queryRaw<any[]>`
        SELECT
          d.*,
          t.judul_tugas,
          t.kompensasi,
          st.nama_status as status_task_nama,
          u1.nama_lengkap as reporter_nama,
          u1.email as reporter_email,
          u1.avatar_url as reporter_avatar,
          u2.nama_lengkap as respondent_nama,
          u2.email as respondent_email,
          u2.avatar_url as respondent_avatar,
          (SELECT COUNT(*) FROM "DisputeEvidence" e WHERE e.id_dispute = d.id_dispute)::int as count_evidences,
          (SELECT COUNT(*) FROM "DisputeMessage" m WHERE m.id_dispute = d.id_dispute)::int as count_messages
        FROM "Dispute" d
        JOIN "Task" t ON d.id_task = t.id_tasks
        JOIN "StatusTask" st ON t.id_status_task = st.id_status_task
        JOIN "User" u1 ON d.id_reporter = u1.id_user
        JOIN "User" u2 ON d.id_respondent = u2.id_user
        ORDER BY d.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      const counts = await prisma.$queryRaw<Array<{ count: number; open: number; in_review: number; res_worker: number; res_requester: number }>>`
        SELECT
          COUNT(*)::int as count,
          COUNT(*) FILTER (WHERE status = 'OPEN')::int as open,
          COUNT(*) FILTER (WHERE status = 'IN_REVIEW')::int as in_review,
          COUNT(*) FILTER (WHERE status = 'RESOLVED_FAVOR_WORKER')::int as res_worker,
          COUNT(*) FILTER (WHERE status = 'RESOLVED_FAVOR_REQUESTER')::int as res_requester
        FROM "Dispute"
      `;

      const c = counts[0] || { count: 0, open: 0, in_review: 0, res_worker: 0, res_requester: 0 };

      const items = rawDisputes.map((r) => ({
        id_dispute: r.id_dispute,
        id_task: r.id_task,
        id_reporter: r.id_reporter,
        id_respondent: r.id_respondent,
        reason: r.reason,
        description: r.description,
        status: r.status,
        resolution: r.resolution,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        task: {
          id_tasks: r.id_task,
          judul_tugas: r.judul_tugas,
          kompensasi: r.kompensasi,
          status_task: { nama_status: r.status_task_nama },
        },
        reporter: {
          id_user: r.id_reporter,
          nama_lengkap: r.reporter_nama,
          email: r.reporter_email,
          avatar_url: r.reporter_avatar,
        },
        respondent: {
          id_user: r.id_respondent,
          nama_lengkap: r.respondent_nama,
          email: r.respondent_email,
          avatar_url: r.respondent_avatar,
        },
        _count: {
          evidences: r.count_evidences || 0,
          messages: r.count_messages || 0,
        },
      }));

      return {
        items,
        pagination: {
          page,
          limit,
          total: c.count,
          totalPages: Math.ceil(c.count / limit) || 1,
        },
        stats: {
          total: c.count,
          open: c.open,
          inReview: c.in_review,
          resolvedWorker: c.res_worker,
          resolvedRequester: c.res_requester,
        },
      };
    }
  },

  /**
   * Menambahkan bukti baru ke dalam sengketa.
   */
  async submitEvidence(disputeId: string, userId: string, type: 'text' | 'image', content: string) {
    const dispute = await this.getDisputeDetail(disputeId);
    if (!dispute) throw new Error('Sengketa tidak ditemukan.');

    if (
      dispute.status === DisputeStatus.RESOLVED_FAVOR_WORKER ||
      dispute.status === DisputeStatus.RESOLVED_FAVOR_REQUESTER ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new Error('Sengketa ini telah ditutup dan tidak menerima bukti tambahan.');
    }

    if (dispute.id_reporter !== userId && dispute.id_respondent !== userId) {
      throw new Error('Anda tidak terdaftar dalam sengketa ini.');
    }

    let evidence: any = null;
    if (typeof (prisma as any).disputeEvidence?.create === 'function') {
      evidence = await (prisma as any).disputeEvidence.create({
        data: {
          id_dispute: disputeId,
          id_user: userId,
          type,
          content,
        },
      });
    } else {
      const res = await prisma.$queryRaw<Array<{ id_evidence: string }>>`
        INSERT INTO "DisputeEvidence" (
          id_evidence, id_dispute, id_user, type, content, created_at
        ) VALUES (
          gen_random_uuid()::text, ${disputeId}, ${userId}, ${type}, ${content}, NOW()
        )
        RETURNING id_evidence
      `;
      evidence = { id_evidence: res[0]?.id_evidence, id_dispute: disputeId, id_user: userId, type, content };
    }

    // Otomatis transisi status ke IN_REVIEW jika sebelumnya OPEN
    if (dispute.status === DisputeStatus.OPEN) {
      if (typeof (prisma as any).dispute?.update === 'function') {
        await (prisma as any).dispute.update({
          where: { id_dispute: disputeId },
          data: { status: DisputeStatus.IN_REVIEW },
        });
      } else {
        await prisma.$executeRaw`
          UPDATE "Dispute" SET status = 'IN_REVIEW'::"DisputeStatus", updated_at = NOW()
          WHERE id_dispute = ${disputeId}
        `;
      }
    }

    return evidence;
  },

  /**
   * Mengirimkan pesan mediasi dalam ruang sengketa.
   */
  async sendMessage(params: {
    disputeId: string;
    senderId: string;
    message: string;
    isAdmin?: boolean;
  }) {
    const { disputeId, senderId, message, isAdmin = false } = params;

    const dispute = await this.getDisputeDetail(disputeId);
    if (!dispute) throw new Error('Sengketa tidak ditemukan.');

    if (
      dispute.status === DisputeStatus.RESOLVED_FAVOR_WORKER ||
      dispute.status === DisputeStatus.RESOLVED_FAVOR_REQUESTER ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new Error('Sengketa ini telah diputuskan dan ditutup.');
    }

    if (!isAdmin && dispute.id_reporter !== senderId && dispute.id_respondent !== senderId) {
      throw new Error('Anda tidak memiliki izin mengirim pesan di ruang mediasi ini.');
    }

    let chatMessage: any = null;
    if (typeof (prisma as any).disputeMessage?.create === 'function') {
      chatMessage = await (prisma as any).disputeMessage.create({
        data: {
          id_dispute: disputeId,
          id_sender: senderId,
          message,
          is_admin: isAdmin,
        },
      });
    } else {
      const res = await prisma.$queryRaw<Array<{ id_message: string }>>`
        INSERT INTO "DisputeMessage" (
          id_message, id_dispute, id_sender, message, is_admin, created_at
        ) VALUES (
          gen_random_uuid()::text, ${disputeId}, ${senderId}, ${message}, ${isAdmin}, NOW()
        )
        RETURNING id_message
      `;
      chatMessage = { id_message: res[0]?.id_message, id_dispute: disputeId, id_sender: senderId, message, is_admin: isAdmin };
    }

    // Transisi status ke IN_REVIEW
    if (dispute.status === DisputeStatus.OPEN) {
      if (typeof (prisma as any).dispute?.update === 'function') {
        await (prisma as any).dispute.update({
          where: { id_dispute: disputeId },
          data: { status: DisputeStatus.IN_REVIEW },
        });
      } else {
        await prisma.$executeRaw`
          UPDATE "Dispute" SET status = 'IN_REVIEW'::"DisputeStatus", updated_at = NOW()
          WHERE id_dispute = ${disputeId}
        `;
      }
    }

    // Notifikasi ke pihak terkait
    try {
      const recipientId = senderId === dispute.id_reporter ? dispute.id_respondent : dispute.id_reporter;
      const senderName = isAdmin
        ? 'Admin Platform'
        : senderId === dispute.id_reporter
        ? dispute.reporter?.nama_lengkap
        : dispute.respondent?.nama_lengkap;

      await notificationService.createNotification({
        userId: recipientId,
        type: 'reminder',
        title: '💬 Pesan Mediasi Sengketa',
        message: `${senderName}: "${message.length > 60 ? message.substring(0, 57) + '...' : message}"`,
        data: { disputeId, senderId },
      });
    } catch (_) {}

    return chatMessage;
  },

  /**
   * Menyelesaikan sengketa secara manual oleh Admin (Full Manual Admin).
   * Menangani putusan escrow secara atomik.
   */
  async resolveDispute(params: {
    disputeId: string;
    adminId: string;
    resolution: string;
    favor: 'WORKER' | 'REQUESTER';
  }) {
    const { disputeId, adminId, resolution, favor } = params;

    const dispute = await this.getDisputeDetail(disputeId, undefined, true);
    if (!dispute) throw new Error('Sengketa tidak ditemukan.');

    if (
      dispute.status === DisputeStatus.RESOLVED_FAVOR_WORKER ||
      dispute.status === DisputeStatus.RESOLVED_FAVOR_REQUESTER ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new Error('Sengketa ini sudah diselesaikan sebelumnya.');
    }

    const task = dispute.task;
    const requesterId = task.id_requester;
    const workerId =
      dispute.id_reporter === requesterId ? dispute.id_respondent : dispute.id_reporter;

    // Resolve exact slot compensation amount for bidding or fixed-price tasks
    const rawSlotHeld = await prisma.$queryRaw<Array<{ held_slots_json: string | null }>>`
      SELECT held_slots_json FROM "Task" WHERE id_tasks = ${task.id_tasks}
    `;
    const slotHeldMap: Record<string, number> = (() => {
      try {
        return JSON.parse(rawSlotHeld[0]?.held_slots_json ?? '{}') as Record<string, number>;
      } catch {
        return {};
      }
    })();

    const workerApplicant = workerId ? await prisma.taskApplicants.findFirst({
      where: {
        id_tasks: task.id_tasks,
        id_worker: workerId,
      },
      select: { id_task_applicants: true, bid_amount: true },
    }) : null;

    const compensationAmount =
      workerApplicant && typeof slotHeldMap[workerApplicant.id_task_applicants] === 'number'
        ? slotHeldMap[workerApplicant.id_task_applicants]
        : (workerApplicant?.bid_amount ?? task.kompensasi);

    const newStatus =
      favor === 'WORKER'
        ? DisputeStatus.RESOLVED_FAVOR_WORKER
        : DisputeStatus.RESOLVED_FAVOR_REQUESTER;

    const [completedStatus, openStatus, rejectedApplicantStatus] = await Promise.all([
      prisma.statusTask.findFirst({ where: { nama_status: { equals: 'COMPLETED', mode: 'insensitive' } } }),
      prisma.statusTask.findFirst({ where: { nama_status: { equals: 'OPEN', mode: 'insensitive' } } }),
      prisma.statusTaskApplicants.findFirst({ where: { nama_status: { equals: 'REJECTED', mode: 'insensitive' } } }),
    ]);

    // Eksekusi mutasi saldo escrow, status lamaran, status task & sengketa dalam 1 transaksi atomik
    const updatedDispute = await prisma.$transaction(async (tx) => {
      // 1. Pessimistic row locking pada Dispute dan Task
      await tx.$queryRaw`SELECT 1 FROM "Dispute" WHERE id_dispute = ${disputeId} FOR UPDATE`;
      const lockedTask = await tx.$queryRaw<Array<{ id_status_task: string; held_slots_json: string | null }>>`
        SELECT id_status_task, held_slots_json FROM "Task" WHERE id_tasks = ${task.id_tasks} FOR UPDATE
      `;

      // 2. Tentukan nominal hold per slot yang akurat
      const slotHeldMap: Record<string, number> = (() => {
        try {
          return JSON.parse(lockedTask[0]?.held_slots_json ?? task.held_slots_json ?? '{}') as Record<string, number>;
        } catch {
          return {};
        }
      })();

      const workerApplicant = await tx.taskApplicants.findFirst({
        where: {
          id_tasks: task.id_tasks,
          id_worker: workerId,
        },
        select: { id_task_applicants: true, bid_amount: true },
      });

      const compensationAmount =
        workerApplicant && typeof slotHeldMap[workerApplicant.id_task_applicants] === 'number'
          ? slotHeldMap[workerApplicant.id_task_applicants]
          : (workerApplicant?.bid_amount ?? task.kompensasi);

      // Bersihkan slot dari held_slots_json
      if (workerApplicant) {
        delete slotHeldMap[workerApplicant.id_task_applicants];
      }
      const updatedHeldSlotsJson = Object.keys(slotHeldMap).length > 0 ? JSON.stringify(slotHeldMap) : null;

      // 3. Cek apakah masih ada worker aktif lain pada task ini
      const otherActiveWorkersCount = await tx.taskApplicants.count({
        where: {
          id_tasks: task.id_tasks,
          id_worker: { not: workerId },
          status_applicant: { nama_status: { in: ['ACCEPTED', 'accepted', 'IN_PROGRESS', 'in_progress'] } },
        },
      });

      // 4. Eksekusi mutasi saldo dan status
      if (favor === 'WORKER') {
        // Cairkan escrow ke worker
        await tx.user.update({
          where: { id_user: requesterId },
          data: {
            total_balance: { decrement: compensationAmount },
            held_balance: { decrement: compensationAmount },
          },
        });

        await tx.transactions.create({
          data: {
            id_user: requesterId,
            nominal: compensationAmount,
            tipe_transaksi: 'KELUAR',
            sub_type: 'task_payment',
            deskripsi: `Penyelesaian Sengketa (Pemberian Hak): ${task.judul_tugas}`,
          },
        });

        await tx.user.update({
          where: { id_user: workerId },
          data: { total_balance: { increment: compensationAmount } },
        });

        await tx.transactions.create({
          data: {
            id_user: workerId,
            nominal: compensationAmount,
            tipe_transaksi: 'MASUK',
            sub_type: 'task_earning',
            deskripsi: `Penyelesaian Sengketa (Hak Diterima): ${task.judul_tugas}`,
          },
        });

        // Task hanya berstatus COMPLETED jika seluruh worker aktif lainnya telah selesai
        if (otherActiveWorkersCount === 0 && completedStatus) {
          await tx.task.update({
            where: { id_tasks: task.id_tasks },
            data: {
              id_status_task: completedStatus.id_status_task,
              completed_at: new Date(),
              held_slots_json: updatedHeldSlotsJson,
            },
          });
        } else {
          await tx.task.update({
            where: { id_tasks: task.id_tasks },
            data: { held_slots_json: updatedHeldSlotsJson },
          });
        }
      } else {
        // Favor === 'REQUESTER': Refund escrow porsi worker tersebut ke saldo requester
        await tx.user.update({
          where: { id_user: requesterId },
          data: { held_balance: { decrement: compensationAmount } },
        });

        await tx.transactions.create({
          data: {
            id_user: requesterId,
            nominal: compensationAmount,
            tipe_transaksi: 'MASUK',
            sub_type: 'refund',
            deskripsi: `Pengembalian Sengketa: ${task.judul_tugas}`,
          },
        });

        // Update status pelamar yang bersengketa menjadi REJECTED
        if (workerApplicant && rejectedApplicantStatus) {
          await tx.taskApplicants.update({
            where: { id_task_applicants: workerApplicant.id_task_applicants },
            data: {
              id_status_task_applicants: rejectedApplicantStatus.id_status_task_applicants,
              alasan_penolakan: `Sengketa diputuskan memenangkan pembuat tugas: ${resolution}`,
              worker_confirmed: false,
            },
          });
        }

        // Jika tidak ada worker lain tersisa, kembalikan status task ke OPEN agar bisa menerima pelamar baru
        if (otherActiveWorkersCount === 0 && openStatus) {
          await tx.task.update({
            where: { id_tasks: task.id_tasks },
            data: {
              id_status_task: openStatus.id_status_task,
              accepted_at: null,
              worker_started: false,
              requester_started: false,
              held_slots_json: updatedHeldSlotsJson,
            },
          });
        } else {
          await tx.task.update({
            where: { id_tasks: task.id_tasks },
            data: { held_slots_json: updatedHeldSlotsJson },
          });
        }
      }

      // 5. Update entri Dispute
      return tx.dispute.update({
        where: { id_dispute: disputeId },
        data: {
          status: newStatus,
          resolution,
          resolved_by: adminId,
          resolved_at: new Date(),
        },
      });
    });

    // Kirim notifikasi hasil keputusan admin ke kedua belah pihak
    const decisionText =
      favor === 'WORKER'
        ? 'Keputusan memenangkan Pekerja (Dana escrow telah dicairkan ke pekerja).'
        : 'Keputusan memenangkan Pemberi Tugas (Dana escrow telah dikembalikan ke pembuat tugas).';

    try {
      await notificationService.createNotification({
        userId: dispute.id_reporter,
        type: 'reminder',
        title: '⚖️ Putusan Sengketa Ditetapkan',
        message: `Admin telah memutuskan sengketa tugas "${task.judul_tugas}". ${decisionText} Catatan: ${resolution}`,
        data: { disputeId, resolution, favor },
      });

      await notificationService.createNotification({
        userId: dispute.id_respondent,
        type: 'reminder',
        title: '⚖️ Putusan Sengketa Ditetapkan',
        message: `Admin telah memutuskan sengketa tugas "${task.judul_tugas}". ${decisionText} Catatan: ${resolution}`,
        data: { disputeId, resolution, favor },
      });
    } catch (_) {}

    return updatedDispute;
  },
};

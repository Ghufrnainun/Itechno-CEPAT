import { prisma } from '@/lib/prisma'
import { CreateTaskInput } from '@/lib/validations/task.schema'
import { notificationService } from '@/services/notification.service'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getStatusId(namaStatus: string): Promise<string> {
  const status = await prisma.statusTask.findFirst({
    where: { nama_status: namaStatus.toUpperCase() },
  })
  if (!status) throw new Error(`Status task '${namaStatus}' tidak ditemukan di database.`)
  return status.id_status_task
}

async function getApplicantStatusId(namaStatus: string): Promise<string> {
  const status = await prisma.statusTaskApplicants.findFirst({
    where: { nama_status: namaStatus.toUpperCase() },
  })
  if (!status) throw new Error(`Status applicant '${namaStatus}' tidak ditemukan di database.`)
  return status.id_status_task_applicants
}

// ─── Task Service ────────────────────────────────────────────────────────────

export const taskService = {
  /**
   * Buat task baru.
   * Simpan lokasi menggunakan raw SQL (PostGIS GEOGRAPHY).
   */
  async createTask(params: CreateTaskInput & { requesterId: string }) {
    const { judul_tugas, deskripsi_tugas, estimasi_waktu, kompensasi, latitude, longitude, requesterId, kategori } = params

    const openStatusId = await getStatusId('open')

    // Cari kategori yang sesuai — atau gunakan default (kategori pertama)
    let categoryId: string
    if (kategori) {
      const cat = await prisma.taskCategory.findFirst({
        where: { nama_kategori: { contains: kategori, mode: 'insensitive' } },
      })
      if (cat) {
        categoryId = cat.id_category
      } else {
        const defaultCat = await prisma.taskCategory.findFirst()
        if (!defaultCat) throw new Error('Tidak ada kategori task yang tersedia di database.')
        categoryId = defaultCat.id_category
      }
    } else {
      const defaultCat = await prisma.taskCategory.findFirst()
      if (!defaultCat) throw new Error('Tidak ada kategori task yang tersedia di database.')
      categoryId = defaultCat.id_category
    }

    // Insert task dengan raw SQL agar bisa pakai ST_MakePoint untuk PostGIS
    const result = await prisma.$queryRaw<{ id_tasks: string }[]>`
      INSERT INTO "Task" (
        id_tasks, id_requester, id_status_task,
        judul_tugas, deskripsi_tugas, estimasi_waktu, kompensasi,
        lokasi_geo, created_at, id_category
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
        ${categoryId}
      )
      RETURNING id_tasks
    `

    const taskId = result[0]?.id_tasks
    if (!taskId) throw new Error('Gagal membuat task.')

    // Jika ada kategori, link ke skill master juga
    if (kategori) {
      try {
        const skill = await prisma.skillsMaster.findFirst({
          where: { nama_skill: { contains: kategori, mode: 'insensitive' } },
        })
        if (skill) {
          await prisma.taskRequirements.create({
            data: { id_tasks: taskId, id_skill_master: skill.id_skill_master },
          })
        }
      } catch (_) {
        // Non-blocking: skip jika skill tidak ditemukan
      }
    }

    return taskId
  },

  /**
   * Ambil semua task dengan filter opsional.
   * Untuk nearby tasks, kita pakai raw PostGIS query.
   */
  async getTasks(params: {
    status?: string
    lat?: number
    lng?: number
    radiusKm?: number
    requesterId?: string
  }) {
    const { status, lat, lng, radiusKm = 2, requesterId } = params

    // Jika ada koordinat, gunakan PostGIS geo-query
    if (lat !== undefined && lng !== undefined) {
      const radiusMeters = radiusKm * 1000
      const statusValue = (status ?? 'open').toUpperCase()

      const tasks = await prisma.$queryRaw<
        Array<{
          id_tasks: string
          judul_tugas: string
          deskripsi_tugas: string
          estimasi_waktu: string | null
          kompensasi: number
          status: string
          created_at: Date
          id_requester: string
          requester_name: string
          requester_avatar: string | null
          distance_m: number
          latitude: number
          longitude: number
        }>
      >`
        SELECT
          t.id_tasks,
          t.judul_tugas,
          t.deskripsi_tugas,
          t.estimasi_waktu,
          t.kompensasi,
          LOWER(st.nama_status) AS status,
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
      `
      return tasks
    }

    // Tanpa koordinat: filter biasa
    const whereClause: Record<string, unknown> = {}
    if (status) {
      whereClause.status_task = { nama_status: status.toUpperCase() }
    }
    if (requesterId) {
      whereClause.id_requester = requesterId
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        status_task: { select: { nama_status: true } },
        requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
        requirements: {
          include: { skills_master: { select: { nama_skill: true } } },
        },
        _count: { select: { applicants: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return tasks.map((t) => ({
      id_tasks: t.id_tasks,
      judul_tugas: t.judul_tugas,
      deskripsi_tugas: t.deskripsi_tugas,
      estimasi_waktu: t.estimasi_waktu,
      kompensasi: t.kompensasi,
      status: t.status_task.nama_status.toLowerCase(),
      created_at: t.created_at,
      completed_at: t.completed_at,
      accepted_at: t.accepted_at,
      id_requester: t.id_requester,
      requester_name: t.requester.nama_lengkap,
      requester_avatar: t.requester.avatar_url,
      requirements: t.requirements.map((r) => r.skills_master.nama_skill),
      applicant_count: t._count.applicants,
    }))
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
          include: { skills_master: { select: { nama_skill: true } } },
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
            rater: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    })

    if (!task) return null

    // Ambil koordinat via raw query (karena PostGIS tidak bisa lewat Prisma select biasa)
    const geoResult = await prisma.$queryRaw<Array<{ latitude: number; longitude: number }>>`
      SELECT
        ST_Y(lokasi_geo::geometry) AS latitude,
        ST_X(lokasi_geo::geometry) AS longitude
      FROM "Task"
      WHERE id_tasks = ${taskId}
    `

    const geo = geoResult[0] ?? { latitude: null, longitude: null }

    // Cek apakah viewer sudah apply
    let hasApplied = false
    if (viewerUserId) {
      const app = await prisma.taskApplicants.findFirst({
        where: { id_tasks: taskId, id_worker: viewerUserId },
      })
      hasApplied = !!app
    }

    return {
      id_tasks: task.id_tasks,
      judul_tugas: task.judul_tugas,
      deskripsi_tugas: task.deskripsi_tugas,
      estimasi_waktu: task.estimasi_waktu,
      kompensasi: task.kompensasi,
      status: task.status_task.nama_status.toLowerCase(),
      created_at: task.created_at,
      completed_at: task.completed_at,
      accepted_at: task.accepted_at,
      latitude: geo.latitude,
      longitude: geo.longitude,
      id_requester: task.id_requester,
      requester: task.requester,
      requirements: task.requirements.map((r) => r.skills_master.nama_skill),
      applicants: task.applicants.map((a) => ({
        id_task_applicants: a.id_task_applicants,
        id_worker: a.id_worker,
        pesan: a.pesan,
        status: a.status_applicant.nama_status.toLowerCase(),
        applied_at: a.applied_at,
        worker: a.worker,
      })),
      reviews: task.reviews.map((r) => ({
        id_reviews: r.id_reviews,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        rater: r.rater,
      })),
      has_applied: hasApplied,
    }
  },

  /**
   * Worker apply ke task
   */
  async applyToTask(taskId: string, workerId: string, pesan?: string) {
    // Validasi: task harus 'open'
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: { status_task: true, requester: { select: { id_user: true, nama_lengkap: true } } },
    })
    if (!task) throw new Error('Task tidak ditemukan.')
    if (task.status_task.nama_status.toLowerCase() !== 'open') throw new Error('Task sudah tidak menerima lamaran.')
    if (task.id_requester === workerId) throw new Error('Anda tidak bisa melamar task milik sendiri.')

    // Cek duplikasi
    const existing = await prisma.taskApplicants.findFirst({
      where: { id_tasks: taskId, id_worker: workerId },
    })
    if (existing) throw new Error('Anda sudah melamar task ini sebelumnya.')

    const pendingStatusId = await getApplicantStatusId('pending')

    const applicant = await prisma.taskApplicants.create({
      data: {
        id_tasks: taskId,
        id_worker: workerId,
        id_status_task_applicants: pendingStatusId,
        pesan: pesan ?? null,
      },
    })

    // Notifikasi ke Requester
    const workerData = await prisma.user.findUnique({
      where: { id_user: workerId },
      select: { nama_lengkap: true },
    })

    try {
      await notificationService.createNotification({
        userId: task.id_requester,
        type: 'apply',
        title: 'Ada Pelamar Baru! 🎉',
        message: `${workerData?.nama_lengkap ?? 'Seseorang'} melamar task "${task.judul_tugas}".`,
        data: { task_id: taskId, applicant_id: applicant.id_task_applicants },
      })
    } catch (_) { /* non-blocking */ }

    return applicant
  },

  /**
   * Requester: accept atau reject applicant
   */
  async updateApplicantStatus(applicantId: string, requesterId: string, action: 'accept' | 'reject') {
    const applicant = await prisma.taskApplicants.findUnique({
      where: { id_task_applicants: applicantId },
      include: {
        task: { include: { status_task: true, requester: true } },
        worker: { select: { id_user: true, nama_lengkap: true } },
        status_applicant: true,
      },
    })

    if (!applicant) throw new Error('Data lamaran tidak ditemukan.')
    if (applicant.task.id_requester !== requesterId) throw new Error('Anda tidak memiliki akses ke task ini.')
    if (applicant.task.status_task.nama_status.toLowerCase() !== 'open') throw new Error('Task sudah tidak dalam status open.')

    if (action === 'accept') {
      // Accept: update applicant ke 'accepted', task ke 'accepted', reject sisanya
      const acceptedStatusId = await getApplicantStatusId('accepted')
      const rejectedStatusId = await getApplicantStatusId('rejected')
      const taskAcceptedStatusId = await getStatusId('accepted')

      await prisma.$transaction(async (tx) => {
        // Update applicant ini ke accepted
        await tx.taskApplicants.update({
          where: { id_task_applicants: applicantId },
          data: { id_status_task_applicants: acceptedStatusId },
        })

        // Reject semua applicant lain
        await tx.taskApplicants.updateMany({
          where: {
            id_tasks: applicant.id_tasks,
            id_task_applicants: { not: applicantId },
          },
          data: { id_status_task_applicants: rejectedStatusId },
        })

        // Update task status ke 'accepted'
        await tx.task.update({
          where: { id_tasks: applicant.id_tasks },
          data: {
            id_status_task: taskAcceptedStatusId,
            accepted_at: new Date(),
          },
        })
      })

      // Notifikasi ke worker yang diterima
      try {
        await notificationService.createNotification({
          userId: applicant.id_worker,
          type: 'accept',
          title: 'Lamaranmu Diterima! ✅',
          message: `Kamu dipilih untuk mengerjakan "${applicant.task.judul_tugas}". Segera mulai!`,
          data: { task_id: applicant.id_tasks },
        })
      } catch (_) { /* non-blocking */ }

    } else {
      // Reject
      const rejectedStatusId = await getApplicantStatusId('rejected')
      await prisma.taskApplicants.update({
        where: { id_task_applicants: applicantId },
        data: { id_status_task_applicants: rejectedStatusId },
      })
    }

    return { success: true }
  },

  /**
   * Update status task (worker: in_progress; requester: completed/cancelled)
   */
  async updateTaskStatus(taskId: string, userId: string, newStatus: 'in_progress' | 'completed' | 'cancelled') {
    const task = await prisma.task.findUnique({
      where: { id_tasks: taskId },
      include: {
        status_task: true,
        applicants: {
          where: { status_applicant: { nama_status: 'accepted' } },
          include: { worker: { select: { id_user: true, nama_lengkap: true } } },
        },
      },
    })

    if (!task) throw new Error('Task tidak ditemukan.')

    const currentStatus = task.status_task.nama_status.toLowerCase()
    const isRequester = task.id_requester === userId
    const acceptedWorker = task.applicants[0]
    const isWorker = acceptedWorker?.id_worker === userId

    // Validasi transisi status
    if (newStatus === 'in_progress' && currentStatus === 'accepted' && isWorker) {
      // Worker mulai kerjakan
    } else if (newStatus === 'completed' && (currentStatus === 'accepted' || currentStatus === 'in_progress') && isRequester) {
      // Requester konfirmasi selesai
    } else if (newStatus === 'cancelled' && (currentStatus === 'open' || currentStatus === 'accepted') && isRequester) {
      // Requester cancel task
    } else {
      throw new Error(`Transisi status dari '${currentStatus}' ke '${newStatus}' tidak diizinkan.`)
    }

    const newStatusId = await getStatusId(newStatus)
    const updateData: Record<string, unknown> = { id_status_task: newStatusId }
    if (newStatus === 'completed') {
      updateData.completed_at = new Date()

      // Transfer kompensasi ke worker (update total_balance)
      if (acceptedWorker) {
        await prisma.user.update({
          where: { id_user: acceptedWorker.id_worker },
          data: { total_balance: { increment: task.kompensasi }, total_completed: { increment: 1 } },
        })
        // Catat transaksi
        await prisma.transactions.create({
          data: {
            id_user: acceptedWorker.id_worker,
            nominal: task.kompensasi,
            tipe_transaksi: 'MASUK',
            deskripsi: `Kompensasi dari task: ${task.judul_tugas}`,
          },
        })
        // Notifikasi ke worker
        try {
          await notificationService.createNotification({
            userId: acceptedWorker.id_worker,
            type: 'points',
            title: 'Poin Diterima! 💰',
            message: `Task "${task.judul_tugas}" selesai. ${task.kompensasi.toLocaleString('id-ID')} poin telah masuk ke saldo kamu.`,
            data: { task_id: taskId },
          })
        } catch (_) { /* non-blocking */ }
      }
    }

    await prisma.task.update({
      where: { id_tasks: taskId },
      data: updateData,
    })

    return { success: true, new_status: newStatus }
  },

  /**
   * Histori task user (sebagai requester & sebagai worker)
   */
  async getUserTaskHistory(userId: string, role: 'requester' | 'worker', statusFilter?: string) {
    if (role === 'requester') {
      const where: Record<string, unknown> = { id_requester: userId }
      if (statusFilter) {
        where.status_task = { nama_status: statusFilter.toUpperCase() }
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          status_task: { select: { nama_status: true } },
          _count: { select: { applicants: true } },
          applicants: {
            where: { status_applicant: { nama_status: 'accepted' } },
            include: { worker: { select: { id_user: true, nama_lengkap: true, avatar_url: true } } },
            take: 1,
          },
          reviews: { where: { id_rater: { not: userId } }, take: 1 }, // review dari worker ke requester
        },
        orderBy: { created_at: 'desc' },
      })

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
      }))
    } else {
      // Worker: ambil semua task yang pernah diapply (berbagai status)
      const applications = await prisma.taskApplicants.findMany({
        where: {
          id_worker: userId,
          ...(statusFilter ? { task: { status_task: { nama_status: statusFilter.toUpperCase() } } } : {}),
        },
        include: {
          task: {
            include: {
              status_task: { select: { nama_status: true } },
              requester: { select: { id_user: true, nama_lengkap: true, avatar_url: true } },
              reviews: { where: { id_ratee: userId }, take: 1 }, // review yang diterima worker
            },
          },
          status_applicant: { select: { nama_status: true } },
        },
        orderBy: { applied_at: 'desc' },
      })

      return applications.map((a) => ({
        id_task_applicants: a.id_task_applicants,
        id_tasks: a.id_tasks,
        judul_tugas: a.task.judul_tugas,
        estimasi_waktu: a.task.estimasi_waktu,
        kompensasi: a.task.kompensasi,
        task_status: a.task.status_task.nama_status.toLowerCase(),
        application_status: a.status_applicant.nama_status.toLowerCase(),
        applied_at: a.applied_at,
        completed_at: a.task.completed_at,
        requester: a.task.requester,
        received_rating: a.task.reviews[0]?.rating ?? null,
        received_comment: a.task.reviews[0]?.comment ?? null,
      }))
    }
  },
}

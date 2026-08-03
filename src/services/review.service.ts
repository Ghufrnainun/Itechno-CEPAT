import { prisma } from '@/lib/prisma'
import { CreateReviewInput } from '@/lib/validations/review.schema'

export interface CreateReviewParams extends CreateReviewInput {
  rater_id: string
}

export const reviewService = {
  /**
   * Submit rating & review baru pasca task selesai
   */
  async createReview(params: CreateReviewParams) {
    const { task_id, rater_id, reviewee_id, rating, comment, url_photo } = params

    // 1. Cek keberadaan task
    const task = await prisma.task.findUnique({
      where: { id_tasks: task_id },
      include: {
        status_task: true,
        applicants: {
          where: {
            status_applicant: {
              nama_status: { in: ['ACCEPTED', 'accepted', 'Diterima', 'completed', 'Selesai'] },
            },
          },
        },
      },
    })

    if (!task) {
      throw new Error('Task tidak ditemukan.')
    }

    // 2. Cek rater adalah requester atau worker
    const isRequester = task.id_requester === rater_id
    const isWorker = task.applicants.some((app) => app.id_worker === rater_id)

    if (!isRequester && !isWorker) {
      throw new Error('Anda tidak memiliki hak akses untuk memberikan ulasan pada task ini.')
    }

    // 3. Cek reviewee adalah lawan transaksi yang valid
    if (rater_id === reviewee_id) {
      throw new Error('Anda tidak dapat memberikan ulasan untuk diri sendiri.')
    }

    // 4. Cek apakah sudah pernah beri review untuk task ini
    const existingReview = await prisma.reviews.findFirst({
      where: {
        id_tasks: task_id,
        id_rater: rater_id,
      },
    })

    if (existingReview) {
      throw new Error('Anda sudah memberikan ulasan untuk task ini.')
    }

    // 5. Simpan review & update rating_avg reviewee secara atomic (transaction)
    return await prisma.$transaction(async (tx) => {
      const review = await tx.reviews.create({
        data: {
          id_tasks: task_id,
          id_rater: rater_id,
          id_ratee: reviewee_id,
          rating,
          comment,
          url_photo,
        },
        include: {
          rater: {
            select: {
              id_user: true,
              nama_lengkap: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      })

      // Hitung akumulasi rating baru untuk reviewee
      const aggregate = await tx.reviews.aggregate({
        where: { id_ratee: reviewee_id },
        _avg: { rating: true },
        _count: { rating: true },
      })

      const newAvg = aggregate._avg.rating ? Math.round(aggregate._avg.rating * 100) / 100 : rating

      await tx.user.update({
        where: { id_user: reviewee_id },
        data: {
          rating_avg: newAvg,
        },
      })

      return review
    })
  },

  /**
   * Ambil daftar ulasan yang diterima user (publik)
   */
  async getUserReviews(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where: { id_ratee: userId },
        include: {
          rater: {
            select: {
              id_user: true,
              nama_lengkap: true,
              username: true,
              avatar_url: true,
            },
          },
          task: {
            select: {
              id_tasks: true,
              judul_tugas: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reviews.count({
        where: { id_ratee: userId },
      }),
    ])

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Ambil review spesifik untuk suatu task
   */
  async getTaskReviews(taskId: string) {
    return prisma.reviews.findMany({
      where: { id_tasks: taskId },
      include: {
        rater: {
          select: {
            id_user: true,
            nama_lengkap: true,
            username: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })
  },
}

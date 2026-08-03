import { z } from 'zod'

export const createReviewSchema = z.object({
  task_id: z.string().min(1, 'Task ID wajib diisi.').uuid('Format Task ID tidak valid.'),
  reviewee_id: z.string().min(1, 'Reviewee ID wajib diisi.').uuid('Format Reviewee ID tidak valid.'),
  rating: z
    .number()
    .min(1, 'Rating minimal 1.')
    .max(5, 'Rating maksimal 5.'),
  comment: z
    .string()
    .max(500, 'Komentar maksimal 500 karakter.')
    .optional(),
  url_photo: z
    .string()
    .url('Format URL foto tidak valid.')
    .optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

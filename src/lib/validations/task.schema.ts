import { z } from 'zod'

export const createTaskSchema = z.object({
  judul_tugas: z.string().min(5, 'Judul tugas minimal 5 karakter.').max(120, 'Judul tugas maksimal 120 karakter.'),
  deskripsi_tugas: z.string().min(10, 'Deskripsi minimal 10 karakter.').max(2000, 'Deskripsi maksimal 2000 karakter.'),
  estimasi_waktu: z.string().min(1, 'Estimasi waktu wajib diisi.'),
  kompensasi: z.number().positive('Kompensasi harus lebih dari 0.'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid.'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid.'),
  id_category: z.string().min(1, 'Kategori tugas wajib dipilih.'),
  skill_requirements: z.array(z.string()).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const applyTaskSchema = z.object({
  pesan: z.string().max(500, 'Pesan maksimal 500 karakter.').optional(),
})

export type ApplyTaskInput = z.infer<typeof applyTaskSchema>

export const updateTaskStatusSchema = z.object({
  status: z.enum(['confirm_start', 'completed', 'cancelled']),
})

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>

export const updateApplicantSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

export type UpdateApplicantInput = z.infer<typeof updateApplicantSchema>

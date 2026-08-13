import { z } from 'zod'

export const createTaskSchema = z.preprocess((val: any) => {
  if (typeof val !== 'object' || val === null) return val;
  return {
    judul_tugas: val.judul_tugas ?? val.title,
    deskripsi_tugas: val.deskripsi_tugas ?? val.description,
    estimasi_waktu: val.estimasi_waktu ?? (val.duration ? (typeof val.duration === 'string' && val.duration.includes('Jam') ? val.duration : `${val.duration} Jam`) : '1 Jam'),
    kompensasi: typeof val.kompensasi === 'number' ? val.kompensasi : typeof val.compensation === 'number' ? val.compensation : parseFloat(val.compensation || val.kompensasi || '0'),
    latitude: typeof val.latitude === 'number' ? val.latitude : typeof val.lat === 'number' ? val.lat : parseFloat(val.latitude || val.lat || '0'),
    longitude: typeof val.longitude === 'number' ? val.longitude : typeof val.lng === 'number' ? val.lng : parseFloat(val.longitude || val.lng || '0'),
    id_category: val.id_category ?? val.categoryId,
    kategori: val.kategori ?? val.category,
    skill_requirements: val.skill_requirements ?? val.skills ?? [],
    max_applicants: typeof val.max_applicants === 'number' ? val.max_applicants : typeof val.maxApplicants === 'number' ? val.maxApplicants : parseInt(val.max_applicants || val.maxApplicants || '1', 10),
    max_apply_attempts: typeof val.max_apply_attempts === 'number' ? val.max_apply_attempts : typeof val.maxApplyAttempts === 'number' ? val.maxApplyAttempts : parseInt(val.max_apply_attempts || val.maxApplyAttempts || '3', 10),
  };
}, z.object({
  judul_tugas: z.string().min(5, 'Judul tugas minimal 5 karakter.').max(120, 'Judul tugas maksimal 120 karakter.'),
  deskripsi_tugas: z.string().min(10, 'Deskripsi minimal 10 karakter.').max(2000, 'Deskripsi maksimal 2000 karakter.'),
  estimasi_waktu: z.string().min(1, 'Estimasi waktu wajib diisi.'),
  kompensasi: z.number().positive('Kompensasi harus lebih dari 0.'),
  latitude: z.number().min(-90).max(90, 'Latitude tidak valid.'),
  longitude: z.number().min(-180).max(180, 'Longitude tidak valid.'),
  id_category: z.string().optional(),
  kategori: z.string().optional(),
  skill_requirements: z.array(z.string()).optional(),
  max_applicants: z.number().int().min(1, 'Batas pelamar minimal 1.').default(1),
  max_apply_attempts: z.number().int().min(1, 'Batas percobaan minimal 1.').default(3),
}))

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const applyTaskSchema = z.object({
  pesan: z.string().max(500, 'Pesan maksimal 500 karakter.').optional(),
})

export type ApplyTaskInput = z.infer<typeof applyTaskSchema>

export const updateTaskStatusSchema = z.object({
  status: z.enum(['start', 'confirm_start', 'completed', 'cancelled']),
})

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>

export const updateApplicantSchema = z.object({
  action: z.enum(['accept', 'reject']),
  alasan_penolakan: z.string().max(500, 'Alasan penolakan maksimal 500 karakter.').optional(),
})

export type UpdateApplicantInput = z.infer<typeof updateApplicantSchema>

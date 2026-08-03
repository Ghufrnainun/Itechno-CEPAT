import { z } from 'zod'

export const notificationQuerySchema = z.object({
  unread: z.string().optional().transform((val) => val === 'true'),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
})

export const updateFcmTokenSchema = z.object({
  fcm_token: z.string().min(1, 'FCM Token tidak boleh kosong.'),
})

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>

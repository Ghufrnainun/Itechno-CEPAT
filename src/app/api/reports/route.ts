import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase/admin'

const reportSchema = z.object({
  kategori: z.string().trim().min(2, 'Kategori minimal 2 karakter').max(50, 'Kategori maksimal 50 karakter'),
  subjek: z.string().trim().min(3, 'Subjek minimal 3 karakter').max(150, 'Subjek maksimal 150 karakter'),
  deskripsi: z.string().trim().min(5, 'Deskripsi minimal 5 karakter').max(2000, 'Deskripsi maksimal 2000 karakter'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { auth_id: authUser.id },
          ...(authUser.email ? [{ email: authUser.email }] : []),
        ],
      },
      select: { id_user: true, nama_lengkap: true, email: true, username: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan di database.' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parseResult = reportSchema.safeParse(body)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0]?.message || 'Input laporan tidak valid.'
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      )
    }

    const { kategori, subjek, deskripsi } = parseResult.data

    // Rate Limiting: Maksimal 3 laporan per 10 menit per user
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentReportsCount = await prisma.userReport.count({
      where: {
        user_id: dbUser.id_user,
        created_at: { gte: tenMinutesAgo },
      },
    })

    if (recentReportsCount >= 3) {
      return NextResponse.json(
        { success: false, message: 'Batas laporan terlampaui. Anda hanya dapat mengirim maksimal 3 laporan dalam 10 menit.' },
        { status: 429 }
      )
    }

    // 1. Simpan laporan ke tabel UserReport
    const report = await prisma.userReport.create({
      data: {
        user_id: dbUser.id_user,
        kategori,
        subjek,
        deskripsi,
        status: 'pending',
      },
    })

    // 2. Ambil daftar Admin untuk dikirimkan notifikasi & FCM Push Notification
    const adminUsers = await prisma.user.findMany({
      where: { role: { nama_role: 'Admin' } },
      select: { id_user: true, fcm_token: true },
    })

    const titleNotif = `Laporan Baru dari ${dbUser.nama_lengkap}`
    const bodyNotif = `[${report.kategori}] ${report.subjek}`

    // 3. Buat notifikasi DB secara batch (createMany) & Kirim FCM Push
    if (adminUsers.length > 0) {
      await prisma.notifications.createMany({
        data: adminUsers.map((admin) => ({
          user_id: admin.id_user,
          type: 'user_report',
          title: titleNotif,
          message: bodyNotif,
          data: {
            report_id: report.id_report,
            user_id: dbUser.id_user,
            user_name: dbUser.nama_lengkap,
            kategori: report.kategori,
            subjek: report.subjek,
            created_at: report.created_at.toISOString(),
          },
        })),
      })

      // Kirim Push Notification via FCM secara asinkron
      const fcmAdmins = adminUsers.filter((admin) => admin.fcm_token)
      if (fcmAdmins.length > 0) {
        Promise.allSettled(
          fcmAdmins.map(async (admin) => {
            try {
              await sendPushNotification({
                token: admin.fcm_token!,
                title: titleNotif,
                body: bodyNotif,
                data: {
                  report_id: report.id_report,
                  type: 'user_report',
                  link: `/admin/reports?id=${report.id_report}`,
                },
              })
            } catch (fcmErr: any) {
              console.warn(`[POST /api/reports] FCM push warning for admin ${admin.id_user}:`, fcmErr)
              if (fcmErr?.code === 'messaging/registration-token-not-registered') {
                await prisma.user.update({
                  where: { id_user: admin.id_user },
                  data: { fcm_token: null },
                }).catch(() => {})
              }
            }
          })
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan Anda berhasil dikirim ke Admin.',
      data: report,
    })
  } catch (error) {
    console.error('[POST /api/reports] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

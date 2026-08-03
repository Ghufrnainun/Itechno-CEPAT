import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createReviewSchema } from '@/lib/validations/review.schema'
import { reviewService } from '@/services/review.service'
import { notificationService } from '@/services/notification.service'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    // 2. Ambil User ID dari Prisma
    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true, nama_lengkap: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 3. Validasi Payload
    const body = await request.json()
    const parsed = createReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    // 4. Buat Review via Service
    const review = await reviewService.createReview({
      ...parsed.data,
      rater_id: currentUser.id_user,
    })

    // 5. Kirim Notifikasi ke Reviewee
    try {
      await notificationService.createNotification({
        userId: parsed.data.reviewee_id,
        type: 'review',
        title: 'Ulasan Baru Diterima! ⭐',
        message: `${currentUser.nama_lengkap} memberikan rating ${parsed.data.rating} bintang untuk tugas Anda.`,
        data: {
          task_id: parsed.data.task_id,
          rating: parsed.data.rating,
        },
      })
    } catch (notifErr) {
      console.warn('[POST /api/reviews] Gagal mengirim notifikasi:', notifErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Ulasan berhasil disimpan.',
        data: review,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[POST /api/reviews] Error:', error)
    return NextResponse.json(
      { success: false, message: errMessage },
      { status: 400 }
    )
  }
}

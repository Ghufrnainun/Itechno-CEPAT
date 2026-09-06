import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { notificationService } from '@/services/notification.service'
import { sendPushNotification } from '@/lib/firebase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi autentikasi user
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: {
        id_user: true,
        nama_lengkap: true,
        email: true,
        total_balance: true,
        held_balance: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 2. Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'wallet:withdraw', {
      maxRequests: 5,
      windowSeconds: 60,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terlalu banyak permintaan penarikan. Silakan tunggu 1 menit.',
        },
        { status: 429 }
      )
    }

    // 3. Validasi payload body
    const body = await request.json().catch(() => ({}))
    const { amount, bank, accountNumber, accountName } = body

    const numAmount = parseInt(String(amount), 10)
    if (isNaN(numAmount) || numAmount < 20000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nominal penarikan minimal Rp 20.000.',
        },
        { status: 400 }
      )
    }

    const trimmedBank = String(bank || '').trim()
    const trimmedAccountNumber = String(accountNumber || '').trim()
    const trimmedAccountName = String(accountName || '').trim()

    if (!trimmedBank) {
      return NextResponse.json(
        { success: false, message: 'Pilih bank atau e-wallet tujuan penarikan.' },
        { status: 400 }
      )
    }

    if (!trimmedAccountNumber || trimmedAccountNumber.length < 4) {
      return NextResponse.json(
        { success: false, message: 'Nomor rekening / e-wallet tidak valid.' },
        { status: 400 }
      )
    }

    if (!trimmedAccountName || trimmedAccountName.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Nama pemilik rekening harus diisi.' },
        { status: 400 }
      )
    }

    // 4. Atomic verification and hold balance
    const withdrawalId = crypto.randomUUID()

    await prisma.$transaction(async (tx) => {
      // Lock row user untuk mencegah race condition
      const userRows = await tx.$queryRaw<
        Array<{ id_user: string; total_balance: number; held_balance: number }>
      >`SELECT id_user, total_balance, held_balance FROM "User" WHERE id_user = ${currentUser.id_user} FOR UPDATE`

      const user = userRows[0]
      if (!user) {
        throw new Error('User tidak ditemukan.')
      }

      const available = user.total_balance - user.held_balance
      if (available < numAmount) {
        throw new Error('Saldo yang dapat ditarik tidak mencukupi.')
      }

      // Tahan saldo user (held_balance)
      await tx.user.update({
        where: { id_user: currentUser.id_user },
        data: {
          held_balance: { increment: numAmount },
        },
      })
    })

    // 5. Buat data payload notifikasi
    const withdrawalPayload = {
      withdrawal_id: withdrawalId,
      subType: 'withdrawal',
      status: 'pending',
      amount: numAmount,
      bank: trimmedBank,
      account_number: trimmedAccountNumber,
      account_name: trimmedAccountName,
      requester_id: currentUser.id_user,
      requester_name: currentUser.nama_lengkap,
      created_at: new Date().toISOString(),
    }

    // 6. Kirim notifikasi admin_alert ke semua Admin
    const adminUsers = await prisma.user.findMany({
      where: { role: { nama_role: 'Admin' } },
      select: { id_user: true, fcm_token: true },
    })

    const adminTitle = `Permintaan Penarikan: Rp ${numAmount.toLocaleString('id-ID')}`
    const adminMessage = `${currentUser.nama_lengkap} mengajukan penarikan Rp ${numAmount.toLocaleString('id-ID')} ke ${trimmedBank} ${trimmedAccountNumber} a.n ${trimmedAccountName}`

    if (adminUsers.length > 0) {
      await prisma.notifications.createMany({
        data: adminUsers.map((admin) => ({
          user_id: admin.id_user,
          type: 'admin_alert',
          title: adminTitle,
          message: adminMessage,
          data: withdrawalPayload,
          is_read: false,
        })),
      })

      // Kirim Push Notification ke admin yang memiliki FCM token
      const fcmAdmins = adminUsers.filter((a) => a.fcm_token)
      if (fcmAdmins.length > 0) {
        fcmAdmins.forEach(async (admin) => {
          try {
            await sendPushNotification({
              token: admin.fcm_token!,
              title: adminTitle,
              body: adminMessage,
              data: {
                type: 'admin_alert',
                subType: 'withdrawal',
                withdrawal_id: withdrawalId,
              },
            })
          } catch (_) {
            // fire and forget
          }
        })
      }
    }

    // 7. Kirim notifikasi status pending ke user
    await notificationService.createNotification({
      userId: currentUser.id_user,
      type: 'points',
      title: 'Permintaan Penarikan Sedang Diproses',
      message: `Permintaan penarikan dana sebesar Rp ${numAmount.toLocaleString('id-ID')} ke ${trimmedBank} (${trimmedAccountNumber} a.n ${trimmedAccountName}) telah diterima dan sedang diproses admin.`,
      data: withdrawalPayload,
    })

    return NextResponse.json({
      success: true,
      message: 'Permintaan penarikan saldo berhasil diajukan.',
      data: withdrawalPayload,
    })
  } catch (error: any) {
    console.error('[POST /api/wallet/withdraw] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Terjadi kesalahan saat memproses penarikan saldo.',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionSubType } from '@prisma/client'
import { notificationService } from '@/services/notification.service'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid || !auth.adminId) {
      return unauthorizedResponse()
    }

    const body = await request.json().catch(() => ({}))
    const { notificationId, action, rejectionReason } = body

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'ID notifikasi diperlukan.' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, message: 'Aksi harus berupa approve atau reject.' },
        { status: 400 }
      )
    }

    // Ambil notifikasi terkait
    const notification = await prisma.notifications.findUnique({
      where: { id_notifications: notificationId },
    })

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notifikasi penarikan tidak ditemukan.' },
        { status: 404 }
      )
    }

    const data = (notification.data as Record<string, any>) || {}
    if (data.subType !== 'withdrawal') {
      return NextResponse.json(
        { success: false, message: 'Notifikasi bukan tipe penarikan valid.' },
        { status: 400 }
      )
    }

    if (data.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: `Permintaan ini sudah diproses sebelumnya (${data.status}).`,
        },
        { status: 400 }
      )
    }

    const requesterId = String(data.requester_id)
    const amount = Number(data.amount)
    const bank = String(data.bank)
    const accountNumber = String(data.account_number)
    const accountName = String(data.account_name)
    const withdrawalId = data.withdrawal_id || notificationId

    if (!requesterId || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Data penarikan tidak valid.' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // ── APPROVE: Potong total_balance & held_balance, buat Transaksi KELUAR ──
      await prisma.$transaction(async (tx) => {
        // Kurangi total_balance dan held_balance user
        await tx.user.update({
          where: { id_user: requesterId },
          data: {
            total_balance: { decrement: amount },
            held_balance: { decrement: amount },
          },
        })

        // Buat mutasi transaksi KELUAR
        await tx.transactions.create({
          data: {
            id_user: requesterId,
            nominal: amount,
            tipe_transaksi: TransactionType.KELUAR,
            sub_type: TransactionSubType.hold,
            deskripsi: `Penarikan Saldo ke ${bank} ${accountNumber} a.n ${accountName}`,
          },
        })

        // Update notifikasi ini
        await tx.notifications.update({
          where: { id_notifications: notificationId },
          data: {
            is_read: true,
            data: {
              ...data,
              status: 'completed',
              processed_at: new Date().toISOString(),
              processed_by: auth.adminId,
            },
          },
        })
      })

      // Kirim notifikasi sukses ke User
      await notificationService.createNotification({
        userId: requesterId,
        type: 'points',
        title: 'Penarikan Saldo Berhasil',
        message: `Dana sebesar Rp ${amount.toLocaleString('id-ID')} telah berhasil ditransfer ke ${bank} (${accountNumber} a.n ${accountName}). Silakan cek mutasi rekening Anda.`,
        data: {
          withdrawal_id: withdrawalId,
          subType: 'withdrawal',
          status: 'completed',
          amount,
          bank,
          account_number: accountNumber,
          account_name: accountName,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Penarikan saldo berhasil disetujui dan dicatat.',
      })
    } else {
      // ── REJECT: Kembalikan held_balance ke user tanpa memotong total_balance ──
      const reasonText = String(rejectionReason || 'Ditolak oleh admin').trim()

      await prisma.$transaction(async (tx) => {
        // Kurangi held_balance saja agar saldo kembali aktif
        await tx.user.update({
          where: { id_user: requesterId },
          data: {
            held_balance: { decrement: amount },
          },
        })

        // Update notifikasi ini
        await tx.notifications.update({
          where: { id_notifications: notificationId },
          data: {
            is_read: true,
            data: {
              ...data,
              status: 'rejected',
              rejection_reason: reasonText,
              rejected_at: new Date().toISOString(),
              processed_by: auth.adminId,
            },
          },
        })
      })

      // Kirim notifikasi penolakan ke User
      await notificationService.createNotification({
        userId: requesterId,
        type: 'points',
        title: 'Penarikan Saldo Ditolak',
        message: `Permintaan penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} ditolak. Alasan: ${reasonText}. Saldo Anda telah dikembalikan.`,
        data: {
          withdrawal_id: withdrawalId,
          subType: 'withdrawal',
          status: 'rejected',
          amount,
          bank,
          account_number: accountNumber,
          account_name: accountName,
          reason: reasonText,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Permintaan penarikan telah ditolak dan saldo dikembalikan ke pengguna.',
      })
    }
  } catch (error: any) {
    console.error('[POST /api/admin/withdrawals/action] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Terjadi kesalahan saat memproses aksi penarikan.',
      },
      { status: 500 }
    )
  }
}

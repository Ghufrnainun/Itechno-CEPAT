import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionSubType } from '@prisma/client'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: number      // total_balance - held_balance = saldo yang bisa dipakai
  held_balance: number // escrow aktif (task yang sedang in_progress/accepted)
  total_balance: number
}

export interface TransactionItem {
  id: string
  type: TransactionType
  sub_type: TransactionSubType
  description: string | null
  amount: number        // positif = MASUK, negatif = KELUAR
  createdAt: Date
}

export interface TransactionHistory {
  transactions: TransactionItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// ─── Wallet Service ──────────────────────────────────────────────────────────

export const walletService = {
  /**
   * Ambil saldo wallet user (balance tersedia, held, dan total).
   * available = total_balance - held_balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: { total_balance: true, held_balance: true },
    })

    if (!user) throw new Error('User tidak ditemukan.')

    return {
      total_balance: user.total_balance,
      held_balance: user.held_balance,
      balance: user.total_balance - user.held_balance,
    }
  },

  /**
   * Ambil histori transaksi user dengan pagination.
   */
  async getHistory(userId: string, page = 1, limit = 20): Promise<TransactionHistory> {
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
        where: { id_user: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transactions.count({ where: { id_user: userId } }),
    ])

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id_transactions,
        type: tx.tipe_transaksi,
        sub_type: tx.sub_type,
        description: tx.deskripsi,
        amount: tx.tipe_transaksi === TransactionType.MASUK ? tx.nominal : -tx.nominal,
        createdAt: tx.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Simulasi top-up saldo (bukan payment gateway riil — untuk demo).
   * Atomik: insert Transactions + increment total_balance dalam 1 prisma.$transaction.
   */
  async topUp(userId: string, amount: number): Promise<WalletBalance> {
    if (amount <= 0) throw new Error('Nominal top-up harus lebih dari 0.')

    await prisma.$transaction([
      prisma.transactions.create({
        data: {
          id_user: userId,
          nominal: amount,
          tipe_transaksi: TransactionType.MASUK,
          sub_type: TransactionSubType.topup,
          deskripsi: 'Top Up Saldo (Simulasi)',
        },
      }),
      prisma.user.update({
        where: { id_user: userId },
        data: { total_balance: { increment: amount } },
      }),
    ])

    return this.getBalance(userId)
  },

  /**
   * Hold escrow saat requester posting task.
   * Atomik: insert Transactions (KELUAR/hold) + increment held_balance + decrement tidak perlu
   * karena held dipisah dari total — total tetap, held naik, available turun.
   */
  async holdEscrow(userId: string, amount: number, taskId: string, taskTitle: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id_user: userId },
      select: { total_balance: true, held_balance: true },
    })
    if (!user) throw new Error('User tidak ditemukan.')

    const available = user.total_balance - user.held_balance
    if (available < amount) throw new Error('Saldo tidak cukup untuk menahan escrow.')

    await prisma.$transaction([
      prisma.transactions.create({
        data: {
          id_user: userId,
          nominal: amount,
          tipe_transaksi: TransactionType.KELUAR,
          sub_type: TransactionSubType.hold,
          deskripsi: `Escrow Ditahan: ${taskTitle}`,
        },
      }),
      prisma.user.update({
        where: { id_user: userId },
        data: { held_balance: { increment: amount } },
      }),
    ])
  },

  /**
   * Release escrow ke worker setelah task completed.
   * Atomik dalam 1 prisma.$transaction:
   *   - Kurangi total_balance requester & held_balance requester
   *   - Tambah total_balance worker
   *   - Insert 2 entri Transactions (keluar dari requester, masuk ke worker)
   */
  async releaseEscrow(
    requesterId: string,
    workerId: string,
    amount: number,
    taskTitle: string
  ): Promise<void> {
    await prisma.$transaction([
      // Catat pengeluaran final dari requester
      prisma.transactions.create({
        data: {
          id_user: requesterId,
          nominal: amount,
          tipe_transaksi: TransactionType.KELUAR,
          sub_type: TransactionSubType.task_payment,
          deskripsi: `Pembayaran Task: ${taskTitle}`,
        },
      }),
      // Kurangi total_balance & held_balance requester sekaligus
      prisma.user.update({
        where: { id_user: requesterId },
        data: {
          total_balance: { decrement: amount },
          held_balance: { decrement: amount },
        },
      }),
      // Catat pendapatan worker
      prisma.transactions.create({
        data: {
          id_user: workerId,
          nominal: amount,
          tipe_transaksi: TransactionType.MASUK,
          sub_type: TransactionSubType.task_earning,
          deskripsi: `Pendapatan Task: ${taskTitle}`,
        },
      }),
      // Tambah saldo worker
      prisma.user.update({
        where: { id_user: workerId },
        data: { total_balance: { increment: amount } },
      }),
    ])
  },

  /**
   * Refund escrow ke requester jika task di-cancel setelah hold.
   */
  async refundEscrow(userId: string, amount: number, taskTitle: string): Promise<void> {
    await prisma.$transaction([
      prisma.transactions.create({
        data: {
          id_user: userId,
          nominal: amount,
          tipe_transaksi: TransactionType.MASUK,
          sub_type: TransactionSubType.refund,
          deskripsi: `Refund Pembatalan Task: ${taskTitle}`,
        },
      }),
      prisma.user.update({
        where: { id_user: userId },
        data: { held_balance: { decrement: amount } },
      }),
    ])
  },
}

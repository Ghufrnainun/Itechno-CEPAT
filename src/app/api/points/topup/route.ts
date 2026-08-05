import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { walletService } from '@/services/wallet.service'

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

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id_user: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const amount = parseInt(String(body.amount), 10)

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal top-up tidak valid. Harus berupa angka positif.' },
        { status: 400 }
      )
    }

    if (amount > 10_000_000) {
      return NextResponse.json(
        { success: false, message: 'Nominal top-up maksimal 10.000.000 per transaksi.' },
        { status: 400 }
      )
    }

    const updatedBalance = await walletService.topUp(currentUser.id_user, amount)

    return NextResponse.json({
      success: true,
      message: `Top up ${amount.toLocaleString('id-ID')} pts berhasil.`,
      data: updatedBalance,
    })
  } catch (error) {
    console.error('[POST /api/points/topup] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan top-up saldo.' },
      { status: 500 }
    )
  }
}

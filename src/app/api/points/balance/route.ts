import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { walletService } from '@/services/wallet.service'

export async function GET(_request: NextRequest) {
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

    const balance = await walletService.getBalance(currentUser.id_user)

    return NextResponse.json({ success: true, data: balance })
  } catch (error) {
    console.error('[GET /api/points/balance] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil saldo.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { updateFcmTokenSchema } from '@/lib/validations/notification.schema'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = updateFcmTokenSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { email: authUser.email },
      data: { fcm_token: parsed.data.fcm_token },
    })

    return NextResponse.json({
      success: true,
      message: 'FCM Token berhasil diperbarui.',
    })
  } catch (error) {
    console.error('[PATCH /api/users/me/fcm-token] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}

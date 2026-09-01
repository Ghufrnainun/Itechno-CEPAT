import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { taskService } from '@/services/task.service'

const applySchema = z.object({
  id_tasks: z.string().uuid('ID Task tidak valid'),
  pesan: z.string().optional(),
  bid_amount: z.number().positive('Harga penawaran harus lebih dari 0.').optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    // 2. Validate request payload
    const body = await request.json()
    const parsed = applySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal.', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { id_tasks, pesan, bid_amount } = parsed.data

    // 3. Retrieve user profile mapping
    const dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 4. Apply via taskService (includes validation + notification to requester)
    const newApplication = await taskService.applyToTask(id_tasks, dbUser.id_user, pesan, bid_amount)

    return NextResponse.json({
      success: true,
      message: 'Berhasil melamar tugas.',
      data: newApplication
    }, { status: 201 })

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.'
    console.error('[POST /api/tasks/apply] Error:', error)
    return NextResponse.json(
      { success: false, message: errMessage },
      { status: error instanceof Error && error.message.includes('tidak') ? 400 : 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const parsed = applySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal.', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { id_tasks } = parsed.data

    const dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    await taskService.cancelApplication(id_tasks, dbUser.id_user)

    return NextResponse.json({
      success: true,
      message: 'Berhasil membatalkan lamaran.'
    })

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.'
    console.error('[DELETE /api/tasks/apply] Error:', error)
    return NextResponse.json(
      { success: false, message: errMessage },
      { status: error instanceof Error && error.message.includes('tidak') ? 400 : 500 }
    )
  }
}


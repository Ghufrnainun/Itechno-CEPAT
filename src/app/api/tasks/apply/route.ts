import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applySchema = z.object({
  id_tasks: z.string().uuid('ID Task tidak valid'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
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

    const { id_tasks } = parsed.data

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

    // 4. Verify target task exists
    const task = await prisma.task.findUnique({
      where: { id_tasks }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tugas tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Prevent self-application
    if (task.id_requester === dbUser.id_user) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak dapat melamar tugas Anda sendiri.' },
        { status: 400 }
      )
    }

    // 5. Check for duplicate applications
    const existingApplication = await prisma.taskApplicants.findFirst({
      where: {
        id_worker: dbUser.id_user,
        id_tasks: id_tasks
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: 'Anda sudah melamar tugas ini.' },
        { status: 409 }
      )
    }

    // 6. Resolve 'PENDING' status UUID
    const pendingStatus = await prisma.statusTaskApplicants.findUnique({
      where: { nama_status: 'PENDING' }
    })

    if (!pendingStatus) {
      return NextResponse.json(
        { success: false, message: 'Status PENDING tidak ditemukan di database.' },
        { status: 500 }
      )
    }

    // 7. Persist application to database
    const newApplication = await prisma.taskApplicants.create({
      data: {
        id_tasks: id_tasks,
        id_worker: dbUser.id_user,
        id_status_task_applicants: pendingStatus.id_status_task_applicants,
      },
      include: {
        status_applicant: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil melamar tugas.',
      data: newApplication
    }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/tasks/apply] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

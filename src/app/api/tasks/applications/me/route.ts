import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // 2. Retrieve user profile mapping
    const dbUser = await prisma.user.findUnique({
      where: { auth_id: authUser.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Profil pengguna tidak ditemukan.' },
        { status: 404 }
      )
    }

    // 3. Extract optional query parameters
    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')

    // 4. Construct Prisma query payload
    const whereClause: any = {
      id_worker: dbUser.id_user
    }

    if (statusFilter) {
      whereClause.status_applicant = {
        nama_status: statusFilter
      }
    }

    // 5. Execute query with necessary joins
    const applications = await prisma.taskApplicants.findMany({
      where: whereClause,
      include: {
        status_applicant: true,
        task: {
          include: {
            status_task: true,
            requester: {
              select: {
                nama_lengkap: true,
                rating_avg: true,
                total_completed: true,
              }
            }
          }
        }
      },
      orderBy: {
        applied_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: applications
    })

  } catch (error) {
    console.error('[GET /api/tasks/applications/me] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

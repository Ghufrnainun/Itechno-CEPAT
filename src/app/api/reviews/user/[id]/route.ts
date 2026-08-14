import { NextRequest, NextResponse } from 'next/server'
import { reviewService } from '@/services/review.service'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    let userId = rawId

    if (userId === 'me') {
      const supabase = await createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser?.email) {
        return NextResponse.json(
          { success: false, message: 'Tidak terautentikasi.' },
          { status: 401 }
        )
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: authUser.email },
        select: { id_user: true },
      })

      if (!dbUser) {
        return NextResponse.json(
          { success: true, data: [], pagination: { page: 1, limit, total: 0, total_pages: 0 } }
        )
      }

      userId = dbUser.id_user
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID wajib diisi.' },
        { status: 400 }
      )
    }

    const result = await reviewService.getUserReviews(userId, page, limit)

    return NextResponse.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[GET /api/reviews/user/[id]] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    )
  }
}

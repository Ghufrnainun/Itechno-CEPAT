import { NextRequest, NextResponse } from 'next/server'
import { reviewService } from '@/services/review.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

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

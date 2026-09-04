import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'

export async function GET() {
  try {
    const categories = await prisma.taskCategory.findMany({
      orderBy: {
        nama_kategori: 'asc'
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/categories] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin-only endpoint
    const adminAuth = await verifyAdminToken(request)
    if (!adminAuth.valid) return unauthorizedResponse()

    const body = await request.json()
    const { nama_kategori, icon } = body

    if (!nama_kategori || typeof nama_kategori !== 'string' || nama_kategori.trim().length < 2 || nama_kategori.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Nama kategori wajib diisi (2-100 karakter).' },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existing = await prisma.taskCategory.findUnique({
      where: { nama_kategori }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Kategori dengan nama tersebut sudah ada.' },
        { status: 400 }
      )
    }

    const newCategory = await prisma.taskCategory.create({
      data: {
        nama_kategori,
        icon: icon || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil ditambahkan.',
      data: newCategory
    })

  } catch (error) {
    console.error('[POST /api/categories] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

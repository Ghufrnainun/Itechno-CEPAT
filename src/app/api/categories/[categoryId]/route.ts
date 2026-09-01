import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Admin-only endpoint
    const adminAuth = await verifyAdminToken(request)
    if (!adminAuth.valid) return unauthorizedResponse()

    const { categoryId } = await params;
    const body = await request.json()
    const { nama_kategori, icon } = body

    if (!nama_kategori || typeof nama_kategori !== 'string' || nama_kategori.trim().length < 2 || nama_kategori.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Nama kategori wajib diisi (2-100 karakter).' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existing = await prisma.taskCategory.findUnique({
      where: { id_category: categoryId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Kategori tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Check if another category has the same name
    const existingName = await prisma.taskCategory.findUnique({
      where: { nama_kategori }
    })

    if (existingName && existingName.id_category !== categoryId) {
      return NextResponse.json(
        { success: false, message: 'Kategori dengan nama tersebut sudah ada.' },
        { status: 400 }
      )
    }

    const updatedCategory = await prisma.taskCategory.update({
      where: { id_category: categoryId },
      data: {
        nama_kategori,
        icon: icon || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: updatedCategory
    })

  } catch (error) {
    const { categoryId } = await params;
    console.error(`[PUT /api/categories/${categoryId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Admin-only endpoint
    const adminAuth = await verifyAdminToken(request)
    if (!adminAuth.valid) return unauthorizedResponse()

    const { categoryId } = await params;

    // Check if category exists
    const existing = await prisma.taskCategory.findUnique({
      where: { id_category: categoryId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Kategori tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Check if category is used by any task
    const usedByTasks = await prisma.task.findFirst({
      where: { id_category: categoryId }
    })

    if (usedByTasks) {
      return NextResponse.json(
        { success: false, message: 'Kategori tidak dapat dihapus karena masih digunakan oleh task.' },
        { status: 400 }
      )
    }

    await prisma.taskCategory.delete({
      where: { id_category: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dihapus.'
    })

  } catch (error) {
    const { categoryId } = await params;
    console.error(`[DELETE /api/categories/${categoryId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

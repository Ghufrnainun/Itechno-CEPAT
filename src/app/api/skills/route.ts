import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'

export async function GET() {
  try {
    const skills = await prisma.skillsMaster.findMany({
      orderBy: {
        nama_skill: 'asc'
      },
      include: {
        _count: {
          select: { skills_user: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: skills
    })
  } catch (error) {
    console.error('[GET /api/skills] Error:', error)
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
    const { nama_skill, icon } = body

    if (!nama_skill || typeof nama_skill !== 'string' || nama_skill.trim().length < 2 || nama_skill.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Nama skill wajib diisi (2-100 karakter).' },
        { status: 400 }
      )
    }

    // Check if skill already exists
    const existing = await prisma.skillsMaster.findUnique({
      where: { nama_skill }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Skill dengan nama tersebut sudah ada.' },
        { status: 400 }
      )
    }

    const newSkill = await prisma.skillsMaster.create({
      data: {
        nama_skill,
        icon
      } as any
    })

    return NextResponse.json({
      success: true,
      message: 'Skill berhasil ditambahkan.',
      data: newSkill
    })

  } catch (error) {
    console.error('[POST /api/skills] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    // Admin-only endpoint
    const adminAuth = await verifyAdminToken(request)
    if (!adminAuth.valid) return unauthorizedResponse()

    const { skillId } = await params;
    const body = await request.json()
    const { nama_skill, icon } = body

    if (!nama_skill || typeof nama_skill !== 'string' || nama_skill.trim().length < 2 || nama_skill.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Nama skill wajib diisi (2-100 karakter).' },
        { status: 400 }
      )
    }

    // Check if skill exists
    const existing = await prisma.skillsMaster.findUnique({
      where: { id_skill_master: skillId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Skill tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Check if another skill has the same name
    const existingName = await prisma.skillsMaster.findUnique({
      where: { nama_skill }
    })

    if (existingName && existingName.id_skill_master !== skillId) {
      return NextResponse.json(
        { success: false, message: 'Skill dengan nama tersebut sudah ada.' },
        { status: 400 }
      )
    }

    const updatedSkill = await prisma.skillsMaster.update({
      where: { id_skill_master: skillId },
      data: {
        nama_skill,
        icon: icon !== undefined ? icon : (existing as any).icon // Update icon if provided, else keep existing
      } as any
    })

    return NextResponse.json({
      success: true,
      message: 'Skill berhasil diperbarui.',
      data: updatedSkill
    })

  } catch (error) {
    const { skillId } = await params;
    console.error(`[PUT /api/skills/${skillId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    // Admin-only endpoint
    const adminAuth = await verifyAdminToken(request)
    if (!adminAuth.valid) return unauthorizedResponse()

    const { skillId } = await params;

    // Check if skill exists
    const existing = await prisma.skillsMaster.findUnique({
      where: { id_skill_master: skillId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Skill tidak ditemukan.' },
        { status: 404 }
      )
    }

    // Check if skill is used by any user or task requirements
    const usedByUser = await prisma.skillsUser.findFirst({
      where: { id_skills_master: skillId }
    })

    if (usedByUser) {
      return NextResponse.json(
        { success: false, message: 'Skill tidak dapat dihapus karena masih digunakan oleh user.' },
        { status: 400 }
      )
    }

    const usedByTask = await prisma.taskRequirements.findFirst({
      where: { id_skill_master: skillId }
    })

    if (usedByTask) {
      return NextResponse.json(
        { success: false, message: 'Skill tidak dapat dihapus karena masih digunakan dalam persyaratan task.' },
        { status: 400 }
      )
    }

    await prisma.skillsMaster.delete({
      where: { id_skill_master: skillId }
    })

    return NextResponse.json({
      success: true,
      message: 'Skill berhasil dihapus.'
    })

  } catch (error) {
    const { skillId } = await params;
    console.error(`[DELETE /api/skills/${skillId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

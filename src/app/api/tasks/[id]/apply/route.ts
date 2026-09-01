import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { applyTaskSchema } from '@/lib/validations/task.schema'
import { taskService } from '@/services/task.service'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { z } from 'zod'

// POST /api/tasks/[id]/apply — worker melamar task
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(clientIP, 'tasks:apply', { maxRequests: 20, windowSeconds: 60 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: 'Terlalu banyak request.' }, { status: 429 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Validasi body
    const body = await request.json().catch(() => ({}))
    const parsed = applyTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    const { id } = await params
    const applicant = await taskService.applyToTask(id, currentUser.id_user, parsed.data.pesan, parsed.data.bid_amount)

    return NextResponse.json(
      { success: true, message: 'Lamaran berhasil dikirim.', data: applicant },
      { status: 201 }
    )
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[POST /api/tasks/[id]/apply] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 })
  }
}

// DELETE /api/tasks/[id]/apply — worker membatalkan lamaran
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    const { id } = await params
    await taskService.cancelApplication(id, currentUser.id_user)

    return NextResponse.json({ success: true, message: 'Lamaran berhasil dibatalkan.' })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[DELETE /api/tasks/[id]/apply] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 })
  }
}

// PATCH /api/tasks/[id]/apply — worker mengubah penawaran (bid) yang masih pending
const updateBidSchema = z.object({
  bid_amount: z.number().positive('Harga penawaran harus lebih dari 0.'),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id_user: true },
    })
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Profil pengguna tidak ditemukan.' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = updateBidSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Data tidak valid.' },
        { status: 400 }
      )
    }

    const { id } = await params
    const result = await taskService.updateBid(id, currentUser.id_user, parsed.data.bid_amount)

    return NextResponse.json({ success: true, message: 'Penawaran berhasil diperbarui.', data: result.data })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.'
    console.error('[PATCH /api/tasks/[id]/apply] Error:', error)
    return NextResponse.json({ success: false, message: errMessage }, { status: 400 })
  }
}

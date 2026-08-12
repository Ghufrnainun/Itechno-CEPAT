import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats/trends
// Returns task creation vs completion trends for last 7 days
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    // Cari status "completed" (case-insensitive)
    const completedStatus = await prisma.statusTask.findFirst({
      where: { nama_status: { equals: 'completed', mode: 'insensitive' } },
    })

    // Buat range 7 hari terakhir
    const days: { date: string; start: Date; end: Date }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
      const label = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })
      days.push({ date: label, start, end })
    }

    // Query semua tasks dalam 7 hari terakhir
    const sevenDaysAgo = days[0].start
    const now = days[days.length - 1].end

    const tasks = await prisma.task.findMany({
      where: {
        created_at: { gte: sevenDaysAgo, lte: now },
      },
      select: {
        created_at: true,
        id_status_task: true,
        completed_at: true,
      },
    })

    // Proses data per hari
    const trends = days.map(({ date, start, end }) => {
      const created = tasks.filter(
        (t) => t.created_at >= start && t.created_at <= end
      ).length

      const completed = tasks.filter(
        (t) =>
          t.id_status_task === completedStatus?.id_status_task &&
          t.completed_at &&
          t.completed_at >= start &&
          t.completed_at <= end
      ).length

      return { date, total: created, completed }
    })

    return NextResponse.json({ success: true, data: trends })
  } catch (error) {
    console.error('[GET /api/admin/stats/trends] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

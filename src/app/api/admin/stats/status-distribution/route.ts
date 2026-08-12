import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// Warna konsisten dengan design system admin panel
const STATUS_COLORS: Record<string, string> = {
  open: '#0f766e',
  accepted: '#1F6C9F',
  assigned: '#1F6C9F',
  in_progress: '#956400',
  submitted: '#956400',
  completed: '#346538',
  cancelled: '#9F2F2D',
}

// GET /api/admin/stats/status-distribution
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    // Group tasks by status
    const statusTasks = await prisma.statusTask.findMany({
      select: {
        nama_status: true,
        _count: { select: { tasks: true } },
      },
    })

    const distribution = statusTasks
      .filter((s) => s._count.tasks > 0)
      .map((s) => {
        const lowerKey = s.nama_status.toLowerCase()
        return {
          name: formatStatusLabel(lowerKey),
          value: s._count.tasks,
          color: STATUS_COLORS[lowerKey] ?? '#64748B',
        }
      })

    return NextResponse.json({ success: true, data: distribution })
  } catch (error) {
    console.error('[GET /api/admin/stats/status-distribution] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'Open',
    accepted: 'Accepted',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status.toLowerCase()] ?? status
}

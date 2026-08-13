import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    // Ambil semua status task untuk query
    const statusTasks = await prisma.statusTask.findMany({
      select: { id_status_task: true, nama_status: true },
    })

    const statusMap = Object.fromEntries(
      statusTasks.map((s) => [s.nama_status.toLowerCase(), s.id_status_task])
    )

    const activeStatuses = ['open', 'accepted', 'assigned', 'in_progress']
      .map((s) => statusMap[s])
      .filter(Boolean)

    const completedStatusId = statusMap['completed']

    // Parallel queries untuk performa
    const [
      totalUsers,
      totalTasks,
      activeTasks,
      completedTasks,
      balanceAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      activeStatuses.length > 0
        ? prisma.task.count({
            where: { id_status_task: { in: activeStatuses } },
          })
        : Promise.resolve(0),
      completedStatusId
        ? prisma.task.count({
            where: { id_status_task: completedStatusId },
          })
        : Promise.resolve(0),
      prisma.user.aggregate({
        _sum: { total_balance: true },
      }),
    ])

    const totalRevenue = balanceAgg._sum.total_balance ?? 0
    const completionRate =
      totalTasks > 0
        ? ((completedTasks / totalTasks) * 100).toFixed(1) + '%'
        : '0%'

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        activeTasks,
        totalRevenue,
        completionRate,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/stats] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

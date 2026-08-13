import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/reports/[reportId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { reportId } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid (pending, reviewed, resolved, rejected).' },
        { status: 400 }
      )
    }

    const existingReport = await prisma.userReport.findUnique({
      where: { id_report: reportId },
    })

    if (!existingReport) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan.' },
        { status: 404 }
      )
    }

    const updatedReport = await prisma.userReport.update({
      where: { id_report: reportId },
      data: { status },
    })

    // Kirim notifikasi balasan ke user pelapor
    let statusMsg = `Laporan Anda "${existingReport.subjek}" telah ditinjau oleh Admin.`
    if (status === 'resolved') {
      statusMsg = `Laporan Anda "${existingReport.subjek}" telah berhasil diselesaikan oleh Admin.`
    } else if (status === 'rejected') {
      statusMsg = `Laporan Anda "${existingReport.subjek}" telah ditutup oleh Admin.`
    }

    await prisma.notifications.create({
      data: {
        user_id: existingReport.user_id,
        type: 'system',
        title: 'Update Status Laporan Admin',
        message: statusMsg,
        data: {
          report_id: reportId,
          status,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Status laporan berhasil diperbarui menjadi ${status}.`,
      data: updatedReport,
    })
  } catch (error) {
    console.error('[PATCH /api/admin/reports/[reportId]] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

interface AdminMenuItem {
  title: string
  url: string
  description: string
  keywords: string[]
  icon: string
}

const ADMIN_MENUS: AdminMenuItem[] = [
  {
    title: 'Dashboard Overview',
    url: '/admin/dashboard',
    description: 'Ringkasan statistik & metrik platform ITechno',
    keywords: ['dashboard', 'overview', 'statistik', 'ringkasan', 'home', 'utama', 'laporan'],
    icon: 'LayoutDashboard',
  },
  {
    title: 'User Management',
    url: '/admin/users',
    description: 'Kelola akun pengguna, verifikasi, peran role, & sanksi suspend',
    keywords: ['user', 'users', 'pengguna', 'member', 'akun', 'worker', 'requester', 'suspend', 'ban', 'banned', 'role'],
    icon: 'Users',
  },
  {
    title: 'Task Management',
    url: '/admin/tasks',
    description: 'Kelola micro-tasks, pemantauan status, & penyelesaian',
    keywords: ['task', 'tasks', 'tugas', 'pekerjaan', 'micro-task', 'kompensasi', 'status'],
    icon: 'ClipboardList',
  },
  {
    title: 'Category & Skills Governance',
    url: '/admin/categories',
    description: 'Kelola kategori tugas & daftar skill master platform',
    keywords: ['kategori', 'category', 'categories', 'skill', 'skills', 'keahlian', 'governance', 'tag'],
    icon: 'Tag',
  },
  {
    title: 'Laporan User',
    url: '/admin/reports',
    description: 'Kelola laporan & aduan kendala dari pengguna platform',
    keywords: ['laporan', 'report', 'reports', 'aduan', 'masalah', 'kendala', 'bug', 'pelanggaran'],
    icon: 'Flag',
  },
]

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request)
    if (!auth.valid) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') ?? ''
    const q = rawQuery.trim().toLowerCase()

    if (!q) {
      return NextResponse.json({
        success: true,
        data: {
          menus: [],
          users: [],
          tasks: [],
          categories: [],
        },
      })
    }

    // 1. Search Menus
    const matchedMenus = ADMIN_MENUS.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.keywords.some((kw) => kw.toLowerCase().includes(q))
    )

    // 2. Search DB (Users, Tasks, Categories) in parallel
    const [users, tasks, categories] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { nama_lengkap: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        orderBy: { nama_lengkap: 'asc' },
        select: {
          id_user: true,
          nama_lengkap: true,
          email: true,
          username: true,
          avatar_url: true,
          role: { select: { nama_role: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { judul_tugas: { contains: q, mode: 'insensitive' } },
            { deskripsi_tugas: { contains: q, mode: 'insensitive' } },
            {
              requester: {
                OR: [
                  { nama_lengkap: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id_tasks: true,
          judul_tugas: true,
          kompensasi: true,
          status_task: { select: { nama_status: true } },
          kategori: { select: { nama_kategori: true, icon: true } },
          requester: { select: { id_user: true, nama_lengkap: true } },
        },
      }),
      prisma.taskCategory.findMany({
        where: {
          nama_kategori: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        orderBy: { nama_kategori: 'asc' },
        select: {
          id_category: true,
          nama_kategori: true,
          icon: true,
          _count: { select: { tasks: true } },
        },
      }),
    ])

    // Format output
    const formattedUsers = users.map((u) => ({
      id: u.id_user,
      nama_lengkap: u.nama_lengkap,
      email: u.email,
      username: u.username,
      avatar_url: u.avatar_url,
      role: u.role.nama_role,
    }))

    const formattedTasks = tasks.map((t) => ({
      id: t.id_tasks,
      judul_tugas: t.judul_tugas,
      kompensasi: t.kompensasi,
      status: t.status_task.nama_status.toLowerCase(),
      kategori: t.kategori.nama_kategori,
      kategori_icon: t.kategori.icon,
      requester_name: t.requester.nama_lengkap,
    }))

    const formattedCategories = categories.map((c) => ({
      id: c.id_category,
      nama_kategori: c.nama_kategori,
      icon: c.icon,
      total_tasks: c._count.tasks,
    }))

    return NextResponse.json({
      success: true,
      data: {
        menus: matchedMenus,
        users: formattedUsers,
        tasks: formattedTasks,
        categories: formattedCategories,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/search] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

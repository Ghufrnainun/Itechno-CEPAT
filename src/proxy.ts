import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- 1. Admin Guard Logic ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login') {
      const token = request.cookies.get('admin_token')?.value
      if (token) {
        try {
          const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
          const session = await prisma.adminSession.findUnique({
            where: { token: hashedToken },
          })
          if (session && new Date() < session.expires_at) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
          }
        } catch (_) {}
      }
      return NextResponse.next()
    }

    if (pathname.startsWith('/api/admin/auth')) {
      return NextResponse.next()
    }

    const token = request.cookies.get('admin_token')?.value
    if (!token) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, message: 'Akses ditolak. Silakan login sebagai admin.' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
      const session = await prisma.adminSession.findUnique({
        where: { token: hashedToken },
      })
      if (!session || new Date() > session.expires_at) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { success: false, message: 'Session admin telah berakhir.' },
            { status: 401 }
          )
        }
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.set('admin_token', '', { maxAge: 0, path: '/' })
        return response
      }
    } catch (error) {
      console.error('[Proxy] Admin session error:', error)
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { success: false, message: 'Terjadi kesalahan autentikasi server.' },
          { status: 500 }
        )
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  // --- 2. Main App Supabase Auth Logic ---
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPrefixes = [
    '/dashboard', '/feed', '/cari-tugas', '/chat', '/notifications',
    '/wallet', '/task', '/profile', '/tugas', '/history',
    '/leaderboard', '/schedule', '/disputes', '/saved'
  ]
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  let dbUserId: string | null = null

  // Query database hanya dieksekusi saat user mengakses rute yang terproteksi
  if (user && isProtectedRoute) {
    try {
      const orConditions: Array<{ auth_id: string } | { email: string }> = [{ auth_id: user.id }]
      if (user.email) {
        orConditions.push({ email: user.email })
      }

      const dbUser = await prisma.user.findFirst({
        where: { OR: orConditions },
        select: {
          id_user: true,
          is_banned: true,
          ban_type: true,
          ban_reason: true,
          banned_until: true,
          role: { select: { nama_role: true } },
        },
      })

      if (dbUser) {
        dbUserId = dbUser.id_user
      }

      // Admin role is strictly forbidden from accessing main worker dashboard
      if (dbUser?.role?.nama_role === 'Admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }

      if (dbUser?.is_banned) {
        const now = new Date()
        if (
          dbUser.ban_type === 'TEMPORARY' &&
          dbUser.banned_until &&
          now > dbUser.banned_until
        ) {
          // Auto unban expired temporary ban
          await prisma.user.update({
            where: { id_user: dbUser.id_user },
            data: {
              is_banned: false,
              ban_type: null,
              ban_reason: null,
              banned_at: null,
              banned_until: null,
            },
          })
        } else if (isProtectedRoute) {
          await supabase.auth.signOut()
          const type = dbUser.ban_type ?? 'PERMANENT'
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('banned', 'true')
          loginUrl.searchParams.set('type', type)
          loginUrl.searchParams.set('reason', dbUser.ban_reason || '')
          if (dbUser.banned_until) loginUrl.searchParams.set('until', dbUser.banned_until.toISOString())

          const redirectResponse = NextResponse.redirect(loginUrl)
          const setCookie = supabaseResponse.headers.get('set-cookie')
          if (setCookie) redirectResponse.headers.set('set-cookie', setCookie)
          return redirectResponse
        }
      }
    } catch (e) {
      console.error('[Proxy] Auth check error:', e)
    }
  }

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Forward user authentication identity to downstream Server Components & API routes
  const requestHeaders = new Headers(request.headers)
  // Keamanan: Hapus header identitas yang mungkin disuntikkan secara ilegal oleh client
  requestHeaders.delete('x-auth-user-id')
  requestHeaders.delete('x-auth-user-email')
  requestHeaders.delete('x-user-db-id')

  if (user) {
    requestHeaders.set('x-auth-user-id', user.id)
    if (user.email) requestHeaders.set('x-auth-user-email', user.email)
    if (dbUserId) requestHeaders.set('x-user-db-id', dbUserId)
  }

  const responseWithHeaders = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Transfer any cookies set during Supabase operations
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    responseWithHeaders.cookies.set(cookie.name, cookie.value, cookie)
  })

  return responseWithHeaders
}

export const middleware = proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- 1. Admin Guard Logic ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login') {
      const token = request.cookies.get('admin_token')?.value
      if (token) {
        try {
          const session = await prisma.adminSession.findUnique({
            where: { token },
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
      const session = await prisma.adminSession.findUnique({
        where: { token },
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

  const protectedPrefixes = ['/dashboard', '/feed', '/cari-tugas', '/chat', '/notifications', '/wallet', '/task', '/profile', '/tugas', '/history']
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (user) {
    try {
      const dbUser = await prisma.user.findFirst({
        where: { OR: [{ auth_id: user.id }, { email: user.email! }] },
        select: { id_user: true, is_banned: true, ban_type: true, ban_reason: true, banned_until: true },
      })

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
          const reason = encodeURIComponent(dbUser.ban_reason ?? 'Akun Anda ditangguhkan oleh admin.')
          const until = dbUser.banned_until ? encodeURIComponent(dbUser.banned_until.toISOString()) : ''
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('banned', 'true')
          loginUrl.searchParams.set('type', type)
          loginUrl.searchParams.set('reason', decodeURIComponent(reason))
          loginUrl.searchParams.set('until', until ? decodeURIComponent(until) : '')
          return NextResponse.redirect(loginUrl)
        }
      }
    } catch (e) {
      console.error('[Proxy] Ban check error:', e)
    }
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

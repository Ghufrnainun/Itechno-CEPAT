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

  const protectedPrefixes = ['/dashboard', '/feed', '/cari-tugas', '/chat', '/notifications', '/wallet', '/task', '/profile']
  const isProtectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

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

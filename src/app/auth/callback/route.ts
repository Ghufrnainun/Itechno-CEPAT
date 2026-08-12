import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const errorCode = searchParams.get('error_code')
  const errorDesc = searchParams.get('error_description')

  // Tangkap jika user yang mencoba OAuth sedang di-ban
  if (errorCode === 'user_banned' || errorDesc?.toLowerCase().includes('banned')) {
    const bannedUser = await prisma.user.findFirst({
      where: { is_banned: true },
      orderBy: { banned_at: 'desc' },
      select: {
        ban_type: true,
        ban_reason: true,
        banned_until: true,
      },
    })

    const type = bannedUser?.ban_type ?? 'PERMANENT'
    const reason = encodeURIComponent(bannedUser?.ban_reason ?? 'Akun Anda ditangguhkan oleh admin.')
    const until = bannedUser?.banned_until ? encodeURIComponent(bannedUser.banned_until.toISOString()) : ''

    return NextResponse.redirect(
      `${origin}/login?banned=true&type=${type}&reason=${reason}&until=${until}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser && authUser.email) {
        // Cek apakah user sudah ada di database Prisma
        let dbUser = await prisma.user.findUnique({
          where: { email: authUser.email },
          select: {
            id_user: true,
            email: true,
            username: true,
            nama_lengkap: true,
            avatar_url: true,
            pendidikan_terakhir: true,
            no_telpon: true,
            bio: true,
            id_role: true,
            is_banned: true,
            ban_type: true,
            ban_reason: true,
            banned_until: true,
          },
        })

        // Jika user ter-ban di database Prisma
        if (dbUser?.is_banned) {
          const now = new Date()
          if (
            dbUser.ban_type === 'TEMPORARY' &&
            dbUser.banned_until &&
            now > dbUser.banned_until
          ) {
            // Auto unban
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
          } else {
            // Logout Supabase session yang baru dibuat
            await supabase.auth.signOut()

            const type = dbUser.ban_type ?? 'PERMANENT'
            const reason = encodeURIComponent(dbUser.ban_reason ?? 'Akun Anda ditangguhkan oleh admin.')
            const until = dbUser.banned_until ? encodeURIComponent(dbUser.banned_until.toISOString()) : ''

            return NextResponse.redirect(
              `${origin}/login?banned=true&type=${type}&reason=${reason}&until=${until}`
            )
          }
        }

        let isNewUser = false

        if (!dbUser) {
          isNewUser = true
          // Dapatkan role default 'Worker' (atau ciptakan jika belum ada)
          let workerRole = await prisma.role.findUnique({
            where: { nama_role: 'Worker' },
          })
          if (!workerRole) {
            workerRole = await prisma.role.create({
              data: { nama_role: 'Worker' },
            })
          }

          // Buat username unik berdasarkan email
          const baseUsername = authUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
          const randomSuffix = Math.floor(1000 + Math.random() * 9000)
          const username = `${baseUsername}_${randomSuffix}`

          const fullName =
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            baseUsername

          const avatarUrl =
            authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture ||
            null

          dbUser = await prisma.user.create({
            data: {
              email: authUser.email,
              auth_id: authUser.id,
              username: username,
              nama_lengkap: fullName,
              avatar_url: avatarUrl,
              id_role: workerRole.id_role,
            },
            select: {
              id_user: true,
              email: true,
              username: true,
              nama_lengkap: true,
              avatar_url: true,
              pendidikan_terakhir: true,
              no_telpon: true,
              bio: true,
              id_role: true,
              is_banned: true,
              ban_type: true,
              ban_reason: true,
              banned_until: true,
            },
          })
        }

        // Jika user baru / data profil belum lengkap (univ / no_telpon / bio belum diisi), arahkan ke onboarding
        const isProfileIncomplete = !dbUser.pendidikan_terakhir || !dbUser.no_telpon || !dbUser.bio

        if (isNewUser || isProfileIncomplete) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        const redirectPath = next ?? '/feed'
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuth%20authentication%20failed`)
}

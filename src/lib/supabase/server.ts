import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
            // Bisa diabaikan jika ada middleware yang me-refresh session.
          }
        },
      },
    }
  )
}

export const createMockClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: "mock-user-id", email: "budi@cepat.com" } }, error: null }),
    },
    from: (table: string) => {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: {}, error: null }),
          }),
        }),
      };
    },
  };
};

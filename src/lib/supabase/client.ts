'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: "mock-user-id", email: "budi@cepat.com" } }, error: null }),
    signOut: async () => ({ error: null }),
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

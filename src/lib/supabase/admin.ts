import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client — menggunakan SERVICE_ROLE_KEY.
 * HANYA boleh dipakai di server-side (API routes).
 * Jangan pernah expose ke client-side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[Admin Client] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak terdefinisi.'
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

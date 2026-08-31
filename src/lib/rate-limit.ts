// ============================================================
// Simple in-memory rate limiter untuk API endpoints
// Cocok untuk single-instance Next.js (dev dan deployment kecil)
// Untuk production multi-instance, ganti ke Redis-based limiter
// ============================================================

interface RateLimitEntry {
  count: number
  resetAt: number  // timestamp (ms)
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup expired entries setiap 60 detik
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

interface RateLimitOptions {
  /** Jumlah request maksimal dalam window */
  maxRequests: number
  /** Durasi window dalam detik */
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  /** Sisa request yang diizinkan */
  remaining: number
  /** Kapan limit akan reset (timestamp) */
  resetAt: number
}

/**
 * Cek rate limit berdasarkan identifier (biasanya IP address)
 * @param identifier - IP address atau user ID
 * @param action - Nama action (misal: "auth:register", "auth:login")
 * @param options - Konfigurasi limit
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions
): RateLimitResult {
  const isTest = process.env.NODE_ENV === 'test'
  if (isTest) {
    return { allowed: true, remaining: options.maxRequests, resetAt: Date.now() + options.windowSeconds * 1000 }
  }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Jika belum ada entry atau sudah expired, buat baru
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowSeconds * 1000,
    })
    return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowSeconds * 1000 }
  }

  // Jika masih dalam window, increment count
  entry.count++
  rateLimitStore.set(key, entry)

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Helper: Ambil IP address dari request
 */
export function getClientIP(headers: Headers): string {
  // Vercel / reverse proxy
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

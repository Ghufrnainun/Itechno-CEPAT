// ============================================================
// Zod validation schemas untuk auth endpoints
// ============================================================
import { z } from 'zod'

// Daftar domain email temporer/disposable yang diblokir
const BLOCKED_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.de', 'grr.la', 'guerrillamailblock.com', 'pokemail.net',
  'sharklasers.com', 'spam4.me', 'throwaway.email', 'yopmail.com', 'yopmail.fr',
  'yopmail.net', 'mailinator.com', 'dispostable.com', 'maildrop.cc',
  'tempail.com', 'fakeinbox.com', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'trashmail.org', 'trashymail.com', 'trashymail.net',
  'getnada.com', 'getairmail.com', 'mailnesia.com', 'tempr.email',
  'discard.email', 'discardmail.com', 'discardmail.de',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '10minute-mail.com', '10minemail.com', 'minutemail.com',
  'mohmal.com', 'emailondeck.com', 'temp-mail.org', 'temp-mail.io',
  'tmpmail.org', 'tmpmail.net', 'mailtemp.net', 'tempmailo.com',
  'emailfake.com', 'crazymailing.com', 'mytemp.email', 'inboxbear.com',
  'guerrillamail.biz', 'mintemail.com', 'throwam.com', 'jetable.org',
  'harakirimail.com', 'mailcatch.com', 'mailnull.com', 'mailzilla.com',
  'rcpt.at', 'spamcowboy.com', 'spamevader.com', 'spamfree24.org',
  'tempinbox.com', 'thankyou2010.com', 'wegwerfmail.de', 'wegwerfmail.net',
  'mailsac.com', 'burnermail.io', 'tmail.com', 'byom.de',
])

// ============================================================
// Custom Zod refinements
// ============================================================

/** Cek apakah email menggunakan domain temp/disposable */
function isNotTempEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return !BLOCKED_EMAIL_DOMAINS.has(domain)
}

/** Blokir tag HTML (anti-XSS) */
function hasNoHtmlTags(value: string): boolean {
  return !/<[^>]*>/.test(value)
}

// ============================================================
// Reusable field schemas
// ============================================================

const emailField = z
  .string()
  .min(1, 'Email wajib diisi.')
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(254, 'Email terlalu panjang.')
  .refine(isNotTempEmail, 'Email temporer/disposable tidak diizinkan. Gunakan email asli.')

const passwordField = z
  .string()
  .min(6, 'Password minimal 6 karakter.')
  .max(72, 'Password maksimal 72 karakter.')

const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username minimal 3 karakter.')
  .max(30, 'Username maksimal 30 karakter.')
  .regex(/^[a-zA-Z0-9._]+$/, 'Username hanya boleh huruf, angka, titik, dan underscore.')
  .refine((val) => !/^[._]|[._]$/.test(val), 'Username tidak boleh diawali/diakhiri titik atau underscore.')
  .refine((val) => !/[_.]{2,}/.test(val), 'Username tidak boleh memiliki titik/underscore berurutan.')

const namaLengkapField = z
  .string()
  .trim()
  .min(2, 'Nama lengkap minimal 2 karakter.')
  .max(100, 'Nama lengkap maksimal 100 karakter.')
  .refine(hasNoHtmlTags, 'Nama lengkap tidak boleh mengandung tag HTML.')

// ============================================================
// Schemas per endpoint
// ============================================================

/** Schema untuk POST /api/auth/register */
export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  nama_lengkap: namaLengkapField,
  username: usernameField,
  id_role: z.string().uuid('Format role ID tidak valid.').optional(),
})

/** Schema untuk POST /api/auth/login */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi.').trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

// ============================================================
// Tipe TypeScript yang otomatis di-generate dari schema
// ============================================================
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ============================================================
// Helper: Format Zod errors jadi satu pesan yang rapi
// ============================================================
export function formatZodErrors(error: z.ZodError): string {
  const issues = error.issues || []
  return issues.map((e) => e.message).join(' ')
}

# Panduan Deployment & DevOps — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Arsitektur Hosting

### Vercel (Frontend, Route Handlers & Cron Jobs)
- **Platform**: Vercel (Sesuai panduan resmi ITechno Cup 2026).
- **Framework Preset**: Next.js 16 (App Router auto-detected).
- **Domain**: `cepat.vercel.app` atau URL deployment pratinjau otomatis per pull request.
- **Node.js Runtime**: Versi 20.x atau 22.x LTS.
- **Automated Cron Jobs**: Dikonfigurasi untuk mengeksekusi `/api/cron/schedule-reminder` secara berkala guna memicu pengingat penugasan.

### Supabase (Database PostgreSQL + PostGIS + Storage + Realtime)
- **Region**: Southeast Asia (Singapore / `ap-southeast-1`) untuk latensi koneksi minimal.
- **PostGIS Extension**: Wajib diaktifkan di SQL editor Supabase (`CREATE EXTENSION IF NOT EXISTS postgis;`).
- **Connection Pooling**: Menggunakan PgBouncer port 6543 (`DATABASE_URL`) untuk serverless handler dan direct port 5432 (`DIRECT_URL`) untuk Prisma migrations.

---

## 2. Pengaturan Lingkungan Lokal (Local Development)

```bash
# 1. Clone repositori
git clone https://github.com/Ghufrnainun/Itechno.git
cd Itechno

# 2. Pasang dependensi
npm install

# 3. Siapkan variabel lingkungan
cp .env.example .env.local
# Lengkapi kredensial Supabase, Firebase, dan Midtrans Sandbox

# 4. Generate Prisma Client & Dorong Skema ke DB
npx prisma generate
npx prisma db push

# 5. Jalankan Seeding Data Realistis
npm run db:seed

# 6. Jalankan server lokal
npm run dev
# Kunjungi http://localhost:3000
```

---

## 3. Konfigurasi Variabel Lingkungan (Environment Variables)

Pastikan variabel-variabel berikut telah dikonfigurasi di Vercel Project Settings:

```env
# Database
DATABASE_URL="postgresql://postgres.[ref]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase BaaS
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[ref].firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[ref]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@[ref].iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false

# App Settings & Cron Security
NEXT_PUBLIC_BASE_URL=https://cepat-steel.vercel.app
NEXT_PUBLIC_DEFAULT_RADIUS=2000
CRON_SECRET=super-secret-cron-key-123
SEED_AUTH_PASSWORD="DemoCepat2026!#"
```

---

## 4. Konfigurasi Vercel (`vercel.json`)

Untuk menjadwalkan eksekusi otomatis pada Vercel Serverless:

```json
{
  "crons": [
    {
      "path": "/api/cron/schedule-reminder",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/notifications",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 5. Scripts Resmi `package.json`

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server Next.js lokal pada port 3000. |
| `npm run build` | Melakukan kompilasi produksi Next.js. |
| `npm run start` | Menjalankan build produksi secara lokal. |
| `npm run lint` | Menjalankan pemeriksaan ESLint. |
| `npm run db:seed` | Mengisi database dengan seed data realistis untuk pengujian & demo (`prisma/seed.mjs`). |
| `npm run postinstall`| Menjalankan `prisma generate` otomatis setelah pemasangan package. |

---

## 6. Pre-Submission Checklist (ITechno Cup 2026)

- [x] Seluruh fitur utama (Fixed/Bidding, PostGIS radius, Chat, Scheduling, Leaderboard, Dispute) berfungsi tanpa kendala di URL production.
- [x] Halaman `/admin/login` dan dashboard admin berfungsi optimal dengan akun moderator terproteksi.
- [x] Web App Manifest terdeteksi valid (`src/app/manifest.ts`) dan mendukung mode standalone PWA.
- [x] Geolocation API beroperasi dengan protokol HTTPS production.
- [x] Dokumentasi README.md lengkap dan mematuhi etika penggunaan AI sesuai regulasi lomba.

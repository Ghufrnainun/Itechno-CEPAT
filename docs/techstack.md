# Tech Stack & Dependencies — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Core Dependencies

### Framework & Runtime

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `next`              | `16.2.12`    | Framework utama — SSR, App Router, Route Handlers, Server Actions, Middleware    |
| `react`             | `19.2.4`     | UI library (React 19 dengan compiler & action hooks mutakhir)                   |
| `react-dom`         | `19.2.4`     | React DOM rendering engine                                                       |
| `typescript`        | `^5`         | Type safety end-to-end                                                           |

### Styling & Animasi

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `tailwindcss`       | `^4`         | Utility-first CSS framework v4 (engine CSS modern berbasis OKLCH & cascade layers)|
| `@tailwindcss/postcss` | `^4`      | PostCSS plugin untuk integrasi Tailwind v4                                      |
| `clsx`              | `^2.1.1`     | Utility kondisional class names                                                  |
| `tailwind-merge`    | `^3.6.0`     | Utility resolusi konflik class Tailwind                                          |
| `motion`            | `^12.43.0`   | Framer Motion 12 untuk animasi interaktif, page transitions, dan gesture        |
| `gsap`              | `^3.15.0`    | GreenSock Animation Platform untuk animasi timeline kompleks                     |
| `@gsap/react`       | `^2.1.2`     | React hook wrapper untuk GSAP (`useGSAP`)                                        |

### PWA & Offline Support

| Fitur / Konfigurasi | Mekanisme                                                                        |
| ------------------- | -------------------------------------------------------------------------------- |
| Web App Manifest    | Native Next.js App Router Metadata Route (`src/app/manifest.ts`)                 |
| Mode Tampilan       | `standalone`, tema `#005c55`, background `#e8fff0`                               |
| Icons               | Multi-resolution maskable icons (192x192, 512x512) di `/public/icons/`             |

### Database, ORM & Auth Layer

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `prisma` / `@prisma/client` | `^7.9.1` | Single source of truth untuk skema data `public`, relasi, dan manipulasi atomik  |
| `@prisma/adapter-pg`| `^7.9.1`     | Driver adapter Prisma untuk koneksi langsung ke PostgreSQL Supabase              |
| `pg`                | `^8.22.0`    | PostgreSQL client driver native untuk Node.js                                    |
| `@supabase/supabase-js` | `^2.111.0` | SDK Supabase untuk koneksi Storage dan Realtime Channels                         |
| `@supabase/ssr`     | `^0.12.4`    | Klien SSR Supabase terisolasi untuk Server Components, API routes, dan Middleware|

### Map & Geolocation

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `leaflet`           | `^1.9.4`     | Library visualisasi peta interaktif open-source                                  |
| `react-leaflet`     | `^5.0.0`     | React 19 wrapper untuk komponen Leaflet                                          |
| `@types/leaflet`    | `^1.9.21`    | TypeScript types untuk Leaflet                                                   |
| `@types/geojson`    | `^7946.0.16` | TypeScript types untuk format GeoJSON dan spasial PostGIS                        |

### Push Notification & Realtime

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `firebase`          | `^12.16.0`   | Client SDK untuk registrasi FCM Token & penerimaan push notif web                |
| `firebase-admin`    | `^14.2.0`    | Server SDK untuk pengiriman push notification FCM dari backend                   |
| Supabase Realtime   | built-in     | WebSocket channel live streaming untuk status task & obrolan chat                |

### Payment Gateway

| Package             | Versi Aktual | Peruntukan                                                                       |
| ------------------- | ------------ | -------------------------------------------------------------------------------- |
| `midtrans-client`   | `^1.4.3`     | Integrasi Midtrans Snap & Core API untuk top-up saldo dompet instan               |

### Data Visualization & UI Utilities

| Package                 | Versi Aktual | Peruntukan                                                                   |
| ----------------------- | ------------ | ---------------------------------------------------------------------------- |
| `recharts`              | `^3.10.1`    | Library diagram analitik admin (LineChart, PieChart, BarChart)               |
| `zod`                   | `^4.4.3`     | Schema validation engine terpadu untuk client forms dan route handlers       |
| `date-fns`              | `^4.4.0`     | Formatting, manipulasi, dan komparasi waktu/tanggal                          |
| `lucide-react`          | `^1.27.0`    | Set ikon modern untuk interface utama                                        |
| `@phosphor-icons/react` | `^2.1.10`    | Set ikon pelengkap berbobot fleksibel                                        |
| `sonner`                | `^2.0.8`     | Sistem toast notification interaktif yang elegan                             |
| `swr`                   | `^2.5.0`     | Data-fetching hook dengan revalidation otomatis                              |
| `emoji-picker-react`    | `^4.19.1`    | Komponen pemilih emoji untuk chat dan reaksi pesan                           |

---

## 2. Dev Dependencies

| Package                 | Versi Aktual | Peruntukan                               |
| ----------------------- | ------------ | ---------------------------------------- |
| `eslint`                | `^9`         | Flat-config linter terbaru               |
| `eslint-config-next`    | `16.2.12`    | Aturan linting bawaan Next.js 16         |
| `@types/node`           | `^20.19.43`  | Node.js types                            |
| `@types/react`          | `^19`        | React 19 types                           |
| `@types/react-dom`      | `^19`        | React DOM 19 types                       |

---

## 3. Environment Variables

Pastikan file `.env` (atau `.env.local`) memuat variabel lingkungan berikut:

```env
# Database (Prisma + Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth & Storage & Realtime
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Firebase Cloud Messaging (FCM)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[project-id].firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[project-id]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@[project-id].iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false

# App & Geolocation
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_RADIUS=2000
```

---

## 4. Alasan Pemilihan & Keunggulan Arsitektur

1. **Next.js 16 + React 19**: Memberikan performa rendering SSR/Streaming tercepat, dukungan Route Handlers modular, serta pengalihan halaman cepat tanpa layout shift.
2. **Prisma 7 + PostgreSQL PostGIS**: Memadukan keamanan relasional tingkat tinggi dengan efisiensi kalkulasi radius spasial (`ST_DWithin`) berbasis koordinat lintang/bujur murni.
3. **Tailwind CSS v4**: Mengusung arsitektur CSS paling modern dengan sistem palet warna bertingkat (OKLCH) yang mendukung kontras tinggi dan kenyamanan visual (anti-glare).
4. **Supabase Realtime + FCM**: Solusi hybrid komunikasi — Supabase Realtime menangani percakapan chat aktif dan pergantian status task in-app seketika, sedangkan FCM mengirim push notification ke OS pengguna saat tab/browser tidak aktif.
5. **Midtrans Snap**: Menyediakan alur pembayaran dompet instan berlisensi dengan dukungan QRIS, Virtual Account, dan e-Wallet dengan verifikasi signature SHA-512 yang aman.

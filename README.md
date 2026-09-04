<div align="center">
  
# CEPAT (Cari Entry Pekerjaan Area Terdekat)
### Hyperlocal Micro-Task & Freelancing Platform for Inclusive Digital Economy

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](https://cepat-steel.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Ghufrnainun/Itechno-CEPAT)

**Submission for ITECHNO CUP 2026 - Web Development**

**By Tembalang Sakti**

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Tim Developer](#-tim-developer)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Nama                     | Peran                               | GitHub                                   |
| ------------------------ | ----------------------------------- | ---------------------------------------- |
| **Ghufron Ainun Najib**  | Project Lead & Full Stack Developer | [GitHub](https://github.com/Ghufrnainun) |
| **Bagaskara**            | Full Stack Developer                | [GitHub](https://github.com/Pakas0)      |
| **Rajaba Hamim Maududi** | Full Stack Developer                | [GitHub](https://github.com/Hamim688)    |

---

## 🎯 Tentang Proyek

### Latar Belakang

Berdasarkan data BPS, tingkat pengangguran terbuka lulusan perguruan tinggi masih berkisar di angka 7,9%, sementara survei menunjukkan lebih dari 73% mahasiswa aktif memiliki keinginan kuat untuk memperoleh penghasilan tambahan mandiri namun terbentur oleh jadwal perkuliahan yang padat dan dinamis. Di sisi lain, ribuan pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) serta sesama civitas akademika di sekitar kawasan kampus sering kali membutuhkan bantuan pekerjaan mikro (_micro-tasks_) yang mendesak—seperti fotografi produk katalog, entri data administrasi, penjaga stan promosi, hingga bantuan teknis acara.

Platform _freelancing_ konvensional saat ini memiliki kurva adopsi yang tinggi, memungut komisi besar, berfokus pada proyek berdurasi panjang, dan tidak memfasilitasi kebutuhan pekerjaan berskala mikro yang menuntut kedekatan lokasi fisik secara instan.

### Solusi yang Ditawarkan

**CEPAT (Cari Entry Pekerjaan Area Terdekat)** hadir sebagai platform _hyperlocal micro-freelancing & skill exchange_ pertama yang mengintegrasikan radius geospasial presisi (default ≤ 2 km) dengan sistem keamanan finansial **Model C Escrow Balance**. CEPAT menghubungkan mahasiswa dengan UMKM lokal secara langsung untuk pekerjaan mikro yang tuntas dalam hitungan jam.

Platform ini memadukan model penawaran lelang tertutup (_Sealed Bidding_) dengan pengembalian selisih otomatis (_Auto-Refund Escrow_), penjadwalan terotomatisasi, sistem reputasi gamifikasi (XP, Level, Badges, Streaks), pusat mediasi sengketa (_Dispute Center_), dan komunikasi dua arah _In-App Realtime Chat_.

### Tujuan Proyek

- 🎯 **Tujuan Utama**: Memperluas akses peluang kerja inklusif dan memacu perputaran ekonomi lokal perkotaan yang selaras dengan **SDG 8 (Pekerjaan Layak dan Pertumbuhan Ekonomi)**.
- 📊 **Target Pengguna**: Mahasiswa aktif diploma/sarjana yang membutuhkan fleksibilitas waktu, serta pelaku UMKM lokal dan komunitas sekitar kampus.
- 💡 **Value Proposition**: Eksekusi pekerjaan mikro ultra-cepat berbasis radius GPS terdekat (≤ 2 km), proteksi pembayaran escrow tanpa risiko penipuan, akun tunggal fleksibel (_Unified Dual-Role_), dan mekanisme lelang hemat biaya bagi requester.

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur                                   | Deskripsi                                                                                                                     | Keunggulan                                                                                                           |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Peta Interaktif & Radius Spasial**    | Visualisasi tugas mikro pada peta Leaflet + OpenStreetMap dengan kalkulasi jarak PostGIS (`ST_DWithin` ≤ 2 km).               | Memastikan tugas terdekat secara geografis, akurat, dan dapat dijangkau tanpa biaya mobilitas tinggi.                |
| **Sealed Bidding & Auto-Refund Escrow** | Mode lelang tertutup di mana worker mengajukan harga penawaran kustom (`bid_amount`) di dalam batas rentang budget requester. | Saat penawaran disetujui di bawah plafon, **selisih dana langsung di-refund otomatis seketika** ke dompet requester. |
| **Unified Dual-Role Account**           | Satu akun terpadu dapat bertindak fleksibel sebagai Pemberi Tugas (Requester) maupun Pengerja Tugas (Worker).                 | Kemudahan berganti peran tanpa harus logout atau mendaftarkan dua akun terpisah.                                     |
| **In-App Realtime Chat**                | Komunikasi pesan instan dua arah antara Requester dan Worker per penugasan tugas.                                             | Didukung oleh Supabase Realtime Channels untuk koordinasi teknis yang responsif dan aman.                            |
| **Pusat Sengketa (Dispute Center)**     | Fasilitas pembukaan tiket sengketa resmi dengan unggah bukti foto/teks dan mediasi interaktif.                                | Admin dapat mengeksekusi putusan finansial (_favor worker_ atau _favor requester_) secara transparan dan adil.       |
| **Top-Up Saldo Midtrans Snap**          | Integrasi pembayaran instan berlisensi dengan dukungan QRIS, Virtual Account bank, dan GoPay.                                 | Verifikasi keamanan tanda tangan SHA-512 dengan mutasi saldo dompet seketika.                                        |

### Fitur Tambahan

- **Task Scheduling & Cron Reminder** — Penjadwalan tanggal penugasan di masa depan disertai pengingat otomatis H-24 jam dan H-1 jam via Vercel Cron (`/schedule`).
- **Gamifikasi, XP & Leaderboard** — Peringkat pekerja terbaik berdasarkan skor pembobotan berimbang, sistem kenaikan level, daily streaks, dan lencana pencapaian (`/leaderboard`).
- **Worker Portfolio Showcase** — Galeri portofolio publik terintegrasi Supabase Storage untuk memamerkan bukti karya nyata pekerja (`/profile/[id]`).
- **Bookmark Tugas Tersimpan** — Fitur simpan tugas favorit untuk ditinjau atau dilamar di kemudian waktu (`/saved`).
- **Admin Governance & Moderation** — Konsol pemantauan metrik KPI, moderasi konten tugas, tata kelola laporan aduan pengguna, dan penangguhan akun permanen/sementara dengan _auto-unban_.

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi Website](https://cepat-steel.vercel.app/)**

### Screenshot Aplikasi (6 Fitur Utama)

#### 1. Peta Interaktif & Radius Spasial (`/cari-tugas`)

<div align="center">
  <img src="public/docs/1-peta-radius.png" alt="Peta Interaktif & Radius Spasial" width="800"/>
  <p><em>Visualisasi penemuan tugas mikro berbasis koordinat GPS pengguna dengan filter radius geospasial PostGIS (ST_DWithin ≤ 2 km) dan peta interaktif Leaflet OpenStreetMap.</em></p> 
</div>

#### 2. Sealed Bidding & Auto-Refund Escrow (`/task/[id]`)

<div align="center">
  <img src="public/docs/2-bidding-escrow.png" alt="Sealed Bidding & Auto-Refund Escrow" width="800"/>
  <p><em>Formulir pengajuan penawaran lelang tertutup (sealed-bid) oleh worker dan panel evaluasi requester dengan auto-refund seketika pada selisih plafon dana escrow Model C saat tawaran diterima.</em></p>
</div>

#### 3. Unified Dual-Role Account & Dashboard (`/dashboard`)

<div align="center">
  <img src="public/docs/dashboard.png" alt="Unified Dual-Role Account & Dashboard" width="800"/>
  <p><em>Antarmuka dashboard terpadu yang memungkinkan satu akun beralih peran secara instan antara Pemberi Tugas (Requester) dan Pengerja (Worker) beserta ringkasan metrik aktivitas live.</em></p>
</div>

#### 4. In-App Realtime Chat & Koordinasi Tugas (`/chat`)

<div align="center">
  <img src="public/docs/4-realtime-chat.png" alt="In-App Realtime Chat" width="800"/>
  <p><em>Ruang percakapan langsung dua arah antara requester dan worker yang ditenagai Supabase Realtime Channels untuk koordinasi teknis, pengiriman media, dan pelacakan status tugas.</em></p>
</div>

#### 5. Pusat Mediasi Sengketa / Dispute Center (`/disputes`)

<div align="center">
  <img src="public/docs/5-dispute-center.png" alt="Dispute & Resolution Center" width="800"/>
  <p><em>Fasilitas pengajuan tiket sengketa resmi dengan pengunggahan dokumen bukti foto kerja, thread mediasi terisolasi, dan penetapan putusan resolusi finansial adil oleh admin.</em></p>
</div>

#### 6. Top-Up Saldo Dompet Digital Midtrans Snap (`/wallet`)

<div align="center">
  <img src="public/docs/6-midtrans-wallet.png" alt="Top-Up Saldo Midtrans Snap" width="800"/>
  <p><em>Panel dompet digital dengan pemisahan saldo aktif dan saldo escrow ditahan, terintegrasi pop-up Midtrans Snap untuk pengisian saldo instan via QRIS, Virtual Account, dan e-Wallet.</em></p>
</div>

---

## 🛠 Teknologi

### Tech Stack

#### Frontend

```
Framework    : Next.js 16.2.12 (App Router, Server Actions, Middleware Proxy)
UI Library   : React 19.2.4 & TypeScript 5
Styling      : Tailwind CSS 4 & PostCSS
Animasi      : Motion (Framer Motion 12) & GSAP / @gsap/react
Peta         : Leaflet.js 1.9 & React-Leaflet 5 (OpenStreetMap Tiles)
Ikon         : Lucide React & @phosphor-icons/react
Data Viz     : Recharts 3.10.1
PWA          : Native Next.js 16 Metadata Route (src/app/manifest.ts)
```

#### Backend & Database

```
Runtime      : Node.js 20.x / 22.x LTS
ORM Layer    : Prisma ORM 7.9.1 (@prisma/client + @prisma/adapter-pg)
Database     : PostgreSQL 15+ (Supabase Managed Instance)
Spasial      : PostGIS Extension (ST_DWithin, ST_Distance, Point WGS84)
Autentikasi  : Supabase Auth (@supabase/ssr) terpetakan ke tabel User
Realtime     : Supabase Realtime Channels (WebSocket Streaming)
Penyimpanan  : Supabase Storage Buckets (Media Portfolio & Dispute Evidences)
```

#### DevOps & Tools

```
Deployment   : Vercel Serverless Edge Network
Automation   : Vercel Cron Jobs (/api/cron/schedule-reminder)
Push Notif   : Firebase Cloud Messaging (FCM Web SDK v12 & Firebase Admin v14)
Payment      : Midtrans Snap & Core API (Sandbox / Production)
API Testing  : Bruno API Client (Koleksi lengkap di docs/api-cepat/)
Linting      : ESLint 9 (Flat Config) & Next.js ESLint Plugin
```

### Alasan Pemilihan Teknologi

| Teknologi                      | Alasan Pemilihan                                                                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 + React 19**      | Memberikan waktu muat tercepat melalui SSR/Streaming, arsitektur route handlers terpadu, dan kestabilan performa tanpa layout shift.                                          |
| **Prisma ORM 7 + PostgreSQL**  | Menjadi _single source of truth_ skema data relasional, menjamin integritas transaksi atomik mutasi escrow (`prisma.$transaction`), dan keamanan tipe data end-to-end.        |
| **PostGIS Spatial Extension**  | Standar industri untuk kalkulasi radius geografis lintang/bujur berkecepatan tinggi dengan pengindeksan spasial GIST.                                                         |
| **Leaflet.js + OpenStreetMap** | Solusi peta interaktif yang ringan, fleksibel, ramah privasi, dan sepenuhnya bebas dari biaya API pihak ketiga (bebas kuota berbayar).                                        |
| **Midtrans Snap**              | Gateway pembayaran resmi terpercaya di Indonesia yang memfasilitasi pengisian dompet instan via QRIS, Virtual Account, dan e-Wallet dengan verifikasi hash SHA-512 yang aman. |
| **Supabase Realtime + FCM**    | Kombinasi transmisi data live ideal: WebSocket latensi rendah untuk obrolan chat aktif, dan Web Push Notification untuk pemberitahuan saat pengguna tidak membuka peramban.   |

### Dependencies Utama

```json
{
  "dependencies": {
    "next": "16.2.12",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "typescript": "^5",
    "@prisma/client": "^7.9.1",
    "@prisma/adapter-pg": "^7.9.1",
    "@supabase/ssr": "^0.12.4",
    "@supabase/supabase-js": "^2.111.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^5.0.0",
    "midtrans-client": "^1.4.3",
    "firebase": "^12.16.0",
    "firebase-admin": "^14.2.0",
    "motion": "^12.43.0",
    "recharts": "^3.10.1",
    "zod": "^4.4.3",
    "tailwindcss": "^4"
  }
}
```

---

## 🏗 Arsitektur Sistem

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            KLIEN / BROWSER / PWA                            │
│    Next.js 16 (React 19) + Tailwind CSS 4 + Motion + Leaflet.js + PWA       │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │ HTTPS Requests              │ WebSocket Channel
                        ▼                             ▼
┌───────────────────────────────────────────┐  ┌──────────────────────────────┐
│       EDGE MIDDLEWARE (src/proxy.ts)      │  │      SUPABASE REALTIME       │
│  - Admin Session SHA-256 Auth Guard       │  │  - Live Task Status Sync     │
│  - Supabase Auth Session Refresh          │  │  - Direct In-App Chat        │
│  - User Banned Status & Auto-Unban Check  │  └──────────────────────────────┘
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER & SERVICES                         │
│  - Route Groups: (auth), (main), (admin), api/* (22 Kelompok Endpoints)     │
│  - Service Layer: task.service, wallet.service, gamification, dispute       │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │ Database Queries            │ External Integrations
                        ▼                             ▼
┌───────────────────────────────────────────┐  ┌──────────────────────────────┐
│       SUPABASE (POSTGRESQL + POSTGIS)     │  │      LAYANAN EKSTERNAL       │
│  - Prisma ORM 7 Schema (24 Model Tabel)   │  │  - Midtrans Snap Gateway     │
│  - PostGIS ST_DWithin Radius Geospasial   │  │  - Firebase Admin FCM Push   │
│  - Supabase Auth & Storage Buckets        │  │  - Vercel Automated Cron    │
└───────────────────────────────────────────┘  └──────────────────────────────┘
```

### Database Schema

Skema database mengelola 24 model tabel utama yang dirancang secara relasional dan aman:

- **Entitas Inti**: `User`, `Role`, `Task`, `StatusTask`, `TaskCategory`, `SkillsMaster`, `SkillsUser`, `TaskRequirements`.
- **Pelamar & Bidding**: `TaskApplicants`, `StatusTaskApplicants`.
- **Finansial & Dompet**: `Transactions`, `PaymentTransaction` (Midtrans).
- **Komunikasi & Ulasan**: `ChatRoom`, `Message`, `Reviews`.
- **Pusat Sengketa**: `Dispute`, `DisputeEvidence`, `DisputeMessage`.
- **Gamifikasi & Portofolio**: `Badge`, `UserBadge`, `UserStreak`, `XPLog`, `PortfolioItem`, `SavedTask`.
- **Tata Kelola Admin**: `AdminSession`, `UserReport`.

📖 _Diagram ERD dan rincian tipe data lengkap tersedia di [`docs/database.md`](docs/database.md)._

### Folder Structure

```
Itechno/
├── public/                     # Aset statis, ikon PWA, & firebase-messaging-sw.js
├── prisma/
│   ├── schema.prisma           # Single source of truth skema database (24 model)
│   ├── seed.mjs                # Skrip seeder data demo realistis
│   └── migrations/             # Riwayat migrasi skema Prisma
├── supabase/
│   └── migrations/             # Skrip SQL kebijakan RLS & inisialisasi PostGIS
├── docs/                       # Dokumentasi arsitektur, API, & panduan lengkap
│   ├── api-cepat/              # Koleksi pengujian otomatis Bruno API
│   └── *.md
├── src/
│   ├── proxy.ts                # Next.js Middleware (Admin & Supabase Auth Guards)
│   ├── app/
│   │   ├── (auth)/             # Halaman login, register, onboarding
│   │   ├── (main)/             # Aplikasi user: dashboard, cari-tugas, task, chat, dll
│   │   ├── (admin)/            # Konsol pengurus: dashboard, users, tasks, reports, disputes
│   │   ├── api/                # 22 Kelompok REST Route Handlers
│   │   ├── manifest.ts         # Native PWA Web App Manifest
│   │   └── globals.css         # Tailwind CSS v4 & theme variables
│   ├── components/             # Reusable UI primitives, admin components, & map
│   ├── features/               # Modul fitur khusus (auth, chat, task)
│   ├── hooks/                  # Custom React hooks (geolocation, debounce, dll)
│   ├── services/               # Heavy business logic & database transaction layer
│   ├── lib/                    # Library singletons (prisma, midtrans, supabase, validations)
│   └── types/                  # TypeScript interfaces & database mappings
```

---

## ⚙ Instalasi & Setup

### Prerequisites

Pastikan perangkat Anda telah terpasang:

- **Node.js** (v20.x atau v22.x LTS direkomendasikan)
- **npm** (v10.x atau lebih tinggi)
- **Git**
- **Proyek Supabase PostgreSQL** (dengan ekstensi `postgis` aktif)
- **Akun Midtrans Sandbox** (untuk simulasi top-up pembayaran)

### Langkah Instalasi

#### 1️⃣ Clone Repository

```bash
git clone https://github.com/Ghufrnainun/Itechno-CEPAT.git
cd Itechno-CEPAT
```

#### 2️⃣ Install Dependencies

```bash
npm install
```

#### 3️⃣ Setup Environment Variables

Salin file `.env.example` menjadi `.env.local` pada direktori root proyek:

```bash
cp .env.example .env.local
```

Isi konfigurasi variabel lingkungan:

```env
# Database (Prisma + Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth, Storage & Realtime
NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="[ref].firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="[ref]"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."
NEXT_PUBLIC_FIREBASE_VAPID_KEY="..."
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@[ref].iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
MIDTRANS_IS_PRODUCTION=false

# App Settings
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_RADIUS=2000
```

#### 4️⃣ Setup Database

```bash
# 1. Generate Prisma Client & sinkronkan skema ke database
npx prisma generate
npx prisma db push

# 2. Terapkan aturan Row Level Security (RLS)
npx prisma db execute --file=supabase/migrations/20260831_comprehensive_rls_policies.sql
npx prisma db execute --file=supabase/migrations/20260901_fix_comprehensive_rls.sql

# 3. Eksekusi data seed akun demo realistis
npm run db:seed
```

Semua akun demo telah terkonfigurasi dengan kata sandi default `DemoCepat2026!#` (dapat diubah melalui variabel `SEED_AUTH_PASSWORD`):

| Nama Akun     | Email Demo       | Peran Utama               |
| ------------- | ---------------- | ------------------------- |
| Budi Santoso  | `budi@cepat.com` | Requester (Pemberi Tugas) |
| Andi Pratama  | `andi@cepat.com` | Worker (Pengerja Tugas)   |
| Sari Lestari  | `sari@cepat.com` | Requester (Pemberi Tugas) |
| Rina Maharani | `rina@cepat.com` | Worker (Pengerja Tugas)   |

#### 5️⃣ Run Development Server

```bash
npm run dev
```

Buka peramban dan akses aplikasi di `http://localhost:3000`.

---

## 🚀 Penggunaan

### Menjalankan Aplikasi

```bash
# Mode pengembangan
npm run dev

# Kompilasi produksi
npm run build

# Menjalankan build produksi
npm run start

# Menjalankan linter kode
npm run lint

# Menjalankan seeding data demo
npm run db:seed
```

### User Guide

#### Untuk Pengguna Umum

1. **Registrasi & Onboarding**: Buat akun baru via email di `/register`, lengkapi data profil, nomor WhatsApp, institusi, dan keahlian di `/onboarding`.
2. **Eksplorasi & Melamar Tugas**:
   - Buka peta `/cari-tugas` untuk melihat pin tugas mikro aktif dalam radius 2 km.
   - Pilih tugas, baca deskripsi, dan klik **"Ajukan Lamaran"**.
   - Jika tugas berjenis _Bidding_, masukkan nominal harga penawaran kustom (`bid_amount`) dan pesan pitching singkat.
3. **Membuat Tugas & Escrow**:
   - Buka menu `/task/new`, pilih mode **Harga Tetap** atau **Mode Bidding (Lelang)**, tentukan rentang budget dan lokasi GPS.
   - Saldo dipotong dan dikunci otomatis di escrow (`budget_max * kuota`).
   - Evaluasi tawaran yang masuk; terima pengerja terbaik (selisih plafon dana seketika di-refund otomatis).
4. **Koordinasi & Penyelesaian**:
   - Koordinasikan detail pekerjaan melalui fitur obrolan instan di `/chat`.
   - Worker mengunggah bukti pengerjaan (_Work Proof_), requester memverifikasi dan klik **"Selesaikan"**.
   - Dana escrow cair ke dompet worker, memicu perolehan `+50 XP`, streak harian, dan modal ulasan mutual bintang 5.
5. **Top-Up Dompet & Penanganan Kendala**:
   - Isi saldo dompet instan melalui `/wallet` via integrasi Midtrans Snap (QRIS/VA).
   - Jika terjadi kendala pengerjaan, buka tiket penyelesaian masalah di `/disputes`.

#### Untuk Admin

1. **Akses Portal Admin**: Akses portal terisolasi di `/admin/login`.
2. **Monitoring Real-time**: Pantau metrik KPI, grafik tren 7 hari, dan distribusi status penugasan di `/admin/dashboard`.
3. **Pencarian Global (`Ctrl + K`)**: Gunakan bar pencarian instan untuk menavigasi menu, mencari pengguna, tugas, atau kategori.
4. **Moderasi Pengguna & Konten**:
   - Kelola status akun di `/admin/users` (tersedia opsi suspend permanen atau penangguhan sementara dengan masa kedaluwarsa otomatis).
   - Take down tugas yang melanggar aturan di `/admin/tasks`.
5. **Mediasi Sengketa & Pengaduan**:
   - Tangani aduan pengguna di `/admin/reports`.
   - Tinjau kronologi bukti dan tetapkan keputusan finansial sengketa (_favor worker_ atau _favor requester_) di `/admin/disputes`.

---

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api
Production:  https://cepat-steel.vercel.app/api
```

### Endpoints Utama

#### Autentikasi Pengguna

```http
POST /api/auth/register    # Pendaftaran akun baru + sanitasi email disposable
POST /api/auth/login       # Login email & kata sandi
POST /api/auth/logout      # Pembatalan sesi pengguna
GET  /api/auth/me          # Profil akun pengguna aktif
```

#### Manajemen Tugas & Bidding

```http
GET    /api/tasks          # Daftar tugas publik terpaginasi
POST   /api/tasks          # Pembuatan tugas baru + penguncian escrow
GET    /api/tasks/nearby   # Query geospasial radius PostGIS (lat, lng, radius)
GET    /api/tasks/scheduled # Kalender jadwal penugasan
GET    /api/tasks/:id      # Detail spesifik tugas
POST   /api/tasks/:id/apply # Pengajuan lamaran & sealed-bid penawaran
GET    /api/tasks/:id/bids # Daftar tawaran masuk untuk requester
POST   /api/tasks/:id/status # Transisi status (start, submit, complete, cancel)
```

#### Dompet & Pembayaran Midtrans

```http
GET    /api/wallet         # Rincian saldo dompet & riwayat mutasi transaksi
POST   /api/payment/create # Pembuatan Snap token top-up Midtrans
GET    /api/payment/status # Pengecekan status pembayaran order_id
POST   /api/payment/webhook # Webhook notifikasi IPN dengan verifikasi SHA-512
```

#### Pusat Sengketa (Dispute Center)

```http
GET    /api/disputes       # Daftar tiket sengketa pengguna
POST   /api/disputes       # Pembukaan laporan sengketa baru
GET    /api/disputes/:id   # Rincian perkara, berkas bukti, & pesan mediasi
POST   /api/disputes/:id/evidence # Pengunggahan bukti teks/foto
POST   /api/disputes/:id/messages # Pengiriman pesan mediasi sengketa
```

#### Gamifikasi & Portofolio

```http
GET    /api/leaderboard    # Peringkat pekerja berdasarkan skor pembobotan berimbang
GET    /api/xp             # Detail level, XP log, daily streak, & lencana
GET    /api/portfolio      # Galeri karya portofolio pekerja
POST   /api/portfolio      # Penambahan item galeri karya baru
POST   /api/upload         # Upload berkas gambar ke Supabase Storage Bucket
```

### Example Request

```javascript
// Contoh: Mengajukan Lamaran dengan Tawaran Bidding Tertutup
const response = await fetch("/api/tasks/task-uuid-123/apply", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userAccessToken}`,
  },
  body: JSON.stringify({
    pesan:
      "Halo, saya siap membantu foto katalog menu kafe Anda. Portofolio terlampir di profil.",
    bid_amount: 85000,
  }),
});

const result = await response.json();
console.log(result);
```

📖 _Dokumentasi lengkap seluruh 22 kelompok endpoint API tersedia di [`docs/api.md`](docs/api.md)._

---

## 🧪 Testing

### Running API Tests (Bruno Client)

Pengujian fungsionalitas seluruh alur REST Route Handlers disediakan dalam bentuk koleksi otomatis **Bruno API Client** di direktori [`docs/api-cepat/`](docs/api-cepat):

```bash
# 1. Buka aplikasi Bruno (https://www.usebruno.com/)
# 2. Open Collection -> Pilih folder docs/api-cepat/
# 3. Pilih environment 'Local' (http://localhost:3000/api)
# 4. Jalankan pengujian otomatis untuk Authentication, Tasks, Bidding, dan Payment
```

### Code Quality & Validation

```bash
# Pemeriksaan sintaksis & aturan kode
npm run lint

# Validasi keabsahan skema Prisma
npx prisma validate
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

<div align="center">

**By Tembalang Sakti for ITECHNO CUP 2026**

</div>

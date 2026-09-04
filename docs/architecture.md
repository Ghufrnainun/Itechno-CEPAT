# Arsitektur Sistem — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan Arsitektur

CEPAT (Cari Entry Pekerjaan Area Terdekat) mengadopsi arsitektur **Full-Stack Monolith Modular** berbasis Next.js 16 App Router. Seluruh lapisan antarmuka (SSR & Client Components), API Route Handlers, logika bisnis (*service layer*), dan pipeline otentikasi diintegrasikan dalam satu codebase terstruktur.

Data layer dikelola secara terpadu melalui **Prisma ORM 7** sebagai *single source of truth* untuk basis data PostgreSQL Supabase yang dilengkapi ekstensi geospasial **PostGIS**. Untuk komunikasi real-time, sistem menggunakan kombinasi **Supabase Realtime** (in-app WebSocket) dan **Firebase Cloud Messaging (FCM)** (web push notifications). Transaksi dompet digital didukung oleh integrasi **Midtrans Snap**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     KLIEN / BROWSER / PWA                              │
│  Next.js 16 (React 19) + Tailwind CSS 4 + Motion + Leaflet.js + OSM Tiles             │
│  PWA Manifest (standalone) + Firebase Messaging Service Worker                        │
└───────────────────┬─────────────────────────────────┬──────────────────────────────────┘
                    │ HTTPS Requests                  │ WebSocket Live Channel
                    ▼                                 ▼
┌────────────────────────────────────────────────┐  ┌────────────────────────────────────┐
│         EDGE PROXY / MIDDLEWARE                │  │       SUPABASE REALTIME            │
│         (src/proxy.ts)                         │  │       (WebSocket Streaming)        │
│  - Admin Guard & Token Hashing (SHA-256)       │  │  - Task status transitions         │
│  - Supabase Auth Session Refresh               │  │  - Live applicant broadcasts       │
│  - User Banned Status & Auto-Unban Check       │  │  - Direct messaging chat rooms     │
└───────────────────┬────────────────────────────┘  └────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 APP ROUTER & API HANDLERS                           │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │     Route Groups      │  │      Service Layer      │  │     Utility & Adapters    │ │
│  │ - (auth): login/reg   │  │ - task.service.ts       │  │ - lib/prisma.ts           │ │
│  │ - (main): user apps   │  │ - wallet.service.ts     │  │ - lib/midtrans.ts         │ │
│  │ - (admin): management │  │ - gamification.service  │  │ - lib/validations.ts (Zod)│ │
│  │ - api/*: 22 endpoints │  │ - dispute.service.ts    │  │ - lib/firebase/*          │ │
│  └───────────────────────┘  └─────────────────────────┘  └───────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────────────┬──────────────────┘
                    │ Database Queries                                │ External Gateways
                    ▼                                                 ▼
┌─────────────────────────────────────────────────────────┐  ┌───────────────────────────┐
│              SUPABASE (POSTGRESQL + POSTGIS)            │  │     EKSTERNAL SERVICES    │
│  ┌────────────────────┐  ┌───────────────────────────┐  │  │ - Midtrans Snap (Topup)   │
│  │ Prisma ORM Schema  │  │ PostGIS Spatial Extension │  │  │ - Firebase Admin FCM Push │
│  │ (24 Model Tabel)   │  │ ST_DWithin Radius Query   │  │  │ - Vercel Cron (Reminders) │
│  ├────────────────────┤  ├───────────────────────────┤  │  └───────────────────────────┘
│  │ Supabase Auth      │  │ Supabase Storage (Buckets)│  │
│  │ (auth.users)       │  │ (portfolio & dispute docs)│  │
│  └────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Struktur Folder Codebase Aktual

```
Itechno/
├── public/
│   ├── icons/                   # PWA icons (192x192, 512x512, maskable)
│   ├── firebase-messaging-sw.js # FCM background push notification service worker
│   └── images/ & assets/
│
├── prisma/
│   ├── schema.prisma            # Single source of truth skema database (24 model)
│   ├── seed.mjs                 # Comprehensive seed script (data demo realistis)
│   └── migrations/              # Riwayat migrasi skema Prisma
│
├── supabase/
│   └── migrations/              # SQL migrasi RLS policies, triggers & PostGIS
│
├── docs/                        # Dokumentasi menyeluruh proyek
│   ├── api-cepat/               # Bruno API testing collections
│   └── *.md
│
├── src/
│   ├── proxy.ts                 # Next.js middleware (Admin & User Auth Guard)
│   │
│   ├── app/                     # Next.js 16 App Router
│   │   ├── (auth)/              # Autentikasi pengguna biasa
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── onboarding/
│   │   │
│   │   ├── (main)/              # Area aplikasi pengguna utama (Unified Requester/Worker)
│   │   │   ├── dashboard/       # Overview statistik & ringkasan aktivitas
│   │   │   ├── cari-tugas/      # Peta interaktif Leaflet + Feed penemuan tugas mikro
│   │   │   ├── task/
│   │   │   │   ├── [id]/        # Detail tugas, pelamar, escrow status, pengerjaan
│   │   │   │   └── new/         # Pembuatan tugas baru (Fixed / Bidding lelang)
│   │   │   ├── chat/            # Real-time direct chat & task coordination
│   │   │   ├── disputes/        # Dispute resolution center (pengajuan & mediasi)
│   │   │   ├── schedule/        # Kalender & timeline jadwal penugasan
│   │   │   ├── leaderboard/     # Peringkat gamifikasi, badges & level worker
│   │   │   ├── profile/         # Profil publik, showcase portofolio, review & skill
│   │   │   ├── wallet/          # Dompet, mutasi saldo, escrow status, top-up Midtrans
│   │   │   ├── saved/           # Bookmark daftar tugas yang disimpan
│   │   │   ├── history/         # Riwayat pekerjaan terselesaikan & ulasan
│   │   │   └── notifications/   # Pusat notifikasi pengguna
│   │   │
│   │   ├── (admin)/             # Portal pengurus & konsol tata kelola platform
│   │   │   ├── layout.tsx       # Collapsible sidebar + topbar dengan Global Search
│   │   │   └── admin/
│   │   │       ├── login/       # Portal autentikasi khusus admin
│   │   │       ├── dashboard/   # Analitik KPI, tren visual Recharts, distribusi status
│   │   │       ├── users/       # Manajemen user, suspend permanen/sementara, unban
│   │   │       ├── tasks/       # Moderasi tugas, take-down, force complete
│   │   │       ├── categories/  # CRUD kategori tugas & master skills
│   │   │       ├── reports/     # Konsol aduan pengguna & status investigasi
│   │   │       └── disputes/    # Mediasi dan resolusi perselisihan
│   │   │
│   │   ├── api/                 # 22 Kelompok REST Route Handlers
│   │   │   ├── admin/           # Auth, stats, users, tasks, reports, disputes, search
│   │   │   ├── auth/            # Register, login, logout, me
│   │   │   ├── tasks/           # CRUD, nearby, feed, scheduled, apply, bids, status
│   │   │   ├── disputes/        # Create dispute, evidence upload, message, resolve
│   │   │   ├── payment/         # Midtrans transaction create, status, webhook
│   │   │   ├── leaderboard/     # Skor berbobot, XP, streaks, level
│   │   │   ├── portfolio/       # Galeri karya & portofolio pekerja
│   │   │   ├── saved-tasks/     # Bookmark tugas
│   │   │   ├── cron/            # Scheduler pengingat tugas (schedule-reminder)
│   │   │   ├── upload/          # Upload media ke Supabase Storage
│   │   │   ├── wallet/          # Log transaksi dan saldo escrow
│   │   │   ├── chat/            # Kamar obrolan dan pesan
│   │   │   ├── notifications/   # Realtime notification sync
│   │   │   ├── reviews/         # Rating dua arah
│   │   │   ├── reports/         # Aduan laporan pengguna
│   │   │   └── skills/          # Master skill query
│   │   │
│   │   ├── manifest.ts          # Native PWA Web App Manifest
│   │   ├── layout.tsx           # Root layout dengan font & dynamic providers
│   │   └── globals.css          # Tailwind CSS v4 & theme variables
│   │
│   ├── components/
│   │   ├── admin/               # AdminSidebar, AdminTopbar, KPICard, DataTable, Drawers
│   │   ├── landing/             # Hero, USP, SDG narrative, CTA
│   │   ├── task/                # TaskCard, TaskDetail, TaskBiddingModal, MapComponents
│   │   ├── motion/              # Motion wrappers untuk transisi halus
│   │   └── ui/                  # Button, Modal, Drawer, Badges, Tabs, Avatar
│   │
│   ├── services/                # Heavy business logic terisolasi
│   │   ├── task.service.ts      # Siklus hidup task, kuota, bidding, Model C escrow
│   │   ├── wallet.service.ts    # Transaksi saldo, hold/release/refund atomik
│   │   ├── gamification.service.ts # Perhitungan XP, level, badge eligibility, streak
│   │   ├── dispute.service.ts   # Alur sengketa, submit bukti, putusan admin
│   │   ├── review.service.ts    # Agregasi rating rata-rata & ulasan
│   │   └── notification.service.ts # Push notif & in-app event triggers
│   │
│   ├── lib/
│   │   ├── prisma.ts            # Prisma Client singleton dengan adapter pg
│   │   ├── midtrans.ts          # Midtrans Snap & Core API client
│   │   ├── supabase/            # Client browser, server & middleware helpers
│   │   ├── firebase/            # Firebase web & admin config
│   │   ├── validations.ts       # Zod schemas terpadu
│   │   └── rate-limit.ts        # In-memory sliding window rate limiter
│   │
│   └── types/                   # TypeScript interfaces & database mappings
```

---

## 3. Alur Data Utama

### 3.1 Siklus Tugas & Transaksi Escrow Model C

```
Requester Submit Task (Fixed/Bidding)
  │
  ├─► Sistem memotong & mengunci saldo: (budget_max * kuota) sebagai Held Escrow
  │
  ├─► Task tayang di Peta & Feed (/cari-tugas) via PostGIS ST_DWithin
  │
  ├─► Worker mengajukan lamaran (Sealed-Bid / Pitching)
  │
  ├─► Requester mengevaluasi dan memilih Worker:
  │     └─► AUTO-REFUND INSTAN: Selisih (budget_max - bid_accepted) langsung dikembalikan
  │         ke saldo dompet Requester seketika. Sisa (bid_accepted) tetap di-hold di escrow.
  │
  ├─► Status berubah ke ACCEPTED / IN_PROGRESS -> Chat Room aktif
  │
  ├─► Worker mengirimkan bukti penyelesaian tugas (Work Proof)
  │
  ├─► Requester memverifikasi dan menyetujui hasil pengerjaan:
  │     └─► ESCROW RELEASE: Dana yang di-hold otomatis ditransfer ke dompet Worker.
  │     └─► GAMIFICATION TRIGGER: Worker menerima +50 XP, streak harian terupdate.
  │
  └─► Kedua pihak saling memberikan ulasan & rating bintang 1–5.
```

### 3.2 Penjadwalan & Pengingat Otomatis (Cron Jobs)

1. Requester dapat menentukan tanggal & jam pelaksanaan tugas (`scheduled_at` dan `scheduled_end`).
2. Tugas terjadwal ditampilkan pada kalender pengguna (`/schedule`).
3. Endpoint `/api/cron/schedule-reminder` dieksekusi secara berkala oleh Vercel Cron untuk mendeteksi tugas H-24 jam dan H-1 jam, lalu memicu notifikasi push FCM dan notifikasi in-app ke kedua belah pihak.

### 3.3 Sistem Gamifikasi & Reputasi

* **Leveling Formula**: `Level = floor(sqrt(XP / 100)) + 1`
* **Pemberian XP**:
  * Menyelesaikan tugas: `+50 XP`
  * Menerima rating sempurna 5★: `+25 XP`
  * Menjaga streak harian: `+10 XP`
  * Tugas pertama berhasil: `+100 XP Bonus`
* **Leaderboard Weighted Score**:
  `Score = (total_completed * 3) + (rating_avg * 20) + (xp * 0.1)`

### 3.4 Pusat Mediasi & Sengketa (Dispute Center)

1. Jika terjadi ketidaksepakatan pada tugas `IN_PROGRESS` atau `COMPLETED`, salah satu pihak dapat membuka sengketa di `/disputes`.
2. Kedua pihak mengunggah bukti teks maupun foto (`DisputeEvidence`) dan berkomunikasi dalam ruang mediasi resmi.
3. Moderator/Admin melalui `/admin/disputes` dapat menelaah kronologi dan menetapkan keputusan:
   * **RESOLVED_FAVOR_WORKER**: Dana escrow dicairkan ke pekerja.
   * **RESOLVED_FAVOR_REQUESTER**: Dana escrow dikembalikan penuh ke requester.

---

## 4. Keamanan & Tata Kelola

1. **Proxy Middleware (`src/proxy.ts`)**:
   * Memvalidasi token sesi admin (`admin_token`) yang di-hash dengan SHA-256 pada tabel `AdminSession`.
   * Memeriksa status penangguhan akun (`is_banned`). Pengguna yang terkena penangguhan sementara (*temporary ban*) akan otomatis dipulihkan (*auto-unban*) setelah masa berlaku habis.
2. **Row Level Security (RLS)**:
   * Aturan RLS ketat diterapkan pada tabel PostgreSQL Supabase melalui file migrasi di `supabase/migrations/`.
   * Mutasi saldo (`Transactions`) hanya dapat dilakukan melalui fungsi transaksi backend yang atomik.
3. **Validasi Skema Zod & Anti-XSS**:
   * Seluruh payload masukan divalidasi oleh skema Zod di sisi server sebelum menyentuh lapisan database.
   * Proteksi disposable/temporary email (100+ domain terblokir) pada proses registrasi akun.

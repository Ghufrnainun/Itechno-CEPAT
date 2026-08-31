<div align="center">

# CEPAT (Cari Entry Pekerjaan Area Terdekat)
### Hyperlocal Micro-Task & Freelancing Platform for Inclusive Digital Economy

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](https://[URL_DEMO])
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://[URL_REPO])
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Submission for ITECHNO CUP 2026 - Web Development**

**By [Nama Tim]**

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Penggunaan AI & Etika](#-penggunaan-ai--etika)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Tim Developer](#-tim-developer)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Nama | Peran | GitHub |
|------|-------|--------|
| **[Nama Lengkap 1]** | Project Lead & Full Stack Developer | [GitHub](https://github.com/[username1]) |
| **[Nama Lengkap 2]** | Frontend & UI/UX Developer | [GitHub](https://github.com/[username2]) |
| **[Nama Lengkap 3]** | Backend & Integration Engineer | [GitHub](https://github.com/[username3]) |

---

## 🎯 Tentang Proyek

### Latar Belakang
Banyak mahasiswa membutuhkan pekerjaan sampingan dengan jam kerja fleksibel yang menyesuaikan jadwal kuliah. Di sisi lain, UMKM lokal dan sesama mahasiswa sering membutuhkan bantuan pekerjaan mikro (*micro-tasks*) yang butuh penanganan cepat (seperti foto produk, entri data, atau bantuan acara). Platform freelancing tradisional seringkali terlalu rumit dan tidak memfasilitasi kebutuhan pekerjaan berskala mikro dan berbasis radius lokasi terdekat.

### Solusi yang Ditawarkan
Platform *hyperlocal micro-freelancing* berbasis radius lokasi (hingga 2 km) yang menghubungkan mahasiswa dengan UMKM lokal. Menggunakan sistem dompet terintegrasi (*Escrow System*) untuk menjamin keamanan pembayaran, serta fitur *Realtime Chat* untuk komunikasi langsung.

### Tujuan Proyek
- 🎯 **Tujuan Utama**: Meningkatkan akses pekerjaan layak dan pertumbuhan ekonomi lokal inklusif (Mendukung **SDG 8**).
- 📊 **Target Pengguna**: Mahasiswa aktif dan Pelaku UMKM lokal perkotaan.
- 💡 **Value Proposition**: Pekerjaan mikro cepat berbasis radius terdekat (max 2 km) dengan sistem potong-kunci saldo (*escrow balance*) otomatis yang aman.

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur | Deskripsi | Keunggulan |
|----------|--------------|---------------|
| **Unified Account** | Satu akun dapat berperan sebagai Pemberi Kerja (Poster) maupun Pekerja (Tasker). | Fleksibel tanpa perlu registrasi ulang dua peran. |
| **Interactive Map & Radius Search** | Visualisasi tugas mikro berbasis peta interaktif dengan filter jarak radius terdekat (max 2km). | Memastikan tugas dekat secara geografis dan mudah dijangkau. |
| **Escrow Balance System** | Saldo Poster dipotong & dikunci saat tugas dibuat, dan otomatis ditransfer ke Tasker setelah disetujui. | Menjamin kepastian pembayaran tanpa risiko penipuan. |
| **In-App Realtime Chat** | Komunikasi instan dua arah antara Poster & Tasker setelah tugas diambil. | Didukung oleh Supabase Realtime Channels untuk koordinasi cepat. |
| **Rating & Review System** | Penilaian ulasan & bintang 5 dua arah setelah status tugas `Completed`. | Membangun reputasi dan rasa percaya (*trust*) pengguna. |

---

## 📸 Demo & Screenshot

### Live Demo
🔗 **[Kunjungi Website](https://[URL_DEMO])**

### Screenshot Aplikasi

<div align="center">
  <img src="[URL_SCREENSHOT_1]" alt="Homepage" width="800"/>
  <p><em>Homepage - Dashboard Peta Interaktif & Pencarian Radius</em></p>

  <img src="[URL_SCREENSHOT_2]" alt="Task Detail & Escrow" width="800"/>
  <p><em>Task Detail - Sistem Kunci Saldo Escrow & Form Pengerjaan</em></p>

  <img src="[URL_SCREENSHOT_3]" alt="Realtime Chat" width="800"/>
  <p><em>In-App Realtime Chat & Task Status Tracker</em></p>
</div>

### Video Demo
📹 **[Link Video Demo](https://[URL_VIDEO])** _(opsional)_

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend
```
Framework  : Next.js 14 (App Router)
UI Library : Tailwind CSS / Lucide React / Leaflet Map
State Mgmt : React Context / Zustand
Validation : Zod / React Hook Form
```

#### Backend & Database (BaaS)
```
Platform   : Supabase
Database   : PostgreSQL (PostGIS / Spatial Query)
Auth       : Supabase Auth (@supabase/ssr)
Realtime   : Supabase Realtime Channels
Storage    : Supabase Storage
```

#### DevOps & Tools
```
Deployment : Vercel
CI/CD      : GitHub Actions / Vercel CI
Testing    : Vitest / Playwright
```

### 🚫 Deklarasi Bebas Template Instan (Compliance ITECHNO CUP)
Menanggapi aturan ketat dari panitia lomba, kami mendeklarasikan bahwa platform CEPAT dibangun **100% dari awal (scratch)** dengan menggunakan bahasa pemrograman modern (TypeScript, React/Next.js) dan ditulis secara kustom. Proyek ini **tidak menggunakan** *template* instan, CMS (*Content Management System*), atau *Visual Builder* instan (seperti WordPress, Wix, Shopify, atau Webflow). Semua elemen UI dan alur bisnis (*business logic*) dikembangkan secara mandiri oleh tim untuk menunjukkan kompetensi *engineering* yang orisinal dan sesungguhnya.

---

## 🤖 Penggunaan AI & Etika (Dokumentasi Wajib ITECHNO CUP)

Sesuai dengan regulasi perlombaan ITECHNO CUP 2026, kami mendeklarasikan bahwa Artificial Intelligence (AI) digunakan dalam pengembangan aplikasi **CEPAT** sebagai *Pair-Programming Assistant* dengan batasan dan pertimbangan etis/keamanan yang ketat:

### 1. Penggunaan AI dalam Pengembangan
- **Code Generation & Boilerplate**: AI digunakan untuk mempercepat pembuatan struktur dasar komponen React (UI), *routing* di Next.js, dan skema validasi Zod.
- **Vulnerability Scanning & Bug Fixing**: AI bertindak sebagai auditor keamanan untuk menemukan dan menambal celah seperti *Escrow Mismatch*, *Race Condition*, dan celah pada kalkulasi radius *Geo-fence* PostGIS.
- **Data Seeding**: AI digunakan untuk menyusun *dummy data* (*cold start seed script*) untuk keperluan presentasi dan demo agar *database* memiliki data simulasi realistis tanpa menggunakan data privasi pengguna asli.

### 2. Pertimbangan Etis & Keamanan
- **Data Privacy (Privasi Data)**: Kami menjamin **tidak ada** satupun data pribadi, kredensial pengguna, atau rahasia lingkungan (*environment variables/secrets*) yang pernah dikirimkan ke model AI publik. Simulasi pengujian murni menggunakan data buatan (*dummy/mock*).
- **Security & Human-in-the-Loop**: Meskipun AI memberikan rekomendasi kode keamanan (seperti perlindungan algoritma *escrow* dan pelepasan dana), **keputusan akhir dan proses integrasi (Code Review) sepenuhnya diverifikasi oleh anggota tim manusia** (Developer) untuk memastikan tidak ada logika yang rentan terhadap *hacking* atau *fraud*.
- **Orisinalitas & Hak Cipta**: Keseluruhan arsitektur sistem, desain UI/UX, dan ide dasar platform CEPAT adalah hasil karya orisinal tim. AI hanya bertindak sebagai *copilot* untuk meningkatkan efisiensi *coding*, dan tidak ada kode komersial berhak cipta yang dijiplak.

---

## 🏗️ Arsitektur Sistem

### System Architecture
```
+-------------------------------------------------------+
|                    Client / Browser                   |
|          (Next.js App Router + Leaflet Maps)          |
+---------------------------+---------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+       +-----------------------+
|   Next.js Server      |       |    Supabase BaaS      |
|  (Server Actions &    |       |  (PostgreSQL, Auth,   |
|   Escrow API Logic)   |       |  Storage, Realtime)   |
+-----------------------+       +-----------------------+
```

### Folder Structure
```
project-root/
├── src/
│   ├── app/           # Next.js App Router (Pages, Layouts, API Routes)
│   ├── components/    # Reusable UI components & Map components
│   ├── hooks/         # Custom hooks (Geolocation, Realtime Chat)
│   ├── lib/           # Supabase client (client.ts, server.ts)
│   ├── utils/         # Helper functions (Distance calculator, Escrow handler)
│   └── types/         # TypeScript types & Supabase generated DB types
├── supabase/          # Supabase CLI config, migrations, & seed files
├── public/            # Static assets
└── docs/              # Dokumentasi & Context
```

---

## ⚙️ Instalasi & Setup

### Prerequisites
- **Node.js** (v18.x atau lebih tinggi)
- **npm** / **yarn** / **pnpm**
- **Git**
- **Akun Supabase**

### Langkah Instalasi

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]
```

#### 2️⃣ Install Dependencies
```bash
npm install
```

#### 3️⃣ Setup Environment Variables
Buat file `.env.local` di root directory:
```env
NEXT_PUBLIC_SUPABASE_URL="https://[your-supabase-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-supabase-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-supabase-service-role-key]"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

#### Seed akun demo

Setelah migrasi database selesai, jalankan:

```bash
npm run db:seed
```

Semua akun memakai password `Password123!` secara default:

| Nama | Email | Role |
| --- | --- | --- |
| Budi Santoso | `budi@cepat.com` | Requester |
| Andi Pratama | `andi@cepat.com` | Worker |
| Sari Lestari | `sari@cepat.com` | Requester |
| Rina Maharani | `rina@cepat.com` | Worker |

Password demo bisa diubah lewat `SEED_AUTH_PASSWORD`.

#### 4️⃣ Run Development Server
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

---

<div align="center">

**Made with ❤️ by [Nama Tim] for ITECHNO CUP 2026**

</div>

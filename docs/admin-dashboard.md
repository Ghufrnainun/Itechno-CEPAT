# Dokumentasi Admin Dashboard — CEPAT

## 1. Ringkasan & Tujuan

**Admin Dashboard** adalah modul panel kelola internal untuk platform **CEPAT (Cari Entry Pekerjaan Area Terdekat)**. Modul ini dirancang khusus untuk:
1. **Penyisihan & Final ITechno Cup 2026**: Menunjukkan tata kelola platform (*governance*), moderasi konten, transparansi transaksi, serta pemantauan aktivitas real-time secara visual dan profesional kepada dewan juri.
2. **Operasional Produksi Penuh**: Terhubung langsung ke Prisma ORM dan REST API internal (`/api/admin/*`) dengan sistem otentikasi sesi terproteksi hash SHA-256 (`AdminSession`).

---

## 2. Arsitektur & Struktur Folder

Admin Dashboard diisolasi secara ketat dalam Route Group `(admin)` agar tidak terpengaruh oleh layout utama aplikasi user biasa (`(main)` dengan bottom navigation).

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                     # Layout terisolasi (Collapsible Sidebar + Topbar)
│   │   └── admin/
│   │       ├── login/
│   │       │   └── page.tsx               # Dedicated Admin Login Portal
│   │       ├── dashboard/
│   │       │   └── page.tsx               # Analytics Overview & Recharts Visualizations
│   │       ├── users/
│   │       │   └── page.tsx               # User Management Table + Slide-over Drawer + Moderation
│   │       ├── tasks/
│   │       │   └── page.tsx               # Task Management Table + Status Filters + Takedown
│   │       ├── categories/
│   │       │   └── page.tsx               # Categories & Skills Management (Tabbed + Modals)
│   │       ├── reports/
│   │       │   └── page.tsx               # User Reports Console + Status Actions + Direct URL
│   │       └── disputes/
│   │           └── page.tsx               # Dispute Resolution Center (Mediasi & Escrow Decision)
│   │
│   └── api/
│       └── admin/                         # Backend Route Handlers Khusus Admin
│           ├── auth/                      # Login, logout, status sesi
│           ├── stats/                     # KPI stats, tren harian, distribusi status
│           ├── users/                     # List, detail profil, suspend (perm/temp), unban, warn
│           ├── tasks/                     # List, detail, take-down, force complete
│           ├── reports/                   # List aduan, filter status, update resolusi
│           ├── disputes/                  # List sengketa, mediasi, penetapan favor worker/requester
│           ├── search/                    # Global search debounced untuk menu, user, task, kategori
│           └── notifications/             # Polling & FCM sync notifikasi admin
│
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx               # Collapsible sidebar dengan route indicators
│       ├── AdminTopbar.tsx                # Topbar dengan Global Search (Ctrl+K), FCM Bell Counter
│       ├── KPICard.tsx                    # Reusable stat metric card berdesain anti-side-stripe
│       ├── DataTable.tsx                  # Reusable paginated data table
│       ├── StatusBadge.tsx                # Badges status standar
│       ├── AdminDrawer.tsx                # Slide-over drawer untuk inspeksi cepat tanpa keluar alur
│       └── AdminModal.tsx                 # Dialog modal tindakan CRUD & konfirmasi
```

---

## 3. Fitur Utama & Panduan Penggunaan

### 3.1 🔑 Portal Login & Keamanan Sesi Admin (`/admin/login`)
- **Portal Terpisah**: Akses khusus pengelola platform tanpa tercampur dengan alur pengguna umum.
- **Keamanan Token Sesi**: Menggunakan cookie `admin_token` yang nilainya dicocokkan dengan hash **SHA-256** pada tabel `AdminSession`.
- **Middleware Guard (`src/proxy.ts`)**: Mencegah akses ke seluruh rute `/admin/*` dan `/api/admin/*` tanpa sesi admin aktif. Pengguna dengan peran `Admin` yang mencoba membuka rute pengguna umum juga otomatis dialihkan ke `/admin/dashboard`.

### 3.2 📊 Overview Dashboard (`/admin/dashboard`)
- **5 Kartu KPI Utama**:
  - `Total Users`: Jumlah akun terdaftar (akumulasi Worker, Requester, dan Admin).
  - `Total Tasks`: Jumlah seluruh micro-task yang terbuat di sistem.
  - `Active Tasks`: Jumlah tugas yang sedang berjalan (`open`, `accepted`, `in_progress`).
  - `Total Revenue`: Nilai perputaran transaksi saldo dan escrow di dalam platform.
  - `Completion Rate`: Persentase keberhasilan penyelesaian tugas secara tuntas.
- **Visualisasi Interaktif (Recharts)**:
  - *Line Chart*: Tren harian pembuatan vs penyelesaian tugas selama 7 hari terakhir.
  - *Donut Chart*: Distribusi persentase status tugas real-time.
- **Aktivitas Terkini**: Tabel 5 transaksi micro-task terbaru dengan status live.

### 3.3 👥 Manajemen & Moderasi Pengguna (`/admin/users`)
- **Tabel Pengguna Lengkap**: Menampilkan Avatar, Nama, Username, Email, Role, Rating Rata-rata, Tugas Terselesaikan, Status Akun (`Aktif` vs `Banned`), dan Tanggal Registrasi.
- **Slide-over Drawer Detail**: Klik baris tabel untuk melihat profil mendalam: rincian saldo total & saldo ditahan (escrow), daftar keahlian terverifikasi, dan portofolio.
- **Aksi Moderasi Pengguna**:
  - **Suspend User Modal**: Opsi penangguhan **Permanent** atau **Temporary** (pilihan durasi hari) dengan pencatatan alasan ban resmi.
  - **Auto-Unban**: Middleware `src/proxy.ts` secara otomatis mencabut status ban sementara saat tanggal `banned_until` terlewati.
  - **Unsuspend User**: Mencabut status ban secara manual dan mengembalikan akses akun.
  - **Kirim Peringatan (Official Warning)**: Mengirimkan surat peringatan ke kotak notifikasi pengguna.
  - **Reset Password**: Memicu instruksi pembaruan kata sandi.

### 3.4 📋 Manajemen Pekerjaan / Task (`/admin/tasks`)
- **Tabel Pekerjaan**: Judul tugas, Requester, Kategori Keahlian, Status Badge, Kompensasi / Rentang Budget Bidding, dan Jumlah Pelamar.
- **Tab Filter Status**: Filter instan berdasarkan siklus status (`All`, `Open`, `Accepted`, `In Progress`, `Completed`, `Cancelled`).
- **Slide-over Drawer & Aksi Moderasi**:
  - Menampilkan koordinat geografis lintang/bujur dan radius penugasan.
  - Daftar pengerja yang melamar / ditunjuk.
  - Tombol aksi **Take Down Task** (pembatalan darurat dengan pengembalian penuh sisa dana escrow ke requester) dan **Force Complete**.

### 3.5 🏷️ Tata Kelola Kategori & Keahlian (`/admin/categories`)
- **Tab Kategori Task**: CRUD nama kategori tugas mikro, pengelolaan ikon emoji, dan kalkulasi agregat tugas terkait.
- **Tab Master Skill**: CRUD master keahlian sistem yang tersedia untuk dipilih oleh pengguna saat melengkapi profil dan spesifikasi penugasan.

### 3.6 🚩 Manajemen Laporan Pengguna (`/admin/reports`)
- **Konsol Aduan Pengguna**:
  - 4 Kartu KPI: Total Laporan, Pending, Ditinjau (*Reviewed*), Selesai (*Resolved*).
  - DataTable laporan dilengkapi penyaringan status (`pending`, `reviewed`, `resolved`, `rejected`) dan kolom pencarian.
  - Slide-over Drawer untuk menelaah kronologi aduan, subjek, serta profil pelapor.
  - Integrasi tautan langsung: Membuka URL `/admin/reports?id=<reportId>` otomatis memunculkan detail laporan terkait.

### 3.7 🛡️ Manajemen Sengketa & Resolusi Escrow (`/admin/disputes`)
- **Panel Mediasi**: Menangani tiket sengketa antara Requester dan Worker.
- **Pemeriksaan Bukti**: Meninjau bukti foto dan deskripsi sanggahan dari kedua belah pihak.
- **Penetapan Resolusi Finansial**:
  - Menetapkan keputusan sepihak: `RESOLVED_FAVOR_WORKER` (dana escrow dicairkan ke worker) atau `RESOLVED_FAVOR_REQUESTER` (dana escrow di-refund ke requester).
  - Eksekusi transaksi dilakukan otomatis dan tercatat pada log mutasi.

### 3.8 🔍 Global Search Bar & Notifikasi Real-time FCM (`AdminTopbar.tsx`)
- **Pencarian Global (`Ctrl + K` / `Cmd + K`)**:
  - Pencarian debounced (200 ms) di seluruh database: Halaman Admin, Data Pengguna, Pekerjaan / Tugas, dan Kategori.
  - Navigasi keyboard penuh (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Bell Counter Notifikasi & FCM Push**:
  - Red counter badge jumlah laporan baru yang belum dibaca.
  - Listener push notification **Firebase Cloud Messaging (FCM)** yang menerima alert saat ada aduan baru dari pengguna.
  - Mengklik item notifikasi langsung mengarahkan admin ke aduan terkait.

---

## 4. Standar UI/UX Impeccable (Anti-AI-Slop Guidelines)

Dashboard ini mengimplementasikan aturan desain ketat:
1. **Tidak Ada Side-Stripe Borders**: Seluruh kartu metrik dan baris tabel menggunakan border penuh dengan kontras tint netral.
2. **Tidak Ada Gradient Text**: Judul dan angka metrik menggunakan warna solid untuk menjaga daya baca tinggi (*high legibility*).
3. **Perceptually Uniform Colors (OKLCH Tints)**: Warna netral dan aksen diselaraskan dengan palet `teal` khas brand CEPAT.
4. **Slide-over Drawers**: Mempertahankan alur kerja pengelola (*in-flow context*) tanpa memutus konteks tabel saat memeriksa detail.
5. **Dukungan Dark & Light Mode**: Transisi warna latar belakang dan teks natural di seluruh modul admin.

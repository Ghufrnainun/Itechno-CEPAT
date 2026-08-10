# Dokumentasi Admin Dashboard — CEPAT

## 1. Ringkasan & Tujuan

**Admin Dashboard** adalah modul panel kelola internal untuk platform **CEPAT (Cari Entry Pekerjaan Area Terdekat)**. Modul ini dirancang khusus untuk:
1. **Penyisihan & Final ITechno Cup 2026**: Menunjukkan tata kelola platform (*governance*), moderasi konten, serta pemantauan aktivitas real-time secara visual dan profesional kepada dewan juri.
2. **Operasional Pasca-Kompetisi**: Memiliki arsitektur terisolasi (Route Group `(admin)`) yang siap terhubung dengan Supabase/Prisma API secara seamless.

---

## 2. Arsitektur & Structure Folder

Admin Dashboard diisolasi dalam Route Group `(admin)` agar tidak mengganggu layout utama aplikasi user biasa (`(main)` dengan bottom-navigation).

```
src/
├── app/
│   └── (admin)/
│       ├── layout.tsx                     # Layout terisolasi (Collapsible Sidebar + Topbar)
│       └── admin/
│           ├── login/
│           │   └── page.tsx               # Dedicated Admin Login Portal
│           ├── dashboard/
│           │   └── page.tsx               # Overview Analytics & Recharts Data Visualization
│           ├── users/
│           │   └── page.tsx               # User Management Table + Slide-over Drawer
│           ├── tasks/
│           │   └── page.tsx               # Task Management Table + Status Filters + Drawer
│           └── categories/
│               └── page.tsx               # Categories & Skills Management (Tabbed + Modals)
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx               # Collapsible sidebar dengan active route state
│       ├── AdminTopbar.tsx                # Topbar dengan search, notifikasi, theme toggle, profile
│       ├── KPICard.tsx                    # Reusable stat card (anti-side-stripe pattern)
│       ├── DataTable.tsx                  # Reusable paginated data table
│       ├── StatusBadge.tsx                # Badges status task berwarna terstandarisasi
│       ├── AdminDrawer.tsx                # Slide-over drawer untuk inspeksi cepat tanpa pindah halaman
│       ├── AdminModal.tsx                 # Dialog modal untuk tindakan CRUD & konfirmasi
│       └── ThemeToggle.tsx                # Penukar Dark/Light Mode
└── lib/
    └── admin/
        └── mock-data.ts                   # Realistic mock dataset siap swap ke Prisma API
```

---

## 3. Fitur Utama & Panduan Penggunaan

### 3.1 🔑 Portal Login Admin (`/admin/login`)
- **Portal Terpisah**: Menyediakan pintu masuk khusus pengurus platform.
- **Auto-Redirect Support**: User dengan role `Admin` pada auth flow biasa juga otomatis diarahkan ke `/admin/dashboard`.

### 3.2 📊 Overview Dashboard (`/admin/dashboard`)
- **5 Kartu KPI Utama**:
  - `Total Users`: Jumlah total akun terdaftar (Worker, Requester, Dual-Role).
  - `Total Tasks`: Jumlah seluruh micro-task yang terbuat.
  - `Active Tasks`: Task berstatus `open`, `accepted`, atau `in_progress`.
  - `Total Revenue`: Total poin internal yang beredar & tertransaksikan.
  - `Completion Rate`: Persentase keberhasilan pengerjaan task.
- **Visualisasi Interaktif (Recharts)**:
  - *Line Chart*: Tren pembuatan & penyelesaian task harian.
  - *Donut Chart*: Distribusi status task real-time.
- **Aktivitas Terbaru**: Feed transaksi micro-task terkini.

### 3.3 👥 Manajemen Pengguna (`/admin/users`)
- **Tabel Pengguna**: Menampilkan Avatar, Nama, Username, Email, Role (`Worker`, `Requester`, `Dual-Role`, `Admin`), Rating, Jumlah Task Selesai, dan Tanggal Bergabung.
- **Pencarian & Filter**: Cari cepat berdasarkan nama/email/username dan filter per role.
- **Slide-over Drawer Detail**: Klik baris tabel untuk membuka profil lengkap pengguna, saldo poin, escrow yang ditahan, skill terverifikasi, serta aksi cepat (Reset Password, Suspend User).

### 3.4 📋 Manajemen Pekerjaan / Task (`/admin/tasks`)
- **Tabel Pekerjaan**: Menampilkan Judul, Pembuat (Requester), Kategori Skill, Status Badge, Kompensasi (Poin), dan Jumlah Applicant.
- **Tab Filter Status**: Filter instan berdasarkan status (`Open`, `Accepted`, `In Progress`, `Completed`, `Cancelled`).
- **Slide-over Drawer Detail**: Klik baris tabel untuk melihat deskripsi lengkap, lokasi geografis (radius), pengerja yang ditunjuk, serta aksi moderasi (Take Down Task, Force Complete).

### 3.5 🏷️ Tata Kelola Kategori & Skills (`/admin/categories`)
- **Tab Kategori Task**:
  - List emoji icon, nama kategori, dan jumlah task terkait.
  - Tambah kategori baru via modal.
  - Edit nama/icon kategori.
  - Hapus kategori dengan konfirmasi keamanan.
- **Tab Master Skill**:
  - List nama skill master dan jumlah user yang menguasainya.
  - CRUD master skill secara penuh.

---

## 4. Standar UI/UX Impeccable (Anti-AI-Slop Guidelines)

Dashboard ini mengimplementasikan aturan ketat desain `/impeccable`:
1. **Tidak Ada Side-Stripe Borders**: Mengaburkan keterbatasan desain standar. Kartu metric dan list item menggunakan border penuh dengan tint netral yang presisi.
2. **Tidak Ada Gradient Text**: Semua judul dan angka teks menggunakan solid color untuk daya baca yang tinggi (*high legibility*).
3. **Perceptually Uniform Colors (OKLCH Tints)**: Warna netral dan latar belakang disesuaikan dengan kontras `teal` khas brand CEPAT.
4. **Slide-over Drawers untuk Quick Inspection**: Menjaga alur kerja pengelola (*in-flow context*) tanpa memutus konteks tabel saat memeriksa detail user atau task.
5. **Dukungan Dark & Light Mode Seamless**: Transisi warna latar belakang dan teks yang natural antara skema terang dan gelap.

---

## 5. Pemetaan Data ke Prisma Schema (`prisma/schema.prisma`)

Saat backend siap dihubungkan, mock data pada `src/lib/admin/mock-data.ts` dapat di-swap dengan query Prisma berikut:

| Modul Admin | Model Prisma Terkait |
|---|---|
| Users List | `prisma.user.findMany({ include: { role: true, skills_user: true } })` |
| Tasks List | `prisma.task.findMany({ include: { requester: true, kategori: true, status_task: true } })` |
| Categories List | `prisma.taskCategory.findMany({ include: { _count: { select: { tasks: true } } } })` |
| Master Skills | `prisma.skillsMaster.findMany({ include: { _count: { select: { skills_user: true } } } })` |
| KPI Stats | Combined `prisma.user.count()`, `prisma.task.count()`, etc. |

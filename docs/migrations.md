# Panduan Arsitektur Database & Riwayat Migrasi — CEPAT

## 1. Ringkasan Strategi Arsitektur Database

Backend CEPAT (Cari Entry Pekerjaan Area Terdekat) menerapkan strategi arsitektur *database hybrid* berkinerja tinggi:
- **Prisma ORM 7 (`prisma/schema.prisma`)**: Bertindak sebagai sumber kebenaran tunggal (*single source of truth*) untuk skema relasional `public`, pemetaan tipe data, relasi kunci asing, dan operasi transaksi atomik.
- **Supabase Auth (`auth.users`)**: Mengelola kredensial dan enkripsi sesi autentikasi pengguna secara aman. Entitas profil `public.User` terhubung langsung menggunakan kolom UUID `auth_id`.
- **Supabase SQL Migrations (`supabase/migrations/`)**: Berisi skrip SQL untuk konfigurasi tingkat lanjut PostgreSQL, khususnya ekstensi geospasial **PostGIS** dan penegakan kebijakan keamanan **Row Level Security (RLS)**.

---

## 2. Alur Kerja Sinkronisasi & Migrasi

Untuk menerapkan perubahan skema atau menginisialisasi database:

1. **Sinkronisasi Skema Prisma**:
   ```bash
   # Terapkan skema Prisma langsung ke basis data PostgreSQL Supabase
   npx prisma db push
   
   # Atau buat migration log formal
   npx prisma migrate dev --name <nama_perubahan>
   ```

2. **Terapkan Kebijakan Row Level Security (RLS)**:
   ```bash
   # Eksekusi skrip kebijakan keamanan RLS terkini
   npx prisma db execute --file=supabase/migrations/20260831_comprehensive_rls_policies.sql
   npx prisma db execute --file=supabase/migrations/20260901_fix_comprehensive_rls.sql
   npx prisma db execute --file=supabase/migrations/20260901_fix_user_task_direct_rls.sql
   ```

3. **Inisialisasi Data Demo & Seed**:
   ```bash
   npm run db:seed
   ```

---

## 3. Riwayat Migrasi Database Resmi

### 3.1 Migrasi Skema Prisma (`prisma/migrations/`)

| Direktori Migrasi | Tanggal | Deskripsi Perubahan |
|---|---|---|
| `20260805_wallet_schema` | 05 Agustus 2026 | Penambahan kolom `total_balance`, `held_balance` pada `User`, dan model `Transactions` dengan enum `TransactionType` & `TransactionSubType`. |
| `20260816_task_bidding` | 16 Agustus 2026 | **Task Bidding System (Fase 1)**: Penambahan kolom `is_bidding`, `budget_min`, `budget_max`, `held_slots_json` pada `Task`, dan `bid_amount` pada `TaskApplicants`. |
| `20260823_saved_task` | 23 Agustus 2026 | Penambahan model `SavedTask` untuk fitur bookmark tugas tersimpan pengguna. |
| *Schema Expansion* | 25–31 Agustus 2026 | Integrasi model `Badge`, `UserBadge`, `UserStreak`, `XPLog`, `PortfolioItem`, `PaymentTransaction` (Midtrans), `Dispute`, `DisputeEvidence`, dan `DisputeMessage`. |

---

### 3.2 Migrasi SQL Supabase RLS & PostGIS (`supabase/migrations/`)

| File SQL | Tanggal | Fungsi & Deskripsi |
|---|---|---|
| `20260729_chat_features.sql` | 29 Juli 2026 | Struktur tabel dan constraint untuk ruang obrolan chat per penugasan. |
| `20260729_enable_rls.sql` | 29 Juli 2026 | Mengaktifkan perlindungan Row Level Security dasar pada seluruh tabel publik. |
| `20260803_add_fcm_token.sql` | 03 Agustus 2026 | Penambahan kolom `fcm_token` pada `User` untuk push notifications. |
| `20260805_wallet_schema.sql` | 05 Agustus 2026 | Penegakan RLS pada tabel transaksi saldo agar tidak bisa dimanipulasi langsung dari client. |
| `20260813_user_reports_schema.sql` | 13 Agustus 2026 | Skema penyimpanan tiket pengaduan pengguna dan izin akses moderator. |
| `20260829_init_postgis.sql` | 29 Agustus 2026 | Inisialisasi ekstensi `postgis` dan indeks spasial GIST untuk query radius `lokasi_geo`. |
| `20260831_comprehensive_rls_policies.sql` | 31 Agustus 2026 | Kebijakan RLS komprehensif untuk relasi Task, Applicants, Reviews, dan Chat. |
| `20260901_fix_comprehensive_rls.sql` | 01 September 2026 | Penyempurnaan RLS policy untuk sinkronisasi JWT `auth.uid()` dengan ID profil `User.id_user`. |
| `20260901_fix_user_task_direct_rls.sql` | 01 September 2026 | Optimasi akses query langsung requester dan worker pada entitas task aktif. |
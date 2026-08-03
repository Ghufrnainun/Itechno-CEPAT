# Panduan Arsitektur Database dan Migrasi

## Ringkasan

Backend CEPAT (Cari Entry Pekerjaan Area Terdekat) menggunakan strategi manajemen *database hybrid*. Kita memanfaatkan **Prisma ORM** untuk mendefinisikan skema dan migrasi, yang dipadukan dengan **Supabase** untuk Autentikasi dan *Row Level Security* (RLS).

Dokumen ini menjelaskan tentang pengaturan, arsitektur, dan prosedur *deployment* untuk lapisan *database* kita.

## 1. Strategi Arsitektur

Kita memisahkan peran antara Prisma dan Supabase untuk memaksimalkan efisiensi pengembangan dan keamanan:

- **Prisma (`prisma/schema.prisma`)**: Bertindak sebagai sumber utama (single source of truth) untuk skema `public`. Ini mendefinisikan semua tabel, kolom, constraint, dan relasi.
- **Supabase Auth (`auth.users`)**: Mengelola kredensial *user* dengan aman. Tabel `public.User` terhubung menggunakan kolom UUID `auth_id` yang dipetakan ke Supabase Auth, sehingga kita tidak perlu menyimpan *password* mentah.
- **Supabase SQL Migrations (`supabase/migrations/`)**: Berisi *script* SQL murni untuk fitur-fitur lanjutan PostgreSQL yang tidak dikelola secara bawaan oleh Prisma, khususnya aturan *Row Level Security* (RLS) dan ekstensi PostGIS.

## 2. Keamanan dan Row Level Security (RLS)

Semua tabel wajib menerapkan *Row Level Security*. Modifikasi *database* secara langsung dari sisi klien sangat dibatasi.
- **Verifikasi User**: Terdapat fungsi pembantu (*helper*) yang memetakan JWT Supabase `auth.uid()` ke `User.id_user` internal kita.
- **Akses Granular**: User hanya bisa memodifikasi datanya sendiri (misalnya: Profil, Tugas, Keahlian).
- **Transaksi Escrow**: Transaksi keuangan (Tabel `Transactions`) menolak penyisipan data (insert) secara langsung. Transaksi ini ditangani dengan aman melalui fungsi/trigger internal *backend*.

## 3. Pengaturan Development Lokal

Untuk menginisialisasi lapisan *database* secara lokal, jalankan langkah-langkah berikut:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Pastikan Anda memiliki file `.env` di *root* proyek dengan kredensial *database* yang benar:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://[user]:[password]@[host]:5432/postgres"
   ```

3. **Apply Prisma Schema**:
   Sinkronisasikan klien Prisma lokal Anda dan terapkan struktur skema dasar:
   ```bash
   npx prisma migrate dev
   ```
   *(Catatan: Ini akan menerapkan skema hingga migrasi terbaru, termasuk pemetaan `auth_id` yang aman).*

4. **Apply Supabase Policies**:
   Terapkan aturan RLS lanjutan dengan mengeksekusi SQL mentah langsung ke *database*:
   ```bash
   npx prisma db execute --file=supabase/migrations/20260729_enable_rls.sql
   ```

## 4. Alur Kerja Migrasi

Jika ingin mengubah skema *database* di masa depan, ikuti alur kerja berikut:

- **Untuk Perubahan Tabel/Kolom**: Ubah file `prisma/schema.prisma` dan jalankan `npx prisma migrate dev` untuk membuat migrasi Prisma.
- **Untuk Perubahan Keamanan/Kebijakan (RLS)**: Jangan masukkan logika RLS ke dalam migrasi Prisma. Sebagai gantinya, ubah atau buat file *script* `.sql` di folder `supabase/migrations/` dan terapkan secara manual atau melalui Supabase CLI.
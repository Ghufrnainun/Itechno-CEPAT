# API Reference — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan & Autentikasi

- **Framework**: Next.js 16 Route Handlers (`src/app/api/`)
- **Format**: JSON Request & Response
- **Base URL**: `http://localhost:3000/api` (dev) / `https://cepat.vercel.app/api` (prod)
- **Otentikasi Pengguna**: Supabase Auth JWT — Header `Authorization: Bearer <token>` atau session cookie Supabase.
- **Otentikasi Admin**: Cookie `admin_token` yang divalidasi via hash SHA-256 pada tabel `AdminSession`.
- **Validasi Data**: Menggunakan **Zod 4** (`src/lib/validations.ts`) dengan sanitasi input anti-XSS.

---

## 2. Autentikasi Pengguna (`/api/auth/*`)

### POST `/api/auth/register`
Mendaftarkan akun pengguna baru, menyinkronkan Supabase Auth ke model Prisma `User`.
* **Rate Limit**: 5 request / 15 menit.
* **Payload**:
  ```json
  {
    "email": "user@kampus.ac.id",
    "password": "Password123",
    "nama_lengkap": "Budi Pratama",
    "username": "budipratama"
  }
  ```
* **Proteksi**: Pemblokiran otomatis terhadap 100+ penyedia disposable/temporary email.
* **Response 201 Created**: `{ "success": true, "message": "Registrasi berhasil.", "data": { ... } }`

### POST `/api/auth/login`
Autentikasi menggunakan email dan kata sandi.
* **Response 200 OK**: Mengembalikan session token Supabase dan data profil pengguna.

### POST `/api/auth/logout`
Membatalkan sesi aktif pengguna dan menghapus cookie auth.

### GET `/api/auth/me`
🔒 **Authenticated** — Mengambil profil mendalam pengguna yang sedang login beserta peran, keahlian, dan saldo.

---

## 3. Manajemen Tugas & Bidding (`/api/tasks/*`)

### GET `/api/tasks`
Mengambil daftar tugas mikro aktif dengan filter pagination, kategori, dan pencarian kata kunci.

### POST `/api/tasks`
🔒 **Authenticated (Requester)** — Membuat tugas baru dan mengunci saldo escrow.
* **Payload**:
  ```json
  {
    "judul_tugas": "Bantu Foto 15 Produk Makanan",
    "deskripsi_tugas": "Membutuhkan foto produk untuk katalog GoFood dengan kamera mirrorless/HP jernih.",
    "id_category": "uuid-category",
    "estimasi_waktu": "2 Jam",
    "lokasi_lat": -6.2088,
    "lokasi_lng": 106.8456,
    "max_applicants": 1,
    "is_bidding": true,
    "budget_min": 75000,
    "budget_max": 100000,
    "scheduled_at": "2026-09-10T09:00:00.000Z",
    "scheduled_end": "2026-09-10T11:00:00.000Z"
  }
  ```
* **Mekanisme Escrow**: Saldo requester otomatis dipotong dan dikunci sebesar `budget_max * max_applicants`.

### GET `/api/tasks/nearby`
Mencari tugas mikro dalam radius terdekat menggunakan query geospasial PostGIS (`ST_DWithin`).
* **Query Params**: `lat` (latitude), `lng` (longitude), `radius` (meter, default 2000).

### GET `/api/tasks/scheduled`
🔒 **Authenticated** — Mengambil jadwal tugas terkonfirmasi pengguna untuk tampilan kalender `/schedule`.

### GET `/api/tasks/[id]`
Mengambil detail lengkap tugas, status pelamar, dan rincian penugasan.

### POST `/api/tasks/[id]/apply`
🔒 **Authenticated (Worker)** — Mengajukan lamaran pada tugas.
* **Payload**:
  ```json
  {
    "pesan": "Saya mahasiswa DKV, siap membawa kamera Sony A6400 dan lighting.",
    "bid_amount": 85000
  }
  ```

### GET `/api/tasks/[id]/bids`
🔒 **Authenticated (Requester)** — Melihat daftar seluruh penawaran sealed-bid dari pelamar.

### POST `/api/tasks/[id]/status`
🔒 **Authenticated** — Mengubah siklus status pengerjaan tugas (`start_work`, `submit_work`, `complete_task`, `cancel_task`).
* Saat `complete_task`: Dana escrow dicairkan ke dompet worker, +50 XP diberikan, dan status berubah ke `COMPLETED`.

---

## 4. Dompet Digital & Top-up Midtrans (`/api/wallet` & `/api/payment/*`)

### GET `/api/wallet`
🔒 **Authenticated** — Mengambil total saldo, saldo escrow yang sedang ditahan, dan riwayat mutasi transaksi.

### POST `/api/payment/create`
🔒 **Authenticated** — Membuat transaksi top-up saldo via Midtrans Snap.
* **Payload**: `{ "amount": 100000 }`
* **Response**: Mengembalikan `snap_token` dan `redirect_url` untuk pembayaran via QRIS, Virtual Account, atau GoPay.

### GET `/api/payment/status?order_id=...`
Memeriksa status pembayaran transaksi Midtrans.

### POST `/api/payment/webhook`
Webhook penerima notifikasi IPN (*Instant Payment Notification*) dari Midtrans.
* **Keamanan**: Validasi signature hash SHA-512 `(order_id + status_code + gross_amount + ServerKey)`.
* **Eksekusi**: Jika status `settlement`/`capture`, saldo user di-kreditkan otomatis dengan pencatatan `Transactions` (`tipe: MASUK`, `sub_type: topup`).

---

## 5. Gamifikasi & Peringkat (`/api/leaderboard` & `/api/xp`)

### GET `/api/leaderboard`
Mengambil peringkat pekerja terbaik berdasarkan skor pembobotan berimbang.
* **Query Params**: `period=weekly|monthly|alltime`, `limit=20`.
* **Formula**: `Score = (total_completed * 3) + (rating_avg * 20) + (xp * 0.1)`.

### GET `/api/xp`
🔒 **Authenticated** — Mengambil rincian XP, level, daily streak, dan badge pencapaian pengguna saat ini.

---

## 6. Galeri Portofolio & Unggah Media (`/api/portfolio` & `/api/upload`)

### GET `/api/portfolio?user_id=...`
Mengambil galeri hasil karya dan portofolio pekerja.

### POST `/api/portfolio`
🔒 **Authenticated** — Menambahkan item karya baru ke galeri profil.

### POST `/api/upload`
🔒 **Authenticated** — Mengunggah berkas gambar (JPG, PNG, WebP maks. 5MB) ke Supabase Storage Bucket dan menghasilkan Public URL.

---

## 7. Pusat Sengketa & Mediasi (`/api/disputes/*`)

### GET `/api/disputes`
🔒 **Authenticated** — Mengambil daftar sengketa aktif dan terselesaikan milik pengguna.

### POST `/api/disputes`
🔒 **Authenticated** — Membuka laporan sengketa baru untuk tugas yang bermasalah.
* **Payload**: `{ "id_task": "...", "reason": "Hasil pengerjaan tidak sesuai", "description": "..." }`

### GET `/api/disputes/[id]`
Mengambil detail sengketa, kronologi bukti (`evidences`), dan percakapan mediasi (`messages`).

### POST `/api/disputes/[id]/evidence`
🔒 **Authenticated** — Mengunggah dokumen/foto bukti sanggahan sengketa.

### POST `/api/disputes/[id]/messages`
🔒 **Authenticated** — Mengirim pesan dalam thread mediasi sengketa.

---

## 8. Tugas Tersimpan / Bookmark (`/api/saved-tasks`)

### GET `/api/saved-tasks`
🔒 **Authenticated** — Mengambil daftar tugas yang disimpan pengguna.

### POST `/api/saved-tasks`
🔒 **Authenticated** — Menambahkan atau mencabut bookmark tugas (`{ "id_tasks": "..." }`).

---

## 9. Komunikasi Chat & Ulasan (`/api/chat/*` & `/api/reviews`)

### GET `/api/chat` & POST `/api/chat`
Mengambil daftar percakapan aktif dan menginisiasi ruang obrolan per tugas penugasan.

### GET `/api/chat/[id]` & POST `/api/chat/[id]`
Mengambil riwayat pesan dan mengirim pesan teks/gambar baru.

### POST `/api/reviews`
🔒 **Authenticated** — Memberikan penilaian bintang 1–5 dan ulasan balik setelah tugas berstatus selesai.

---

## 10. Pengaduan Pengguna (`/api/reports`)

### POST `/api/reports`
🔒 **Authenticated** — Mengirimkan laporan kendala atau keluhan sistem ke konsol aduan admin `/admin/reports`.

---

## 11. Endpoint Konsol Admin (`/api/admin/*`)

🔒 **Admin Auth Guard Required (SHA-256 Admin Token Session)**

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/admin/auth/login` | `POST` | Login khusus portal admin, menetapkan hashed token sesi. |
| `/api/admin/auth/logout`| `POST` | Mengakhiri sesi admin. |
| `/api/admin/stats` | `GET` | Metrik 5 KPI utama dashboard. |
| `/api/admin/stats/trends` | `GET` | Data tren harian task dibuat vs selesai untuk Recharts. |
| `/api/admin/stats/status-distribution` | `GET` | Persentase sebaran status tugas real-time. |
| `/api/admin/users` | `GET` | Tabel pengguna terpaginasi dengan filter pencarian & role. |
| `/api/admin/users/[id]` | `PATCH` | Tindakan moderasi: Suspend permanen/sementara, Unban, Warning. |
| `/api/admin/tasks` | `GET` | Tabel pemantauan seluruh tugas. |
| `/api/admin/tasks/[id]` | `PATCH` | Take-down konten pelanggaran atau force completion. |
| `/api/admin/reports` | `GET` | Daftar seluruh tiket aduan laporan pengguna. |
| `/api/admin/reports/[id]` | `PATCH` | Memperbarui status aduan (`reviewed`, `resolved`, `rejected`). |
| `/api/admin/disputes` | `GET` | Daftar sengketa transaksi pengguna. |
| `/api/admin/disputes/[id]` | `PATCH` | Penetapan keputusan resolusi dana escrow (`favor_worker` / `favor_requester`). |
| `/api/admin/search` | `GET` | Pencarian instan debounced (`Ctrl+K`) data menu, user, task, kategori. |

---

## 12. Layanan Cron Scheduler (`/api/cron/*`)

### GET `/api/cron/schedule-reminder`
Dijalankan secara berkala oleh Vercel Cron (`cron: "0 * * * *"`) untuk memicu pengingat push FCM dan notifikasi in-app bagi tugas H-24 jam dan H-1 jam sebelum dimulai.

# API Reference — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan & Autentikasi

- **Framework**: Next.js 16 Route Handlers (`src/app/api/`)
- **Format**: JSON Request & Response
- **Base URL**: `http://localhost:3000/api` (dev) / `https://cepat-steel.vercel.app/api` (prod)
- **Otentikasi Pengguna**: Supabase Auth JWT — Header `Authorization: Bearer <token>` atau session cookie Supabase.
- **Otentikasi Admin**: Cookie `admin_token` yang divalidasi via hash SHA-256 pada tabel `AdminSession` (atau role `Admin` pada sesi login).
- **Validasi Data**: Menggunakan **Zod 4** (`src/lib/validations/` dan `src/lib/validations.ts`) dengan sanitasi input anti-XSS.

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
🔒 **Authenticated** — Mengambil profil mendalam pengguna yang sedang login beserta peran, keahlian, status banned, dan total balance.

---

## 3. Manajemen Tugas & Bidding (`/api/tasks/*`)

### GET `/api/tasks`
Mengambil daftar tugas mikro aktif dengan filter pagination (`page`, `limit`), kategori (`id_category`), dan pencarian kata kunci (`q`).

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

### GET `/api/tasks/feed`
Mengambil feed tugas dengan filter spasial radius PostGIS, kata kunci pencarian, kategori, pengurutan (`distance_asc`, `price_desc`, `price_asc`, `newest`), dan paginasi.
* **Query Params**: `lat`, `lng`, `radius` (meter, default 2000), `q`, `id_category`, `sort`, `page`, `limit`.

### GET `/api/tasks/nearby`
Pencarian cepat tugas mikro dalam radius terdekat menggunakan query geospasial PostGIS (`ST_DWithin`).
* **Query Params**: `lat`, `lng`, `radius` (meter, default 2000).

### GET `/api/tasks/scheduled`
🔒 **Authenticated** — Mengambil agenda tugas terkonfirmasi pengguna untuk tampilan kalender jadwal (`/schedule`).

### GET `/api/tasks/[id]`
Mengambil rincian lengkap tugas, data requester, status pengerjaan, pelamar, dan penugasan.

### DELETE `/api/tasks/[id]`
🔒 **Authenticated (Requester)** — Membatalkan tugas yang berstatus `open`. Sisa saldo escrow yang ditahan otomatis di-refund penuh ke dompet requester.

### POST `/api/tasks/[id]/apply` (atau POST `/api/tasks/apply`)
🔒 **Authenticated (Worker)** — Mengajukan lamaran pada tugas.
* **Payload**:
  ```json
  {
    "pesan": "Saya mahasiswa DKV, siap membawa kamera Sony A6400 dan lighting.",
    "bid_amount": 85000
  }
  ```

### DELETE `/api/tasks/[id]/apply`
🔒 **Authenticated (Worker)** — Membatalkan lamaran pekerjaan yang masih berstatus `pending`.

### GET `/api/tasks/[id]/bids`
🔒 **Authenticated (Requester)** — Melihat daftar seluruh penawaran sealed-bid dari pelamar yang masuk, terurut dari penawaran terendah.

### PATCH `/api/tasks/[id]/status`
🔒 **Authenticated** — Memperbarui status pengerjaan tugas (`start_work`, `submit_work`, `complete_task`, `cancel_task`).
* **Payload**: `{ "status": "start_work" | "submit_work" | "complete_task" | "cancel_task" }`
* Saat `complete_task`: Dana escrow dicairkan ke dompet worker (`task_earning`), +50 XP diberikan, daily streak diperbarui, dan status berubah ke `COMPLETED`.

### PATCH `/api/tasks/applicants/[id]`
🔒 **Authenticated (Requester)** — Menyetujui atau menolak pelamar tugas.
* **Payload**: `{ "action": "accept" | "reject", "alasan_penolakan": "..." }`
* **Model C Escrow Auto-Refund**: Jika tawaran worker diterima di bawah plafon `budget_max`, selisih dana `(budget_max - bid_amount)` seketika di-refund otomatis ke saldo dompet Requester, sedangkan nominal `bid_amount` tetap ditahan di escrow per slot (`held_slots_json`).

### GET `/api/tasks/applications/me`
🔒 **Authenticated (Worker)** — Mengambil riwayat seluruh tugas yang pernah dilamar oleh pengguna.

---

## 4. Dompet Digital, Escrow & Pembayaran Midtrans

Saldo pengguna dikelola melalui kombinasi endpoint points (saldo internal), escrow holding, dan gateway Midtrans Snap:

### GET `/api/points/balance`
🔒 **Authenticated** — Mengambil rincian saldo pengguna:
* `balance`: Saldo aktif yang dapat dibelanjakan (`total_balance - held_balance`).
* `held_balance`: Saldo yang sedang dikunci pada escrow tugas aktif.
* `total_balance`: Saldo fisik keseluruhan di akun.

### GET `/api/points/history`
🔒 **Authenticated** — Mengambil riwayat mutasi transaksi terpaginasi (`page`, `limit`) dengan jenis `MASUK` / `KELUAR` dan sub-tipe (`topup`, `task_earning`, `task_payment`, `refund`, `hold`).

### POST `/api/points/topup`
🔒 **Authenticated** — Simulasi pengisian saldo instan untuk keperluan pengujian dan demo cepat.
* **Payload**: `{ "amount": 100000 }`

### GET `/api/wallet/escrow`
🔒 **Authenticated** — Mengambil nominal total saldo escrow yang sedang dikunci pada tugas berjalan.

### POST `/api/payment/create`
🔒 **Authenticated** — Membuat transaksi top-up saldo via Midtrans Snap.
* **Payload**: `{ "amount": 100000 }`
* **Response**: Mengembalikan `snap_token` dan `redirect_url` untuk pembayaran via QRIS, Virtual Account bank, atau GoPay.

### GET `/api/payment/status?order_id=...`
Memeriksa status transaksi pembayaran Midtrans berdasarkan `order_id`.

### POST `/api/payment/webhook`
Webhook penerima notifikasi IPN (*Instant Payment Notification*) dari Midtrans.
* **Keamanan**: Validasi signature hash SHA-512 `(order_id + status_code + gross_amount + ServerKey)`.
* **Eksekusi**: Jika status `settlement` atau `capture`, saldo user dikreditkan otomatis (`tipe: MASUK`, `sub_type: topup`).

---

## 5. Notifikasi Pengguna (`/api/notifications/*`)

### GET `/api/notifications`
🔒 **Authenticated** — Mengambil 20 notifikasi terbaru milik pengguna beserta `unreadCount`.

### POST `/api/notifications`
🔒 **Authenticated** — Membuat entri notifikasi baru.

### PATCH `/api/notifications/[id]`
🔒 **Authenticated** — Menandai notifikasi tertentu sebagai terbaca (`is_read: true`).

### DELETE `/api/notifications/[id]`
🔒 **Authenticated** — Menghapus notifikasi tertentu.

### PATCH `/api/notifications/read-all`
🔒 **Authenticated** — Menandai seluruh notifikasi pengguna sebagai terbaca.

---

## 6. Gamifikasi, XP & Peringkat (`/api/leaderboard` & `/api/xp/*`)

### GET `/api/leaderboard`
Mengambil peringkat pekerja terbaik berdasarkan skor pembobotan berimbang:
$$\text{Score} = (\text{total\_completed} \times 3) + (\text{rating\_avg} \times 20) + (\text{xp} \times 0.1)$$
* **Query Params**: `period=current|last_month` (default `current`), `limit=20`.
* Mengembalikan daftar 20 besar pekerja terbaik serta peringkat pengguna yang sedang login (`currentUser`).

### GET `/api/xp/history`
🔒 **Authenticated** — Mengambil log perolehan XP terpaginasi (`page`, `limit`) beserta label sumber aktivitas (+50 XP tugas selesai, +25 XP rating 5★, +10 XP streak harian, +100 XP tugas pertama).

### GET `/api/xp/calendar`
🔒 **Authenticated** — Mengambil aktivitas kalender streak harian pengguna per bulan tertentu.
* **Query Params**: `year=2026`, `month=9`.

---

## 7. Galeri Portofolio & Unggah Media (`/api/portfolio` & `/api/upload`)

### GET `/api/portfolio?user_id=...`
Mengambil daftar galeri hasil karya portofolio publik seorang pekerja.

### POST `/api/portfolio`
🔒 **Authenticated** — Menambahkan karya baru ke galeri profil (`title`, `description`, `image_url`, `related_task`).

### DELETE `/api/portfolio?id=...`
🔒 **Authenticated** — Menghapus item karya portofolio milik pengguna.

### POST `/api/upload`
🔒 **Authenticated** — Mengunggah berkas gambar (JPG, PNG, WebP maks. 5MB) ke Supabase Storage Bucket `portfolios` dan menghasilkan Public URL. Dilengkapi validasi *magic bytes header* untuk keamanan.

---

## 8. Pusat Sengketa & Mediasi (`/api/disputes/*`)

### GET `/api/disputes`
🔒 **Authenticated** — Mengambil daftar berkas sengketa aktif dan terselesaikan di mana pengguna bertindak sebagai pelapor atau terlapor.

### POST `/api/disputes`
🔒 **Authenticated** — Membuka laporan sengketa baru untuk tugas berstatus `IN_PROGRESS` atau `COMPLETED`.
* **Payload**: `{ "id_task": "...", "reason": "Hasil tidak sesuai deskripsi", "description": "..." }`

### GET `/api/disputes/[id]`
Mengambil detail perkara sengketa, kronologi bukti (`evidences`), dan percakapan mediasi (`messages`).

### PATCH `/api/disputes/[id]`
🔒 **Admin Role Required** — Menetapkan putusan resmi sengketa dan resolusi dana escrow secara atomik.
* **Payload**:
  ```json
  {
    "resolution": "Pekerja telah menyelesaikan 100% instruksi kerja sesuai kesepakatan.",
    "favor": "WORKER"
  }
  ```
* Jika `favor: "WORKER"`: Dana escrow dicairkan ke worker (`task_earning`).
* Jika `favor: "REQUESTER"`: Dana escrow dikembalikan penuh ke requester (`refund`).

### POST `/api/disputes/[id]/evidence`
🔒 **Authenticated** — Mengunggah bukti teks atau tautan foto sanggahan sengketa (`type: "text" | "image"`, `content: "..."`).

### POST `/api/disputes/[id]/messages`
🔒 **Authenticated** — Mengirimkan pesan baru di dalam thread mediasi sengketa.

---

## 9. Tugas Tersimpan / Bookmark (`/api/saved-tasks/*`)

### GET `/api/saved-tasks`
🔒 **Authenticated** — Mengambil daftar seluruh tugas yang disimpan (di-bookmark) oleh pengguna.

### POST `/api/saved-tasks`
🔒 **Authenticated** — Menyimpan atau mencabut simpanan tugas secara toggle (`{ "id_tasks": "..." }`).

### GET `/api/saved-tasks/ids?ids=id1,id2,id3`
🔒 **Authenticated** — Memeriksa status bookmark secara bulk untuk array ID tugas yang ditampilkan pada feed/peta.

---

## 10. Komunikasi Chat & Ulasan (`/api/chat/*` & `/api/reviews/*`)

### GET `/api/chat`
🔒 **Authenticated** — Mengambil daftar seluruh kamar percakapan aktif yang melibatkan pengguna sebagai requester atau worker.

### POST `/api/chat/init`
🔒 **Authenticated** — Menginisiasi atau mengambil kamar obrolan untuk tugas dan pasangan pekerja tertentu.
* **Payload**: `{ "id_tasks": "uuid-task", "id_worker": "uuid-worker" }`

### GET `/api/chat/[roomId]`
🔒 **Authenticated** — Mengambil riwayat pesan dalam kamar obrolan tertentu.

### POST `/api/chat/[roomId]`
🔒 **Authenticated** — Mengirim pesan teks atau gambar baru ke dalam kamar obrolan.

### POST `/api/chat/action`
🔒 **Authenticated** — Melakukan aksi massal pada kamar obrolan:
* **Payload**: `{ "action": "mark_read" | "mark_unread" | "clear", "roomIds": ["..."] }`

### POST `/api/reviews`
🔒 **Authenticated** — Memberikan penilaian bintang 1–5 dan ulasan balik setelah tugas berstatus selesai.
* **Payload**: `{ "id_tasks": "...", "id_ratee": "...", "rating": 5, "comment": "Pengerjaan sangat cepat dan rapi." }`

### GET `/api/reviews/user/[id]`
Mengambil daftar ulasan yang diterima oleh pengguna tertentu (gunakan `[id] = "me"` untuk profil pengguna yang sedang login).

---

## 11. Pengaduan Pengguna, Master Data & Profil

### POST `/api/reports`
🔒 **Authenticated** — Mengirimkan laporan kendala atau keluhan sistem ke konsol aduan admin. Dilengkapi rate limit 3 laporan / 10 menit dan notifikasi push otomatis ke admin.

### GET `/api/categories` & POST `/api/categories`
* `GET`: Mengambil daftar master kategori tugas mikro publik.
* `POST` 🔒 **Admin**: Menambahkan master kategori baru (`nama_kategori`, `icon`).
* `PATCH /api/categories/[categoryId]` & `DELETE /api/categories/[categoryId]` 🔒 **Admin**: Memperbarui atau menghapus kategori.

### GET `/api/skills` & POST `/api/skills`
* `GET`: Mengambil daftar master keahlian publik.
* `POST` 🔒 **Admin**: Menambahkan master keahlian baru (`nama_skill`, `icon`).
* `PATCH /api/skills/[skillId]` & `DELETE /api/skills/[skillId]` 🔒 **Admin**: Memperbarui atau menghapus keahlian.

### GET `/api/roles`
Mengambil daftar master peran (`Requester`, `Worker`, `Admin`).

### GET `/api/health`
Health check & keep-alive endpoint untuk verifikasi koneksi basis data Supabase PostgreSQL.

### Pengelolaan Profil User (`/api/users/*`)
* `GET /api/users/me` & `PATCH /api/users/me`: Mengambil & memperbarui profil lengkap, auto-unban check, dan pembaruan token FCM.
* `POST /api/users/ping`: Pembaruan timestamp `last_seen_at` (presence tracker).
* `PATCH /api/users/avatar`: Memperbarui tautan avatar pengguna.
* `GET /api/users/[id]`: Mengambil profil publik pengguna berdasarkan ID.
* `GET /api/users/skills` & `POST /api/users/skills`: Mengambil dan menyinkronkan keahlian yang dipilih pengguna.

---

## 12. Endpoint Konsol Admin (`/api/admin/*`)

🔒 **Admin Auth Guard Required (SHA-256 Token Session / Role Admin)**

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/admin/auth/login` | `POST` | Portal login khusus admin, menetapkan cookie `admin_token` ter-hash SHA-256. |
| `/api/admin/auth/logout`| `POST` | Mengakhiri sesi admin aktif. |
| `/api/admin/auth/me` | `GET` | Memeriksa validitas sesi admin yang sedang login. |
| `/api/admin/stats` | `GET` | Metrik 5 KPI utama dashboard (Users, Tasks, Active, Revenue, Completion). |
| `/api/admin/stats/trends` | `GET` | Data tren harian task dibuat vs selesai untuk diagram Recharts. |
| `/api/admin/stats/status-distribution` | `GET` | Persentase sebaran status tugas real-time. |
| `/api/admin/users` | `GET` | Tabel pengguna terpaginasi dengan filter pencarian & status banned. |
| `/api/admin/users/[userId]` | `GET` | Mengambil detail profil mendalam pengguna. |
| `/api/admin/users/[userId]/suspend` | `POST` | Menangguhkan akun (`type: "PERMANENT" \| "TEMPORARY"`, durasi hari, alasan ban). |
| `/api/admin/users/[userId]/unsuspend` | `POST` | Mencabut status penangguhan akun secara manual. |
| `/api/admin/users/[userId]/warning` | `POST` | Mengirimkan surat peringatan resmi ke notifikasi pengguna. |
| `/api/admin/users/[userId]/reset-password` | `POST` | Memicu email instruksi pembaruan kata sandi. |
| `/api/admin/tasks` | `GET` | Tabel pemantauan seluruh tugas di sistem. |
| `/api/admin/tasks/[taskId]` | `GET` | Mengambil detail penugasan dan daftar pelamar tugas. |
| `/api/admin/tasks/[taskId]/takedown` | `POST` | Take-down konten pelanggaran darurat dengan auto-refund sisa escrow ke requester. |
| `/api/admin/tasks/[taskId]/force-complete` | `POST` | Penyelesaian paksa tugas oleh pengurus platform. |
| `/api/admin/reports` | `GET` | Daftar tiket pengaduan laporan pengguna. |
| `/api/admin/reports/[reportId]` | `PATCH` | Memperbarui status aduan (`pending`, `reviewed`, `resolved`, `rejected`). |
| `/api/admin/disputes` | `GET` | Daftar seluruh perkara sengketa transaksi pengguna. |
| `/api/admin/notifications` | `GET` & `PATCH` | Sinkronisasi bell counter notifikasi aduan admin dan mark as read. |
| `/api/admin/search` | `GET` | Pencarian instan debounced (`Ctrl+K`) pada menu, user, task, dan kategori. |

---

## 13. Layanan Cron Scheduler (`/api/cron/*`)

### GET `/api/cron/schedule-reminder`
Dijalankan secara berkala oleh scheduler untuk mendeteksi tugas dengan waktu mulai dalam rentang H-24 jam dan H-1 jam, lalu mengirim notifikasi push FCM dan notifikasi in-app kepada kedua belah pihak.

### GET `/api/cron/notifications`
Endpoint cron berkala yang dilindungi header `Authorization: Bearer <CRON_SECRET>` untuk menjalankan tugas pemeliharaan otomatis:
1. **Review Reminder**: Mengingatkan pengguna yang belum memberikan review setelah 24 jam task berstatus `COMPLETED`.
2. **Unfilled Task Alert**: Mengingatkan requester jika tugas belum mendapatkan pelamar setelah 24 jam dibuka.
3. **Low Balance Warning**: Peringatan saldo rendah bagi requester yang memiliki tugas aktif.

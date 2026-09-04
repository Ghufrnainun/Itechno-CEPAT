# Fitur — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan Produk

**CEPAT (Cari Entry Pekerjaan Area Terdekat)** adalah platform *hyperlocal micro-freelancing & skill exchange* berbasis lokasi untuk mahasiswa dan UMKM lokal perkotaan. Pengguna dapat memposting dan mengambil tugas mikro (*micro-tasks*) dadakan dalam radius terdekat (default ≤ 2 km) dengan jaminan keamanan pembayaran melalui sistem dompet escrow terintegrasi.

* **SDG 8 (Pekerjaan Layak dan Pertumbuhan Ekonomi)**: Membuka akses peluang kerja sampingan yang fleksibel bagi mahasiswa tanpa mengganggu jadwal kuliah, sekaligus menyediakan bantuan tenaga operasional cepat dan terjangkau bagi UMKM lokal.
* **Unified Dual-Role Account**: Satu akun pengguna dapat bertindak fleksibel sebagai **Pemberi Tugas (Requester)** maupun **Pengerja Tugas (Worker)** tanpa memerlukan akun terpisah.

---

## 2. Matriks Fitur Lengkap

### 2.1 🔐 Autentikasi, Akun & Profil Terpadu

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Register & Login** | Autentikasi email + password via Supabase Auth terpetakan ke tabel `User.auth_id`. Validasi input ketat dengan pemblokiran 100+ domain email sementara/disposable. | ✅ Aktif |
| **Onboarding & Profil** | Konfigurasi avatar, bio, nomor WhatsApp/telepon, institusi/universitas, dan seleksi master skills. | ✅ Aktif |
| **Dual-Role Switching** | Pengguna dapat berganti peran secara dinamis antara Requester dan Worker di antarmuka utama. | ✅ Aktif |
| **Keamanan Penangguhan (Ban Guard)** | Pemeriksaan status `is_banned` secara otomatis pada middleware `proxy.ts`. Mendukung penangguhan Permanen dan Sementara (*Temporary*) dengan mekanisme *Auto-Unban* saat durasi penangguhan berakhir. | ✅ Aktif |

---

### 2.2 📍 Geolokasi & Peta Penemuan Tugas (`/cari-tugas`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **GPS Auto-Detect** | Deteksi otomatis koordinat lintang/bujur pengguna melalui Browser Geolocation API. | ✅ Aktif |
| **Pencarian Radius Spasial** | Query geospasial PostgreSQL PostGIS (`ST_DWithin`) untuk memfilter tugas mikro dalam radius default 2000 meter. | ✅ Aktif |
| **Peta Interaktif Leaflet** | Peta interaktif berbasis Leaflet.js dan tile OpenStreetMap dengan marker dinamis, radius circle, dan pop-up ringkasan tugas. | ✅ Aktif |
| **Pin Lokasi Manual** | Dukungan penyesuaian posisi secara manual saat membuat tugas untuk memastikan akurasi lokasi indoor. | ✅ Aktif |
| **Filter & Pengurutan** | Penyaringan berdasarkan kategori keahlian, jarak terdekat, kompensasi tertinggi, dan mode bidding. | ✅ Aktif |

---

### 2.3 💼 Manajemen Tugas & Sistem Bidding Tertutup

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Posting Tugas (Fixed Price)** | Requester menentukan kompensasi pasti per pekerja. Escrow mengunci dana sebesar `kompensasi * max_applicants`. | ✅ Aktif |
| **Mode Bidding (Sealed-Bid)** | Requester menentukan rentang budget (`budget_min` – `budget_max`). Escrow mengunci plafon maksimal `budget_max * max_applicants`. | ✅ Aktif |
| **Pengajuan Penawaran Worker** | Worker mengajukan harga penawaran kustom (`bid_amount`) dan pesan lamaran. Tawaran bersifat tertutup (hanya dilihat requester). Worker dapat memperbarui nominal tawaran sebelum disetujui. | ✅ Aktif |
| **Model C Escrow Auto-Refund** | Saat Requester menyetujui worker dengan tawaran `bid_amount` di bawah plafon `budget_max`, selisih dana `(budget_max - bid_amount)` **langsung dikembalikan seketika** ke dompet Requester, dan sisa nominal tetap ditahan di escrow per slot (`held_slots_json`). | ✅ Aktif |
| **Multi-Worker Slots** | Mendukung kebutuhan banyak pekerja dalam satu tugas dengan pelacakan kuota slot yang terisi. | ✅ Aktif |
| **Batas Percobaan Melamar** | Pembatasan kuota melamar (maks. 3x) untuk mencegah spamming proposal oleh akun yang sama. | ✅ Aktif |
| **Bukti Pengerjaan (Work Proof)** | Worker mengunggah catatan dan foto hasil kerja sebelum meminta persetujuan penyelesaian. | ✅ Aktif |
| **Konfirmasi & Escrow Release** | Requester menyetujui hasil kerja ➔ dana escrow otomatis ditransfer ke dompet pengerja, memicu pemberian XP dan evaluasi ulasan. | ✅ Aktif |

---

### 2.4 📅 Penjadwalan Tugas & Cron Reminder (`/schedule`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Penjadwalan Waktu** | Requester dapat menentukan tanggal & jam mulai (`scheduled_at`) serta estimasi selesai (`scheduled_end`). | ✅ Aktif |
| **Tampilan Kalender & Timeline** | Halaman `/schedule` menampilkan kalender penugasan bulanan/mingguan bagi worker dan requester. | ✅ Aktif |
| **Automated Cron Reminders** | Endpoint `/api/cron/schedule-reminder` dieksekusi berkala (Vercel Cron) untuk mengirim push notif pengingat H-24 jam dan H-1 jam sebelum jadwal dimulai. | ✅ Aktif |

---

### 2.5 🏆 Gamifikasi, Reputasi & Leaderboard (`/leaderboard`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Sistem XP & Leveling** | Formula level otomatis: `Level = floor(sqrt(XP / 100)) + 1`. XP bertambah saat menyelesaikan tugas (+50 XP), menerima rating 5★ (+25 XP), dan streak harian (+10 XP). | ✅ Aktif |
| **Daily Streak Tracker** | Pelacakan login dan pengerjaan beruntun harian (`UserStreak`) untuk mendorong keterlibatan pengguna secara konsisten. | ✅ Aktif |
| **Badges & Pencapaian** | Sistem pencapaian otomatis (`Badge` & `UserBadge`) untuk milestone tugas, rating, dan pendapatan. | ✅ Aktif |
| **Peringkat Leaderboard** | Peringkat pekerja terbaik berdasarkan skor pembobotan dinamis: `(total_completed * 3) + (rating_avg * 20) + (xp * 0.1)`. Mendukung filter mingguan, bulanan, dan sepanjang waktu. | ✅ Aktif |
| **Rating & Ulasan Mutual** | Penilaian bintang 1–5 dua arah disertai komentar dan bukti foto hasil kerja. | ✅ Aktif |

---

### 2.6 ⭐ Portofolio Pekerja & Showcase (`/profile/[id]`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Galeri Portofolio Publik** | Tab khusus di profil worker untuk menampilkan galeri karya (`PortfolioItem`) dengan preview lightbox dan deskripsi teknis. | ✅ Aktif |
| **Upload Media Terproteksi** | Unggah gambar hasil kerja terintegrasi langsung dengan Supabase Storage via `/api/upload`. | ✅ Aktif |
| **Skill Verification Badge** | Badge verifikasi keahlian khusus bagi pekerja yang telah memvalidasi kompetensi. | ✅ Aktif |

---

### 2.7 🛡️ Pusat Sengketa & Mediasi (`/disputes`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Pembukaan Sengketa** | Pihak yang berselisih pada tugas `IN_PROGRESS` atau `COMPLETED` dapat membuka berkas sengketa resmi. | ✅ Aktif |
| **Unggah Bukti Sengketa** | Pengunggahan bukti kronologis berupa pesan teks dan tangkapan layar bukti pengerjaan (`DisputeEvidence`). | ✅ Aktif |
| **Ruang Pesan Mediasi** | Thread komunikasi khusus antara pelapor, terlapor, dan moderator admin (`DisputeMessage`). | ✅ Aktif |
| **Resolusi Finansial Admin** | Admin menetapkan keputusan: `RESOLVED_FAVOR_WORKER` (dana escrow diteruskan ke worker) atau `RESOLVED_FAVOR_REQUESTER` (dana escrow dikembalikan penuh ke requester). | ✅ Aktif |

---

### 2.8 💰 Dompet Digital, Escrow & Pembayaran Midtrans (`/wallet`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Saldo Dompet Internal** | Pemisahan saldo tersedia (*usable balance*) dan saldo terkunci (*held escrow balance*). | ✅ Aktif |
| **Integrasi Midtrans Snap** | Pengisian saldo instan (*top-up*) melalui QRIS, Virtual Account bank, dan e-Wallet dengan callback otomatis. | ✅ Aktif |
| **Webhook Signature SHA-512** | Validasi keamanan webhook Midtrans menggunakan hashing SHA-512 sebelum memutasi saldo akun. | ✅ Aktif |
| **Riwayat Transaksi Terperinci** | Log pencatatan transaksi (`Transactions`) mencakup sub-tipe: `topup`, `hold`, `task_payment`, `task_earning`, dan `refund`. | ✅ Aktif |

---

### 2.9 💬 Komunikasi Obrolan Real-time (`/chat`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Kamar Obrolan Terisolasi** | Kamar chat direct message per penugasan antara requester dan worker (`ChatRoom`). | ✅ Aktif |
| **Realtime Channel Streaming** | Pengiriman pesan instan, status terbaca (*read receipts*), dan notifikasi suara/visual melalui Supabase Realtime Channels. | ✅ Aktif |
| **Dukungan Media & Emoji** | Berbagi gambar tugas dan picker emoji bawaan (`emoji-picker-react`). | ✅ Aktif |

---

### 2.10 🔖 Tugas Tersimpan / Bookmarks (`/saved`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Bookmark Tugas** | Menyimpan tugas favorit untuk ditinjau atau dilamar di lain waktu (`SavedTask`). | ✅ Aktif |

---

### 2.11 🚩 Konsol Tata Kelola & Laporan Admin (`/admin/*`)

| Fitur | Deskripsi Teknis | Status |
|---|---|---|
| **Admin Overview & Analitik** | KPI Cards real-time, grafik tren harian pengerjaan, dan visualisasi distribusi status task (Recharts). | ✅ Aktif |
| **Manajemen & Moderasi Pengguna** | Pencarian cepat, slide-over drawer, penangguhan akun permanen/sementara dengan alasan ban, unban instan, dan surat peringatan resmi. | ✅ Aktif |
| **Moderasi Tugas** | Filter status tugas, inspeksi detail radius spasial, take-down konten tidak pantas, dan penyelesaian paksa. | ✅ Aktif |
| **Manajemen Laporan Pengguna (`/admin/reports`)** | Konsol pengaduan pengguna terhubung dengan tombol "Laporkan Masalah", pembaruan status aduan, dan navigasi direct URL (`?id=...`). | ✅ Aktif |
| **Mediasi Sengketa (`/admin/disputes`)** | Panel kontrol perselisihan untuk penentuan keputusan resolusi escrow secara adil. | ✅ Aktif |
| **Global Search Bar (`Ctrl + K`)** | Pencarian instan (debounced) di seluruh data menu, pengguna, tugas, dan kategori. | ✅ Aktif |
| **Notifikasi Real-time FCM Admin** | Bell counter notifikasi laporan masuk yang terhubung dengan listener push notification Firebase FCM. | ✅ Aktif |

# Fitur — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan Produk

**CEPAT (Cari Entry Pekerjaan Area Terdekat)** adalah platform micro-freelancing & skill exchange berbasis lokasi untuk mahasiswa dan UMKM lokal perkotaan. User bisa posting atau mengambil micro-task dadakan dalam radius terdekat (maks. 2 km).

**SDG 8** — Pekerjaan Layak dan Pertumbuhan Ekonomi: membuka akses penghasilan fleksibel bagi mahasiswa tanpa terikat jam kerja tetap, sekaligus membantu UMKM mendapatkan tenaga bantuan cepat.

---

## 2. Dua Peran Utama

| Peran              | Deskripsi                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| **Requester**      | Pemberi tugas — posting task, pilih worker, konfirmasi selesai, kasih rating    |
| **Worker**         | Pengerja — browse task terdekat, apply/accept, kerjakan, terima kompensasi      |

Satu akun bisa berperan sebagai Requester sekaligus Worker (dual-role).

---

## 3. Fitur Inti (MVP — Babak Penyisihan)

### 3.1 🔐 Autentikasi & Profil

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Register / Login          | Email + password via Supabase Auth. Opsi OAuth Google.         | P0        |
| Profil User               | Nama, foto, bio, daftar skill (tag), universitas/instansi      | P0        |
| Dual-role toggle          | User bisa switch mode Requester ↔ Worker di satu akun          | P0        |
| Edit Profil               | Update info personal, skill tags, foto profil                  | P1        |

### 3.2 📋 Manajemen Task (Requester Side)

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Create Task               | Form: judul, deskripsi, kategori skill, lokasi, estimasi waktu, kompensasi (poin) | P0 |
| Auto-geolocation          | Lokasi task otomatis dari GPS browser, bisa juga pin manual di map | P0     |
| Task Status Tracking      | Requester lihat status: open → accepted → in_progress → completed | P0     |
| Pilih Worker              | Dari daftar applicant, requester pilih siapa yang dikerjakan. Alternatif: auto-assign first-accept | P1 |
| Konfirmasi Selesai        | Requester konfirmasi task selesai → trigger transfer poin + rating | P0    |
| Cancel Task               | Requester bisa cancel task selama belum di-accept              | P1        |

### 3.3 🔍 Feed & Discovery (Worker Side)

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Feed Task Terdekat        | List view task yang ada dalam radius (default 2km)             | P0        |
| Map View                  | Peta Leaflet + OpenStreetMap dengan marker task terdekat        | P0        |
| Filter & Sort             | Filter by: kategori skill, kompensasi min, jarak. Sort by: terbaru, terdekat, kompensasi tertinggi | P1 |
| Apply / Accept Task       | Worker klik apply → masuk antrian / langsung accept            | P0        |
| Update Status             | Worker update: accepted → in_progress → selesai               | P0        |

### 3.4 📍 Geolocation & Radius

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| GPS Auto-detect           | Browser Geolocation API untuk ambil posisi user                | P0        |
| Radius Search             | PostGIS `ST_DWithin` query — default 2km, adjustable           | P0        |
| Map Interaktif            | Leaflet.js dengan tile OpenStreetMap, marker task, radius circle | P0      |
| Pin Manual                | User bisa geser pin di map jika GPS tidak akurat               | P1        |

### 3.5 ⭐ Rating & Reputasi

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Rating post-task          | Setelah task selesai, kedua pihak saling kasih rating (1-5 ⭐)  | P0       |
| Review text (opsional)    | Komentar singkat opsional saat kasih rating                    | P1        |
| Skor reputasi             | Rata-rata rating ditampilkan di profil                         | P0        |
| Badge / Level (opsional)  | Gamification: badge untuk milestone tertentu                   | P2        |

### 3.6 💰 Sistem Kompensasi (Poin Internal)

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Poin sebagai mata uang    | Requester set kompensasi dalam poin. Worker terima poin setelah task selesai | P0 |
| Saldo poin                | Tampilkan saldo poin user di dashboard/profil                  | P0        |
| Histori transaksi         | Log keluar-masuk poin per task                                 | P1        |
| Top-up poin (mock)        | Simulasi top-up poin untuk demo (bukan payment gateway riil)   | P1        |

> **Catatan**: Untuk MVP/penyisihan, gunakan sistem poin internal. Tidak perlu integrasi payment gateway riil.

### 3.7 🔔 Notifikasi

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Realtime in-app           | Supabase Realtime — notif saat task di-apply, di-accept, selesai | P0      |
| Push notification         | FCM — notif bahkan saat tab tidak terbuka                      | P1        |
| Notification center       | Halaman list semua notifikasi + status read/unread             | P1        |

### 3.8 📜 Histori Task

| Fitur                     | Deskripsi                                                      | Prioritas |
| ------------------------- | -------------------------------------------------------------- | --------- |
| Histori sebagai Requester | Daftar task yang pernah diposting + statusnya                  | P0        |
| Histori sebagai Worker    | Daftar task yang pernah dikerjakan + rating yang didapat       | P0        |

---

## 4. Fitur Tambahan (Nice-to-Have / Post-MVP)

| Fitur                        | Deskripsi                                                   | Prioritas |
| ---------------------------- | ----------------------------------------------------------- | --------- |
| Chat antar user              | Direct message Requester ↔ Worker untuk koordinasi          | P2        |
| Kategori skill marketplace   | Halaman browse semua kategori skill yang tersedia            | P2        |
| Search task by keyword       | Full-text search di judul + deskripsi task                   | P2        |
| Skill exchange (barter)      | Mode khusus: tukar skill tanpa poin (saya bantu X, kamu bantu Y) | P2   |
| Laporan & moderasi           | User bisa report task/user yang mencurigakan                 | P2        |
| Admin dashboard              | Panel untuk moderator/admin kelola user & task               | P2        |
| Dark mode                    | Toggle tema gelap/terang                                     | P2        |
| Multi-bahasa (i18n)          | Support Bahasa Indonesia + English                           | P3        |

---

## 5. Prioritas Legend

| Label | Makna                                              |
| ----- | -------------------------------------------------- |
| P0    | **Must have** — wajib ada di MVP penyisihan        |
| P1    | **Should have** — sangat direkomendasikan          |
| P2    | **Nice to have** — jika waktu memungkinkan         |
| P3    | **Future** — setelah kompetisi / iterasi berikutnya |

---

## 6. Kategori Skill (Contoh Awal)

Kategori yang bisa dipilih saat posting task:

- 📸 Fotografi & Videografi
- 💻 Data Entry & Administrasi
- 🎨 Desain Grafis
- ✍️ Penulisan & Konten
- 📦 Jaga Booth / Event Helper
- 🚚 Kurir / Antar Barang
- 🔧 Teknis (IT support, setup perangkat)
- 📱 Social Media Management
- 📊 Riset & Survei
- 🎓 Tutoring / Les Privat
- 🧹 Kebersihan & Penataan
- 🛒 Belanja / Titip Beli

---

## 7. User Flow Ringkas

```
┌─ REQUESTER ──────────────────────────────────────────┐
│ Register → Login → Create Task (+ lokasi + poin)     │
│   → Tunggu applicant → Pilih worker → Track progress │
│   → Konfirmasi selesai → Kasih rating → Done         │
└──────────────────────────────────────────────────────┘

┌─ WORKER ─────────────────────────────────────────────┐
│ Register → Login → Isi profil skill                  │
│   → Buka feed (list/map) → Filter → Apply/Accept     │
│   → Kerjakan → Update status → Terima poin + rating  │
└──────────────────────────────────────────────────────┘
```

## 8. Catatan untuk AI Agent

- Saat generate komponen, selalu pertimbangkan **dual-role** (satu user bisa Requester & Worker).
- Task status flow yang valid: `draft → open → accepted → in_progress → completed → cancelled`. Cancelled hanya dari `open` atau `accepted`.
- Setiap fitur P0 harus fungsional untuk demo penyisihan.
- Geo-related features (map, radius, pin) adalah **pembeda utama** — harus bekerja dengan baik dan terlihat impressive di demo.

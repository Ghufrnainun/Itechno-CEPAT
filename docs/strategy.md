# Strategi Kompetisi — KerjaMicro × ITechno Cup 2026

## 1. Fokus Penilaian & Strategi

### Babak Penyisihan (Total 100%)

| Aspek                         | Bobot | Strategi Kita                                                                                                                                               |
| ----------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kesesuaian Tema & Subtema** | 20%   | Narasi SDG 8 harus kuat di README & landing page. Jelaskan koneksi langsung ke pekerjaan layak + pertumbuhan ekonomi                                        |
| **Inovasi & Orisinalitas**    | 20%   | Pembeda utama: **geo-based micro-tasking** + radius real-time + skill exchange. Belum banyak platform serupa di Indonesia yang fokus mahasiswa + UMKM lokal |
| **Fungsionalitas Website**    | 20%   | Semua fitur P0 harus berjalan end-to-end tanpa error. Demo scenario: post task → accept → complete → rating                                                 |
| **UI/UX & Responsivitas**     | 15%   | PWA mobile-first, animasi smooth, map interaktif, skeleton loading. Harus terlihat polished                                                                 |
| **Implementasi Teknologi**    | 15%   | PostGIS geo-query, Supabase Realtime, FCM push, PWA — tunjukkan teknologi canggih yang dipilih dengan alasan kuat                                           |
| **Dokumentasi & Repositori**  | 10%   | README sesuai template resmi, kode terorganisir, comments jelas                                                                                             |

> **Insight**: Tema+Subtema & Inovasi = 40% total. Narasi SDG & diferensiasi harus dipersiapkan sejak awal, bukan ditempel belakangan.

### Babak Final (Jika lolos 10 besar)

| Aspek                          | Bobot | Persiapan                                        |
| ------------------------------ | ----- | ------------------------------------------------ |
| **Presentasi & Pitching**      | 25%   | Slide ringkas, storytelling kuat, data pendukung |
| **Live Demo & Fungsionalitas** | 25%   | Demo seamless, skenario realistis, fallback plan |
| **Inovasi & Dampak Solusi**    | 20%   | Tunjukkan impact nyata, data/proyeksi penggunaan |
| **Aspek Teknis & Teknologi**   | 20%   | Jelaskan arsitektur, tech choices, scalability   |
| **Tanya Jawab Dengan Juri**    | 10%   | Siapkan FAQ internal, latihan jawab spontan      |

---

## 2. Narasi SDG 8

### Pekerjaan Layak

- KerjaMicro membuka **akses pekerjaan fleksibel** bagi mahasiswa yang tidak bisa kerja part-time terikat.
- Micro-task berbasis lokasi = **pekerjaan inklusif**, tidak perlu transportasi jauh.
- Sistem rating & reputasi = membangun **track record kerja** sejak masih kuliah.

### Pertumbuhan Ekonomi

- UMKM lokal mendapat **akses tenaga kerja on-demand** tanpa biaya rekrutmen mahal.
- Sirkulasi ekonomi lokal: poin/kompensasi berputar di **ekosistem komunitas kampus & UMKM sekitar**.
- Mengurangi **mismatch** antara kebutuhan UMKM dadakan dan ketersediaan tenaga mahasiswa.

### Data Pendukung (untuk README & Presentasi)

- BPS 2024: pengangguran terbuka lulusan perguruan tinggi ~7.9%
- Survei IDN Times: 73% mahasiswa ingin punya penghasilan tambahan tapi terhalang jadwal kuliah
- UMKM menyerap 97% tenaga kerja nasional — tapi sulit rekrut bantuan short-term
- Gig economy global diproyeksikan tumbuh $455B di 2030 (Mastercard)

> **Catatan**: Angka-angka di atas perlu diverifikasi & di-update dengan sumber terbaru sebelum submission.

---

## 3. Diferensiasi dari Kompetitor

| Platform Existing    | Kelemahan                                   | Keunggulan KerjaMicro                     |
| -------------------- | ------------------------------------------- | ----------------------------------------- |
| Sribulancer/Fastwork | Fokus freelance jangka panjang, bukan micro | Micro-task dadakan, bisa selesai < 1 hari |
| Fiverr/Upwork        | Global, mahal, tidak location-based         | Lokal, radius 2km, gratis                 |
| Grab/GoJek Tasks     | Fokus delivery, bukan skill-based           | Skill exchange, kategori beragam          |
| Grup WA kampus       | Tidak terstruktur, tidak ada trust system   | Rating, reputasi, status tracking         |

**Unique Selling Point (USP)**:

1. **Hyper-local** — radius GPS terdekat, bukan sekadar filter kota
2. **Dual-purpose** — micro-freelancing + skill barter
3. **Trust system** — rating mutual, histori transparan
4. **Mahasiswa-centric** — flow & UX disesuaikan kehidupan kampus

---

## 4. Demo Scenario (Untuk Penyisihan & Final)

### Skenario 1: "UMKM Butuh Foto Produk"

```
1. [Requester] Bu Ani, pemilik toko kue di dekat kampus, login
2. [Requester] Post task: "Foto 20 produk kue untuk Instagram"
   - Kategori: Fotografi
   - Lokasi: auto-detect (pin di map)
   - Estimasi: 2 jam
   - Kompensasi: 50 poin
3. [Worker] Andi, mahasiswa DKV, buka app → lihat task di map view
   - Jarak: 0.8 km → bisa jalan kaki
4. [Worker] Andi klik "Apply" + kirim pesan
5. [Requester] Bu Ani terima notifikasi, lihat profil Andi (rating 4.8, skill: fotografi)
6. [Requester] Accept Andi → Andi dapat notif push
7. [Worker] Andi datang, foto produk, update status "In Progress" → "Selesai"
8. [Requester] Bu Ani konfirmasi selesai → 50 poin transfer ke Andi
9. [Kedua pihak] Saling kasih rating ⭐⭐⭐⭐⭐
```

### Skenario 2: "Skill Exchange Antar Mahasiswa"

```
1. [Requester] Budi butuh bantuan desain poster acara kampus
   - Kompensasi: 30 poin
2. [Worker] Citra, mahasiswa desain, accept task
3. Setelah selesai, Citra juga posting task: "Butuh bantuan compile data survei"
4. Budi yang punya skill data entry, accept task Citra
→ Skill exchange ecosystem terbentuk secara natural
```

---

## 5. Risiko & Mitigasi

| Risiko                                    | Mitigasi                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| Geolocation tidak akurat di indoor        | Fallback: pin manual di map + text alamat              |
| User base awal sedikit (cold start)       | Seed data: dummy tasks untuk demo, ajak teman uji coba |
| Penyalahgunaan task (konten tidak pantas) | Kategori terbatas, report button, moderasi (P2)        |
| FCM tidak work di beberapa browser        | Fallback: in-app notification via Supabase Realtime    |
| Supabase free tier limit                  | Monitor usage, cukup untuk kompetisi                   |

---

## 6. Timeline Internal Tim

| Minggu | Target                                            | PIC                |
| ------ | ------------------------------------------------- | ------------------ |
| W1     | Setup project, DB schema, auth flow, profil       | All                |
| W2     | Task CRUD, geo-query, map view, feed              | Backend + Frontend |
| W3     | Apply/accept flow, status tracking, notifikasi    | Backend + Frontend |
| W4     | Rating, poin, PWA setup, FCM                      | All                |
| W5     | UI polish, responsivitas, animasi, testing        | Frontend + DevOps  |
| W6     | README, dokumentasi, deploy production, rehearsal | DevOps + All       |
| Buffer | Bug fixes, edge cases, demo rehearsal             | All                |

> **Deadline submit**: Minggu, 6 September 2026, 23.59 WIB

---

## 7. Catatan untuk AI Agent

- Saat generate README, pastikan narasi SDG 8 ada di bagian "Latar Belakang" dengan kuat.
- Saat generate landing page, tampilkan USP dan koneksi SDG 8 secara visual.
- Fitur geo/map harus ditonjolkan di demo karena itu **pembeda utama**.
- Selalu siapkan fallback (pin manual) untuk setiap fitur yang bergantung pada browser API.
- Jika diminta buat slide presentasi, ikuti format: Masalah → Solusi → Demo → Tech → Dampak → Tim.

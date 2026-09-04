# Strategi Kompetisi — CEPAT × ITechno Cup 2026

## 1. Fokus Penilaian & Eksekusi Strategis

### Babak Penyisihan (Total 100%)

| Aspek | Bobot | Strategi Keunggulan CEPAT |
|---|---|---|
| **Kesesuaian Tema & Subtema** | 20% | Penyelarasan kuat dengan **SDG 8 (Pekerjaan Layak dan Pertumbuhan Ekonomi)**. Menjawab tantangan riil mahasiswa (kebutuhan penghasilan fleksibel tanpa terikat) dan UMKM lokal (bantuan tugas mikro cepat dan terjangkau). |
| **Inovasi & Orisinalitas Ide** | 20% | Keunggulan utama: **Hyperlocal radius search (PostGIS)** + **Model C Escrow Auto-Refund** pada sistem lelang tertutup (*Sealed-Bid*) + **Dispute Resolution Center** terpadu. |
| **Fungsionalitas Website** | 20% | Alur end-to-end tanpa error: Penemuan peta geospasial, penawaran bidding, chat realtime, pengerjaan, pelepasan escrow otomatis, hingga gamifikasi dan ulasan mutual. |
| **UI/UX & Responsivitas** | 15% | Desain *mobile-first standalone PWA*, antarmuka peta interaktif Leaflet, animasi halus berbasis Motion/GSAP, dan tata letak konsisten anti-AI slop. |
| **Implementasi Teknologi** | 15% | Arsitektur modern: Next.js 16 App Router, React 19, Prisma ORM 7, PostgreSQL PostGIS, Supabase Realtime Channels, Firebase Cloud Messaging (FCM), dan Midtrans Snap. |
| **Dokumentasi & Repositori** | 10% | Struktur kode rapi dan modular, kepatuhan dokumentasi etika AI, serta kelengkapan spesifikasi API dan skema basis data di `/docs`. |

---

## 2. Narasi SDG 8: Pekerjaan Layak & Pertumbuhan Ekonomi Lokal

### 2.1 Pekerjaan Layak (Decent Work)
- **Akses Fleksibel**: Mahasiswa dapat memilih pekerjaan mikro sesuai ketersediaan waktu luang di sela jadwal perkuliahan yang dinamis.
- **Inklusivitas Berbasis Jarak**: Radius terdekat (≤ 2 km) memastikan pekerjaan dapat diakses dengan berjalan kaki atau transportasi ringan tanpa biaya mobilitas tinggi.
- **Track Record Terverifikasi**: Akumulasi ulasan bintang 5, level XP, dan galeri portofolio menjadi rekam jejak profesional awal bagi mahasiswa sebelum memasuki dunia kerja formal.

### 2.2 Pertumbuhan Ekonomi Lokal (Economic Growth)
- **Solusi UMKM Cepat**: Pelaku usaha mikro di sekitar area kampus dapat memperoleh bantuan operasional dadakan (seperti foto produk, entri data, penjaga stand) tanpa proses rekrutmen panjang.
- **Sirkulasi Modal Komunitas**: Kompensasi finansial berputar langsung di ekosistem lokal lingkungan kampus dan UMKM perkotaan.
- **Kepastian Transaksi Tanpa Fraud**: Sistem saldo escrow melindungi kedua belah pihak dari risiko penipuan atau wanprestasi pembayaran.

---

## 3. Matriks Komparasi Kompetitif (Diferensiasi Unik)

| Platform | Keterbatasan Utama | Keunggulan CEPAT |
|---|---|---|
| **Sribulancer / Fastwork** | Berorientasi proyek jangka panjang dengan durasi berminggu-minggu; biaya administrasi tinggi. | Fokus pada *micro-task* dadakan yang selesai dalam hitungan jam (< 1 hari). |
| **Upwork / Fiverr** | Pasar global, kompetisi tinggi, tidak berbasis lokasi fisik. | *Hyperlocal* (radius 2 km dari GPS pengguna), relevan untuk interaksi langsung di lapangan. |
| **Aplikasi Ojek Online** | Terbatas pada layanan transportasi dan logistik kurir barang. | Berbasis variasi keahlian kreatif & teknis (desain, penulisan, fotografi, riset, IT helper). |
| **Grup Chat WA / Telegram Kampus** | Informasi tercecer, rawan penipuan pembayaran, tanpa sistem reputasi. | Sistem escrow terpercaya, sealed bidding, riwayat transaksi transparan, dan pusat mediasi sengketa resmi. |

---

## 4. Skenario Live Demo (Penyisihan & Babak Final)

### Skenario 1: UMKM Kuliner Butuh Foto Menu (Mode Bidding & Escrow)
```
1. [Requester - Pemilik Kafe Kampus]:
   - Membuka aplikasi ➔ Buat Tugas Baru.
   - Judul: "Foto 10 Menu Baru untuk Instagram & Banner".
   - Mengaktifkan "Mode Bidding": Budget Rp 80.000 – Rp 120.000 (Plafon Rp 120.000 dikunci di escrow).
   - Penjadwalan: Besok Pukul 10.00 WIB.

2. [Worker - Mahasiswa Desain Komunikasi Visual]:
   - Membuka halaman Peta (/cari-tugas) ➔ Melihat pin tugas berjarak 600 meter.
   - Mengajukan tawaran tertutup (Sealed-Bid) sebesar Rp 95.000 + pesan pengalaman.

3. [Requester]:
   - Menerima notifikasi FCM ➔ Memeriksa profil dan portofolio worker ➔ Menerima bid Rp 95.000.
   - AUTO-REFUND MODEL C: Selisih Rp 25.000 (120.000 - 95.000) seketika kembali ke dompet Requester.

4. [Koordinasi & Eksekusi]:
   - Berkoordinasi via In-App Realtime Chat.
   - Worker hadir tepat waktu, mengambil foto, dan mengunggah berkas bukti kerja.

5. [Penyelesaian & Reputasi]:
   - Requester menyetujui hasil kerja ➔ Dana Rp 95.000 langsung cair ke dompet Worker.
   - Worker memperoleh +50 XP dan Daily Streak bertambah.
   - Saling memberikan ulasan dan rating ⭐⭐⭐⭐⭐.
```

### Skenario 2: Penanganan Sengketa Adil (Dispute Resolution Demo)
```
1. Terjadi ketidaksesuaian jumlah hasil pekerjaan antara worker dan requester.
2. Salah satu pihak membuka tiket di /disputes dan mengunggah tangkapan layar bukti.
3. Moderator admin meninjau kronologi di /admin/disputes dan menetapkan keputusan adil.
4. Sistem mengeksekusi pengembalian atau pelepasan dana escrow secara otomatis tanpa sengketa berkepanjangan.
```

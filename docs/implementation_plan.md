# Spesifikasi Teknis & Dokumentasi Fitur Selesai — CEPAT

Dokumen ini merupakan catatan arsitektur resmi dan spesifikasi teknis dari **5 Fitur Lanjutan** yang telah selesai diimplementasikan secara penuh (100% Completed) pada platform CEPAT (Cari Entry Pekerjaan Area Terdekat).

---

## Ringkasan Eksekutif Implementasi

| Fase Fitur | Status | File Komponen Utama | Model Prisma Terkait |
|---|---|---|---|
| **Fase 1: Task Bidding System** | ✅ Selesai | `src/services/task.service.ts`<br>`src/app/(main)/task/new/page.tsx`<br>`src/app/(main)/task/[id]/page.tsx`<br>`src/app/api/tasks/[id]/bids/route.ts` | `Task.is_bidding`<br>`Task.budget_min`<br>`Task.budget_max`<br>`Task.held_slots_json`<br>`TaskApplicants.bid_amount` |
| **Fase 2: Task Scheduling** | ✅ Selesai | `src/app/(main)/schedule/page.tsx`<br>`src/app/api/tasks/scheduled/route.ts`<br>`src/app/api/cron/schedule-reminder/route.ts` | `Task.scheduled_at`<br>`Task.scheduled_end` |
| **Fase 3: Leaderboard & Gamifikasi** | ✅ Selesai | `src/services/gamification.service.ts`<br>`src/app/(main)/leaderboard/page.tsx`<br>`src/app/api/leaderboard/route.ts`<br>`src/app/api/xp/route.ts`<br>`src/components/ui/BadgeDisplay.tsx` | `Badge`<br>`UserBadge`<br>`UserStreak`<br>`XPLog`<br>`User.xp`, `User.level` |
| **Fase 4: Worker Portfolio Showcase** | ✅ Selesai | `src/app/(main)/profile/[id]/page.tsx`<br>`src/app/api/portfolio/route.ts`<br>`src/app/api/upload/route.ts` | `PortfolioItem`<br>`User.tagline`<br>`User.is_verified` |
| **Fase 5: Dispute & Resolution Center** | ✅ Selesai | `src/services/dispute.service.ts`<br>`src/app/(main)/disputes/page.tsx`<br>`src/app/(main)/disputes/[id]/page.tsx`<br>`src/app/(admin)/admin/disputes/page.tsx`<br>`src/app/api/disputes/route.ts` | `Dispute`<br>`DisputeEvidence`<br>`DisputeMessage`<br>`DisputeStatus` |

---

## 1. 🎯 Fase 1: Task Bidding System (Sistem Lelang Tertutup)

### 1.1 Konsep & Alur Finansial (Model C Escrow)
Pada sistem bidding, pengerja dapat mengajukan penawaran harga secara fleksibel di dalam rentang budget yang ditentukan oleh pembuat tugas:
1. **Plafon Escrow Awal**: Saat tugas bidding dibuat, sistem mengunci saldo Requester sebesar plafon tertinggi:
   $$\text{Saldo Escrow Ditahan} = \text{budget\_max} \times \text{max\_applicants}$$
2. **Pengajuan Tawaran (Sealed-Bid)**: Pekerja memasukkan nominal penawaran (`bid_amount`) dan pesan pitching. Tawaran ini tertutup bagi publik dan hanya dapat dievaluasi oleh pembuat tugas.
3. **Penerimaan Tawaran & Auto-Refund Seketika**:
   Ketika Requester menyetujui tawaran pekerja pada nominal `bid_amount`, selisih dana dikembalikan seketika ke saldo dompet Requester:
   $$\text{Dana Refund} = \text{budget\_max} - \text{bid\_amount}$$
   Sisa dana sebesar `bid_amount` tetap dikunci di escrow dan dicatat per slot pada kolom `held_slots_json`.

### 1.2 Implementasi Kode
* **Logika Backend**: Dikelola secara atomik di [`src/services/task.service.ts`](file:///D:/Coding/My%20Project/Itechno/src/services/task.service.ts) pada method `acceptApplicantWithBidding()` dan `applyToTask()`.
* **API Handler**: [`src/app/api/tasks/[id]/bids/route.ts`](file:///D:/Coding/My%20Project/Itechno/src/app/api/tasks/%5Bid%5D/bids/route.ts) menyediakan daftar seluruh penawaran terurut bagi requester.

---

## 2. 📅 Fase 2: Task Scheduling (Penjadwalan & Pengingat)

### 2.1 Konsep & Pengingat Otomatis
1. **Penetapan Waktu**: Requester dapat memilih opsi "Jadwalkan untuk Nanti" saat membuat tugas, menetapkan tanggal/jam mulai (`scheduled_at`) dan selesai (`scheduled_end`).
2. **Kalender Tugas (`/schedule`)**: Antarmuka interaktif yang menampilkan agenda penugasan bulanan/mingguan untuk kedua belah pihak.
3. **Automated Cron Jobs**:
   * Endpoint: [`src/app/api/cron/schedule-reminder/route.ts`](file:///D:/Coding/My%20Project/Itechno/src/app/api/cron/schedule-reminder/route.ts).
   * Menyeleksi tugas dengan waktu mulai dalam kurun H-24 jam dan H-1 jam.
   * Mengirim notifikasi push FCM dan notifikasi in-app kepada worker dan requester terkait.

---

## 3. 🏆 Fase 3: Leaderboard & Gamifikasi (Reputasi & Motivasi)

### 3.1 Logika Leveling & Penghargaan XP
Gamifikasi diimplementasikan untuk memberikan apresiasi atas keaktifan dan kualitas pengerjaan worker:
* **Rumus Perhitungan Level**:
  $$\text{Level} = \left\lfloor \sqrt{\frac{\text{XP}}{100}} \right\rfloor + 1$$
* **Ketentuan Perolehan XP**:
  * Menyelesaikan tugas dengan sukses: `+50 XP`
  * Mendapatkan rating bintang 5 sempurna: `+25 XP`
  * Login & aktivitas harian beruntun (*Daily Streak*): `+10 XP`
  * Bonus penyelesaian tugas pertama kali: `+100 XP`

### 3.2 Leaderboard Weighted Ranking
Peringkat pekerja dihitung melalui skor pembobotan berimbang untuk memastikan kualitas kerja lebih diutamakan:
$$\text{Leaderboard Score} = (\text{total\_completed} \times 3) + (\text{rating\_avg} \times 20) + (\text{xp} \times 0.1)$$
* **Antarmuka**: [`src/app/(main)/leaderboard/page.tsx`](file:///D:/Coding/My%20Project/Itechno/src/app/(main)/leaderboard/page.tsx) dengan podium 3 besar (🥇🥈🥉) dan filter periode mingguan, bulanan, dan sepanjang waktu.
* **Service**: Terpusat di [`src/services/gamification.service.ts`](file:///D:/Coding/My%20Project/Itechno/src/services/gamification.service.ts).

---

## 4. ⭐ Fase 4: Worker Portfolio & Showcase (Galeri Portofolio)

### 4.1 Galeri Hasil Kerja Publik
1. **Karya Nyata**: Worker dapat mengunggah foto portofolio asli (`PortfolioItem`) yang terhubung dengan tugas yang pernah dikerjakan atau proyek independen.
2. **Storage Terintegrasi**: Media diunggah langsung ke Supabase Storage via endpoint aman [`src/app/api/upload/route.ts`](file:///D:/Coding/My%20Project/Itechno/src/app/api/upload/route.ts) dengan validasi tipe berkas dan kompresi.
3. **Profil Publik & Tagline**: Halaman [`src/app/(main)/profile/[id]/page.tsx`](file:///D:/Coding/My%20Project/Itechno/src/app/(main)/profile/%5Bid%5D/page.tsx) dilengkapi tab Portofolio bergaya *masonry grid*, lencana verifikasi (`is_verified`), dan tautan profil publik yang dapat dibagikan.

---

## 5. 🛡️ Fase 5: Dispute & Resolution Center (Pusat Sengketa)

### 5.1 Alur Mediasi & Putusan Admin
Untuk menjamin keadilan transaksi bagi kedua belah pihak jika terjadi ketidaksesuaian tugas:
1. **Inisiasi Sengketa**: Pihak requester atau worker dapat membuka tiket sengketa resmi di [`src/app/(main)/disputes/page.tsx`](file:///D:/Coding/My%20Project/Itechno/src/app/(main)/disputes/page.tsx).
2. **Pengunggahan Bukti**: Bukti foto hasil kerja dan catatan kronologis diunggah ke tabel `DisputeEvidence`.
3. **Ruang Obrolan Mediasi**: Fasilitas thread obrolan mediasi (`DisputeMessage`) yang melibatkan pelapor, terlapor, dan perwakilan admin.
4. **Eksekusi Resolusi Finansial di Admin Console**:
   Melalui halaman [`src/app/(admin)/admin/disputes/page.tsx`](file:///D:/Coding/My%20Project/Itechno/src/app/(admin)/admin/disputes/page.tsx), admin menetapkan putusan:
   * **RESOLVED_FAVOR_WORKER**: Seluruh dana escrow yang ditahan langsung dicairkan ke dompet worker (`sub_type: task_earning`).
   * **RESOLVED_FAVOR_REQUESTER**: Seluruh dana escrow yang ditahan langsung dikembalikan penuh ke dompet requester (`sub_type: refund`).
* **Service Backend**: Dikelola secara aman di [`src/services/dispute.service.ts`](file:///D:/Coding/My%20Project/Itechno/src/services/dispute.service.ts).

---

## 6. Verifikasi Kualitas & Stabilitas

Seluruh kode dari kelima modul fitur di atas telah diverifikasi dengan standar:
1. **Type Safety**: Bebas dari penggunaan tipe `any`, memanfaatkan TypeScript 5 dan inferensi Zod 4.
2. **Atomicity**: Transaksi finansial escrow dikemas dalam `prisma.$transaction` untuk menjamin tidak terjadinya saldo gantung atau *race condition*.
3. **Pemisahan Perhatian (Separation of Concerns)**: Seluruh pemrosesan database dan aturan bisnis murni berada di dalam layer `services/`, menjaga API Route Handlers dan komponen UI tetap ramping dan mudah diuji.

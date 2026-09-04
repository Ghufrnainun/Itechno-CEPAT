# User Flow & Arsitektur Layar — CEPAT

Dokumen ini memetakan alur pengguna (*User Journey*), transisi antar layar (*Screen Transitions*), dan logika matriks status aplikasi **CEPAT (Cari Entry Pekerjaan Area Terdekat)**.

---

## 1. Peta Layar Terintegrasi (Screen Map)

```
[ L0: Landing Page ] ──► [ L1: Auth (Login/Register) ]
                                   │
                        ┌──────────┴──────────┐
                        ▼ (User Baru)         ▼ (User Lama)
              [ L1.5: Onboarding ]            │
              Step 1 – Tinjau Peran           │
              Step 2 – Kontak & Institusi     │
              Step 3 – Bio & Keahlian         │
                        │                     │
                        └──────────┬──────────┘
                                   ▼
                       [ L2: Unified Dashboard ]
                                   │
     ┌──────────────────┬──────────┴──────────┬──────────────────┐
     ▼                  ▼                     ▼                  ▼
[ L3A: Buat Task ] [ L3B: Cari Tugas ]  [ L3C: Jadwal ]   [ L3D: Leaderboard ]
 (Fixed/Bidding      (Peta Leaflet +      (/schedule       (Peringkat XP,
  + Escrow Lock)       Feed Radius)        Kalender)       Badges, Streaks)
     │                  │                     │                  │
     │                  ▼                     │                  │
     │         [ L4: Apply / Bidding ]        │                  │
     │          (Pitch + Sealed-Bid)          │                  │
     │                  │                     │                  │
     └──────────┬───────┴─────────────────────┘                  │
                ▼                                                ▼
     [ L5: Evaluasi Pelamar & Approval ]               [ L3E: Portofolio Profil ]
     (Auto-Refund Selisih Escrow Model C)               (/profile/[id] Showcase)
                │
                ▼
     [ L6: In-App Chat & Pelacakan Task ]
                │
     ┌──────────┴─────────────────────────────┐
     ▼ (Pengerjaan Normal)                    ▼ (Terjadi Ketidaksesuaian)
[ L7A: Submit Bukti Kerja ]          [ L7B: Dispute & Resolution ]
           │                          (Tiket Sengketa, Bukti Foto,
           ▼                           Ruang Mediasi & Putusan Admin)
[ L8: Selesaikan & Release Escrow ]           │
           │                                  ▼
           ▼                         [ L9: Resolusi Finansial Admin ]
[ L10: Rating & Review Bintang 5 ]   (Favor Worker vs Favor Requester)
           │                                  │
           └──────────────────┬───────────────┘
                              ▼
                   [ L11: Wallet & History ]
                   (Mutasi Transaksi, Saldo,
                    Top-Up Midtrans Snap)
```

---

## 2. Alur Pengguna Utama

### A. Alur Pemberi Tugas (Requester Flow)
1. **L2 - Dashboard**: Membuka dashboard ➔ Klik tombol **"Buat Tugas Baru"** (`/task/new`).
2. **L3A - Form Pembuatan Tugas**:
   * Memilih metode pembiayaan: **Harga Tetap (Fixed)** atau **Mode Bidding (Lelang Tertutup)**.
   * Pada mode Bidding: Menentukan rentang budget (`budget_min` – `budget_max`) dan kuota pekerja yang dibutuhkan.
   * Mengatur opsi penjadwalan waktu pengerjaan (`scheduled_at`).
   * **Escrow Lock**: Saldo dipotong & dikunci sebesar plafon tertinggi:
     $$\text{Dana Ditahan} = \text{budget\_max} \times \text{kuota\_pekerja}$$
3. **L5 - Evaluasi Penawaran Masuk (Sealed-Bid)**:
   * Requester menerima notifikasi penawaran baru dan meninjau daftar lamaran.
   * Memilih penawaran terbaik dan mengklik **"Terima Pekerja (Rp xxx.xxx)"**.
   * **Auto-Refund Escrow Model C**: Selisih `(budget_max - bid_amount)` seketika dikembalikan ke saldo dompet Requester, sementara nominal `bid_amount` tetap ditahan di escrow.
4. **L6 - Koordinasi & Pengerjaan**: Berkomunikasi langsung melalui In-App Realtime Chat (`/chat`).
5. **L8 - Pengesahan & Pencairan Escrow**:
   * Meninjau berkas bukti pengerjaan (*Work Proof*) yang dikirimkan worker.
   * Klik **"Setujui & Selesaikan"**: Dana escrow otomatis cair ke dompet worker, status tugas menjadi `COMPLETED`.
6. **L10 - Rating & Ulasan**: Memberikan bintang 1–5 dan komentar balik untuk membangun reputasi worker.

---

### B. Alur Pengerja Tugas (Worker Flow)
1. **L3B - Peta & Penemuan Tugas (`/cari-tugas`)**:
   * Mengaktifkan GPS / Geolocation.
   * Menjelajahi pin tugas interaktif dalam radius default 2 km di sekitar posisi pengguna dengan indikator badge harga tetap atau rentang lelang.
2. **L4 - Melamar & Mengajukan Penawaran (Bidding)**:
   * Membaca deskripsi penugasan dan estimasi waktu.
   * Mengajukan pesan pitching dan nominal tawaran kustom (`bid_amount`) di dalam rentang budget requester.
   * Tawaran bersifat tertutup (hanya dapat dilihat oleh requester). Pengerja dapat mengedit tawaran selama status masih pending.
3. **L6 - Pengerjaan & Komunikasi Real-time**:
   * Setelah diterima, berkoordinasi via chat dan memperbarui status saat tugas dimulai (*Start Task*).
4. **L7A - Unggah Bukti Kerja**:
   * Mengunggah deskripsi penyelesaian dan foto bukti pekerjaan di halaman detail tugas.
5. **L8 & L11 - Penerimaan Dana & Peningkatan Reputasi**:
   * Menerima notifikasi pencairan dana ke saldo dompet (`/wallet`).
   * Memperoleh `+50 XP`, peningkatan level, pembaruan streak harian, dan peluang meraih badge baru.
   * Hasil kerja dapat ditambahkan ke galeri portofolio profil (`/profile/[id]`).

---

### C. Alur Penyelesaian Sengketa (Dispute Resolution Flow)
1. **L7B - Pembukaan Tiket Sengketa**: Jika terdapat kendala pengerjaan atau ketidaksesuaian hasil kerja pada tugas `IN_PROGRESS` atau `COMPLETED`, pihak pelapor membuka sengketa di `/disputes`.
2. **Unggah Bukti & Mediasi**: Kedua pihak mengunggah bukti foto dan berdiskusi dalam thread mediasi.
3. **L9 - Putusan Admin (`/admin/disputes`)**: Admin menelaah berkas perkara dan menetapkan keputusan:
   * **Favor Worker**: Dana escrow ditransfer ke worker.
   * **Favor Requester**: Dana escrow di-refund penuh ke requester.

---

## 3. Matriks Transisi Status Tugas & Escrow

| Status Awal | Aksi Pemicu | Pelaku | Status Selanjutnya | Dampak Finansial & Escrow |
|---|---|---|---|---|
| `-` | Submit Pembuatan Task | Requester | `OPEN` | Saldo Requester dipotong & ditahan sebesar `budget_max * kuota`. |
| `OPEN` | Requester menyetujui bid Worker | Requester | `ACCEPTED` / `IN_PROGRESS` | Selisih `(budget_max - bid)` di-refund ke Requester. Sisa `bid` tetap di-hold. |
| `IN_PROGRESS` | Worker mengirim bukti kerja | Worker | `SUBMITTED` | Dana escrow tetap terkunci aman di sistem. |
| `SUBMITTED` | Requester menyetujui hasil kerja | Requester | `COMPLETED` | Dana escrow (`bid_amount`) dicairkan ke dompet Worker; +50 XP diberikan. |
| `OPEN` / `ACCEPTED` | Pembatalan tugas oleh Requester / Admin | Requester / Admin | `CANCELLED` | Seluruh sisa saldo escrow yang ditahan di-refund penuh ke dompet Requester. |
| `IN_PROGRESS` / `COMPLETED` | Eskalasi Sengketa | Worker / Requester | Dispute `OPEN` | Dana escrow dibekukan hingga ada keputusan admin di `/admin/disputes`. |

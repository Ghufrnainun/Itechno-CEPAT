# User Flow & Screen Architecture — Radius

Dokumen ini menjelaskan alur pengguna (*User Journey*), perpindahan layar (*Screen Transitions*), dan logika status aplikasi **Radius**.

---

## 1. Peta Layar (Screen Map)

```
[ L0: Landing Page ] ──► [ L1: Auth (Login/Register) ]
                                   │
                        ┌──────────┴──────────┐
                        ▼ (user baru)         ▼ (user lama)
              [ L1.5: Onboarding ]            │
              Step 1 – Pilih Peran            │
              Step 2 – Kontak WA              │
              Step 3 – Bio & Skills           │
                        │                     │
                        └──────────┬──────────┘
                                   ▼
                      [ L2: Map & Task Dashboard ]
                                   │
            ┌──────────────────────┴──────────────────────┐
            ▼                                             ▼
  [ L3A: Buat Task Baru ]                       [ L3B: Detail Task & Map Pin ]
(Input Detail + Escrow Lock)                              │
            │                                             ▼
            │                                  [ L4: Apply / Melamar Task ]
            │                                             │
            └──────────────────────┬──────────────────────┘
                                   ▼
                      [ L5: In-App Realtime Chat & Task Tracker ]
                                   │
            ┌──────────────────────┴──────────────────────┐
            ▼                                             ▼
 [ L6A: Submit Work Proof ]                  [ L6B: Approve Work & Release Escrow ]
       (Tasker)                                          (Poster)
            │                                             │
            └──────────────────────┬──────────────────────┘
                                   ▼
                      [ L7: Rating & Review Modal ]
                                   │
                                   ▼
                       [ L8: Wallet & History ]
```

---

## 2. Alur Pengguna Utama

### A. Alur Pemberi Kerja (Poster Flow)
1. **L2 - Dashboard**: Membuka dashboard ➔ Klik tombol **"Buat Tugas Baru"**.
2. **L3A - Form Buat Task**:
   * Memilih mode harga: **Harga Tetap (Fixed)** atau **Mode Bidding (Lelang/Penawaran)**.
   * Pada mode Bidding: Menentukan rentang budget minimal & maksimal (misal: Rp 100.000 – Rp 150.000) serta kuota pekerja.
   * Sistem memeriksa saldo wallet. Saldo dipotong & dikunci (*Escrow Lock*) sebesar plafon tertinggi (`budget_max * kuota_worker`).
   * Task tayang di peta & feed dengan badge **Mode Bidding**.
3. **L5 - Manajemen Pelamar & Sealed Bidding**:
   * Menerima notifikasi lamaran ➔ Melihat daftar penawaran harga (*sealed bid* dari para pekerja).
   * Memilih tawaran terbaik dan mengklik **"Terima Pekerja (Rp xxx.xxx)"**.
   * **Auto-Refund Escrow (Model C)**: Selisih `(budget_max - bid_accepted)` otomatis dikembalikan seketika ke saldo Poster.
   * Status task berubah menjadi `ACCEPTED` / `IN_PROGRESS` dan ruang chat koordinasi aktif.
4. **L6B - Pengesahan & Pencairan Escrow**:
   * Menerima kiriman *bukti pengerjaan* dari Tasker.
   * Mengklik **"Setujui & Selesaikan"** ➔ Sistem otomatis mentransfer dana escrow yang disepakati ke wallet Tasker (*Escrow Release*).
   * Status task berubah menjadi `COMPLETED`.
5. **L7 - Rating**: Memberikan penilaian bintang 1–5 & ulasan untuk Tasker.

---

### B. Alur Pekerja (Tasker Flow)
1. **L2 - Dashboard Peta & Feed**:
   * Mengizinkan fitur GPS / Geolocation.
   * Melihat pin & card tugas mikro aktif dalam radius 2 km di sekitar posisi pengguna dengan indikator badge harga tetap / rentang bidding.
2. **L3B - Detail Task**: Membaca spesifikasi tugas, estimasi waktu, dan rentang budget yang ditawarkan Poster.
3. **L4 - Apply & Ajukan Penawaran (Bidding)**:
   * Memasukkan pesan lamaran (*pitch message*) dan nominal harga penawaran kustom (`bid_amount`) dalam batas rentang budget.
   * Tawaran bersifat tertutup (*sealed-bid*) dan hanya bisa dilihat oleh Poster.
   * Tasker dapat memperbarui (*edit/update*) nominal tawaran selama status masih `PENDING`.
4. **L5 - Koordinasi**: Setelah tawaran diterima, berkomunikasi dengan Poster via *In-App Realtime Chat*.
5. **L6A - Konfirmasi Mulai & Kirim Bukti Kerja**: Mengunggah deskripsi & foto bukti pengerjaan.
6. **L7 & L8 - Terima Imbalan & Rating**:
   * Menerima notifikasi saldo bertambah di wallet sesuai nilai `bid_amount` yang disepakati.
   * Memberikan rating & ulasan balik untuk Poster.

---

## 3. Matriks Transisi Status Task & Escrow

| Status Saat Ini | Aksi Pemicu | Pelaku Aksi | Status Selanjutnya | Efek Saldo Escrow |
|---|---|---|---|---|
| `-` | Submit Form Buat Task | Poster | `OPEN` | Saldo Poster dipotong & dikunci sebesar `budget_max * kuota` |
| `OPEN` | Poster menerima tawaran bid Worker | Poster | `ACCEPTED` / `IN_PROGRESS` | Selisih `(budget_max - bid)` di-refund ke Poster; sisa `bid` tetap di-hold |
| `IN_PROGRESS` | Worker mengirim bukti kerja | Worker | `SUBMITTED` | Dana tetap dikunci di escrow |
| `SUBMITTED` | Poster menyetujui hasil kerja | Poster | `COMPLETED` | Dana escrow (`bid_amount`) dicairkan ke wallet Worker |
| `OPEN` / `ACCEPTED` | Task dibatalkan / kuota sisa tidak terisi | Poster / System | `CANCELLED` | Seluruh sisa dana escrow di-refund penuh ke Poster |

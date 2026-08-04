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
   * Mengisi judul, deskripsi, kategori, imbalan (misal: Rp 50.000), dan memilih titik lokasi di peta interaktif.
   * Sistem memeriksa saldo wallet. Jika cukup, saldo dipotong & dikunci (*Escrow Lock*).
   * Task tayang di peta publik dengan status `OPEN`.
3. **L5 - Manajemen Pelamar**:
   * Menerima notifikasi lamaran ➔ Melihat profil & *pitch message* pelamar.
   * Mengklik **"Terima Pekerja"** ➔ Status task berubah menjadi `ASSIGNED` / `IN_PROGRESS`.
   * Ruang chat otomatis terbuka untuk koordinasi.
4. **L6B - Pengesahan & Pencairan Escrow**:
   * Menerima kiriman *bukti pengerjaan* dari Tasker.
   * Mengklik **"Setujui & Selesaikan"** ➔ Sistem otomatis mentransfer dana escrow ke wallet Tasker (*Escrow Release*).
   * Status task berubah menjadi `COMPLETED`.
5. **L7 - Rating**: Memberikan penilaian bintang 1–5 & ulasan untuk Tasker.

---

### B. Alur Pekerja (Tasker Flow)
1. **L2 - Dashboard Peta**:
   * Mengizinkan fitur GPS / Geolocation.
   * Melihat pin tugas mikro aktif dalam radius 2 km di sekitar posisi pengguna.
2. **L3B - Detail Task**: Mengklik pin / card task untuk membaca deskripsi dan nominal imbalan.
3. **L4 - Apply Task**: Mengirimkan pesan lamaran singkat (*pitch message*).
4. **L5 - Koordinasi**: Setelah diterima, berkomunikasi dengan Poster via *In-App Realtime Chat*.
5. **L6A - Kirim Bukti Kerja**: Mengunggah deskripsi & foto bukti pengerjaan ke Supabase Storage.
6. **L7 & L8 - Terima Imbalan & Rating**:
   * Menerima notifikasi saldo bertambah di wallet setelah disetujui Poster.
   * Memberikan rating & ulasan balik untuk Poster.

---

## 3. Matriks Transisi Status Task

| Status Saat Ini | Aksi Pemicu | Pelaku Aksi | Status Selanjutnya | Efek Saldo Escrow |
|---|---|---|---|---|
| `-` | Submit Form Buat Task | Poster | `OPEN` | Saldo Poster dipotong & dikunci |
| `OPEN` | Poster memilih & menyetujui pelamar | Poster | `ASSIGNED` / `IN_PROGRESS` | Dana tetap dikunci di escrow |
| `IN_PROGRESS` | Tasker mengirim bukti kerja | Tasker | `SUBMITTED` | Dana tetap dikunci di escrow |
| `SUBMITTED` | Poster menyetujui hasil kerja | Poster | `COMPLETED` | Dana escrow ditransfer ke Tasker |
| `OPEN` / `ASSIGNED` | Task dibatalkan / expired | Poster / System | `CANCELLED` | Dana escrow di-refund ke Poster |

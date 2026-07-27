# Panduan Prompting AI Agent — CEPAT (Cari Entry Pekerjaan Area Terdekat)

Dokumen ini menjelaskan cara efektif menggunakan file-file di folder `docs/` untuk memberikan konteks ke AI coding agent (GitHub Copilot, Claude, ChatGPT, Cursor, dll).

---

## 1. Daftar File & Kapan Menggunakannya

| File                | Isi                                          | Gunakan Saat...                                              |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| `context.md`        | Ringkasan kompetisi, ide, tim, tech stack    | Memulai percakapan baru / agent perlu konteks penuh proyek   |
| `architecture.md`   | Diagram sistem, folder structure, alur data  | Membuat file/folder baru, refactoring, integrasi antar modul |
| `features.md`       | Daftar fitur, prioritas, user flow           | Implement fitur baru, validasi apakah fitur sudah lengkap    |
| `database.md`       | Schema SQL, ERD, RLS, PostGIS queries        | Membuat/edit tabel, menulis query, setup Supabase            |
| `api.md`            | Endpoint list, request/response format       | Membuat API route, testing endpoint, integrasi frontend-API  |
| `design.md`         | Color palette, typography, komponen UI       | Styling, membuat komponen baru, memastikan konsistensi visual |
| `techstack.md`      | Dependencies, env vars, alasan pemilihan     | Install package, konfigurasi, troubleshoot dependency        |
| `conventions.md`    | Naming, patterns, code style rules           | Menulis kode baru, review kode, memastikan konsistensi       |
| `deployment.md`     | Vercel, Supabase, Firebase setup & scripts   | Deploy, environment setup, CI/CD, pre-submission checklist   |
| `strategy.md`       | Penilaian, narasi SDG, USP, demo scenario    | README, landing page, presentasi, strategi kompetisi         |

---

## 2. Template Prompt

### Mulai Proyek / Konteks Awal

```
Saya sedang membangun web app untuk kompetisi ITechno Cup 2026.
Baca file docs/context.md untuk konteks lengkap proyek.
Baca docs/architecture.md untuk arsitektur sistem.
Baca docs/conventions.md untuk coding conventions.

[instruksi spesifik Anda di sini]
```

### Implement Fitur Baru

```
Baca docs/features.md untuk daftar fitur.
Baca docs/database.md untuk schema database yang relevan.
Baca docs/api.md untuk API endpoints yang terkait.
Baca docs/design.md untuk design system.

Buatkan implementasi untuk fitur [nama fitur].
Ikuti conventions di docs/conventions.md.
```

### Perbaiki Bug / Debug

```
Baca docs/architecture.md untuk memahami alur data.
Baca docs/database.md untuk schema tabel [nama tabel].
Baca docs/api.md untuk endpoint [nama endpoint].

Bug yang terjadi: [deskripsi bug]
Error message: [error]
```

### Buat Komponen UI

```
Baca docs/design.md untuk design system (colors, typography, spacing).
Baca docs/conventions.md untuk component patterns.

Buatkan komponen [nama komponen] dengan spesifikasi:
- [detail]
```

### Setup & Deploy

```
Baca docs/deployment.md untuk panduan deployment.
Baca docs/techstack.md untuk dependencies & env vars.

Bantu saya [setup Supabase / deploy ke Vercel / configure FCM].
```

### Persiapan Kompetisi

```
Baca docs/strategy.md untuk strategi kompetisi & penilaian.
Baca docs/context.md untuk konteks kompetisi.

Bantu saya [tulis README / buat slide / siapkan demo scenario].
```

---

## 3. Tips Efektif

1. **Selalu mulai dengan konteks**: Berikan `context.md` + file doc yang relevan di awal percakapan.
2. **Spesifik**: Jangan bilang "buatkan task page" — bilang "buatkan halaman task feed (list view) sesuai design di docs/design.md section 5.2 Task Card".
3. **Referensi section**: Arahkan ke section spesifik, misal "ikuti pola API route di docs/conventions.md section 4".
4. **Satu hal per prompt**: Lebih baik minta satu fitur per prompt daripada semuanya sekaligus.
5. **Validasi output**: Setelah agent generate kode, cek apakah mengikuti conventions & design system.

---

## 4. Catatan

- File-file docs ini bersifat **living document** — update seiring perkembangan proyek.
- Jika ada keputusan teknis baru yang mengubah arsitektur/tech stack, update docs yang terkait.
- Docs ini dibuat untuk **mempermudah prompting**, bukan menggantikan pemahaman tim terhadap kodenya sendiri.

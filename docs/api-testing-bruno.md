# Panduan Pengujian API dengan Bruno

Dokumen ini berisi panduan untuk melakukan pengujian (*testing*) pada *endpoint* API aplikasi **CEPAT** menggunakan [Bruno](https://www.usebruno.com/), sebuah klien API *open-source* yang ringan dan cepat (alternatif Postman).

---

## 1. Persiapan Awal (Setup)

1. **Unduh dan Pasang Bruno**  
   Unduh Bruno dari situs resminya [usebruno.com](https://www.usebruno.com/downloads) dan lakukan instalasi.

2. **Buka Koleksi Bawaan (Open Collection)**
   - Buka aplikasi Bruno.
   - Klik tombol **"Open Collection"**.
   - Arahkan ke folder proyek Anda dan pilih folder `docs/api-cepat`.
   - Bruno akan otomatis memuat seluruh pengaturan API, termasuk konfigurasi Environment dan *Script* cerdas yang akan otomatis menangkap token saat Anda Login.

3. **Pastikan Server Lokal Berjalan**
   Sebelum melakukan *testing*, pastikan *backend* Next.js Anda sedang menyala:
   ```bash
   npm run dev
   ```
   *(Secara bawaan berjalan di `http://localhost:3000`)*

4. **Struktur Koleksi Bawaan (`docs/api-cepat`)**
   Koleksi Bruno yang disediakan mencakup beberapa modul:
   - `auth/`: Endpoint registrasi (`register`), login (`login`), dan logout (`logout`).
   - `category/`: Endpoint pengambilan kategori pekerjaan.
   - `chat/`: Endpoint percakapan real-time.
   - `task/`: Endpoint feed (`feed`), pencarian berbasis radius (`nearby`), pendaftaran tugas (`apply`), dan manajemen pelamar (`applications`).

---

## 2. Menguji API Registrasi (`POST /api/auth/register`)

API ini digunakan untuk membuat akun pengguna baru. Supabase Auth dan profil Prisma akan otomatis terbuat.

1. Di dalam koleksi `CEPAT API`, Anda dapat menggunakan request bawaan atau klik ikon **+ (New Request)**.
2. Isi formulir sebagai berikut:
   - **Name**: `Auth - Register`
   - **Method**: `POST`
   - **URL**: `http://localhost:3000/api/auth/register`
3. Masuk ke *tab* **Body** di bawah kolom URL, dan pilih format **JSON**.
4. Masukkan *payload* JSON berikut ke dalam editor:

   ```json
   {
     "email": "testuser1@example.com",
     "password": "PasswordKuat123!",
     "nama_lengkap": "Budi Santoso",
     "username": "budisantoso1"
   }
   ```
   *(Opsional: Anda bisa menambahkan `"id_role": "UUID-ROLE"` jika ingin menentukan peran secara spesifik, namun jika dikosongkan, sistem akan otomatis menjadikannya "Requester")*

5. Klik tombol **▶ Send** (atau tekan `Ctrl+Enter`).

**Ekspektasi Respons Sukses (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "user_id": "uuid-prisma",
    "email": "testuser1@example.com",
    "username": "budisantoso1",
    "nama_lengkap": "Budi Santoso",
    "role": "Requester"
  }
}
```

> [!NOTE]
> Jika Anda mengklik Send berulang kali dengan email yang sama, API akan memblokir dan mengembalikan galat `409 Conflict: Email sudah terdaftar`. Jika Anda spam tombol klik, Anda akan terkena batas hit (*Rate Limiting* 429).

---

## 3. Menguji API Login (`POST /api/auth/login`)

API ini digunakan untuk melakukan proses autentikasi (masuk) ke dalam aplikasi. Jika sukses, API akan mengembalikan sesi (token) dari Supabase beserta data profil Prisma pengguna, serta menyetel auth cookies pada sesi HTTP.

1. Buka request `auth/login` yang sudah ada atau buat baru:
   - **Name**: `Auth - Login`
   - **Method**: `POST`
   - **URL**: `http://localhost:3000/api/auth/login`
2. Masuk ke *tab* **Body** di bawah kolom URL, dan pilih format **JSON**.
3. Masukkan *payload* JSON berikut ke dalam editor (gunakan data yang sama dengan saat mendaftar):

   ```json
   {
     "email": "testuser1@example.com",
     "password": "PasswordKuat123!"
   }
   ```

4. Klik tombol **▶ Send**.

**Ekspektasi Respons Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh_token": "12345678-abcd-efgh-ijkl-1234567890ab",
      "expires_at": 1711234567
    },
    "user": {
      "id": "uuid-prisma",
      "email": "testuser1@example.com",
      "username": "budisantoso1",
      "nama_lengkap": "Budi Santoso",
      "avatar_url": null,
      "bio": null,
      "rating_avg": 0,
      "total_completed": 0,
      "total_balance": 0,
      "role": "Requester"
    }
  }
}
```

---
## 4. Menguji API Profil (`GET /api/auth/me`)

API ini digunakan untuk melihat data profil *user* yang sedang aktif berdasarkan sesi Supabase Auth yang tersimpan pada cookies.

1. Buat permintaan baru atau buka request profil:
   - **Name**: `Auth - Get Profile`
   - **Method**: `GET`
   - **URL**: `http://localhost:3000/api/auth/me`
2. **Autentikasi**:
   - Karena endpoint ini membaca sesi melalui cookie Supabase SSR (`@/lib/supabase/server`), pastikan Bruno mengaktifkan *Cookie Jar* (otomatis aktif di Bruno). Cookie dari respon login akan otomatis dikirimkan pada request ini.
3. Klik **▶ Send**.

**Ekspektasi Respons Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-prisma",
    "email": "testuser1@example.com",
    "username": "budisantoso1",
    "nama_lengkap": "Budi Santoso",
    "avatar_url": null,
    "bio": null,
    "pendidikan_terakhir": null,
    "alamat": null,
    "no_telpon": null,
    "rating_avg": 0,
    "total_completed": 0,
    "total_balance": 0,
    "role": {
      "id_role": "uuid",
      "nama_role": "Requester"
    },
    "skills": []
  }
}
```

---

## 5. Keuntungan Menggunakan Bruno

> [!TIP]
> Mengapa menggunakan Bruno dibanding klien lain (mis. Postman)?
> - **Berbasis Berkas (File-based):** Bruno menyimpan setiap *request* dalam bentuk berkas teks `.bru` di komputer Anda, bukan di layanan *cloud* eksternal. Ini membuat Anda dapat meng-commit file-file pengujian ini langsung ke GitHub bersama kode proyek!
> - **Sepenuhnya Offline:** Tidak ada kewajiban membuat akun atau sinkronisasi *cloud* yang kadang memperlambat kinerja. Sangat cocok untuk pengembangan secara lokal dan kompetisi IT!

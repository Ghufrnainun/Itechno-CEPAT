# Panduan Pengujian API dengan Bruno

Dokumen ini berisi panduan untuk melakukan pengujian (*testing*) pada *endpoint* API aplikasi **CEPAT** menggunakan [Bruno](https://www.usebruno.com/), sebuah klien API *open-source* yang ringan dan cepat (alternatif Postman).

---

## 1. Persiapan Awal (Setup)

1. **Unduh dan Pasang Bruno**  
   Unduh Bruno dari situs resminya [usebruno.com](https://www.usebruno.com/downloads) dan lakukan instalasi.

2. **Buat Koleksi Baru (Collection)**
   - Buka aplikasi Bruno.
   - Klik tombol **"Create Collection"**.
   - Beri nama koleksi, misalnya `CEPAT API`.
   - Pilih folder di komputer Anda (misalnya di dalam folder proyek `Itechno/bruno-collection` agar tes API bisa tersimpan rapi dan masuk ke Git).
   - Klik **Create**.

3. **Pastikan Server Lokal Berjalan**
   Sebelum melakukan *testing*, pastikan *backend* Next.js Anda sedang menyala:
   ```bash
   npm run dev
   ```
   *(Secara bawaan berjalan di `http://localhost:3000`)*

---

## 2. Menguji API Registrasi (`POST /api/auth/register`)

API ini digunakan untuk membuat akun pengguna baru. Supabase Auth dan profil Prisma akan otomatis terbuat.

1. Di dalam koleksi `CEPAT API`, klik ikon **+ (New Request)**.
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

API ini digunakan untuk melakukan proses autentikasi (masuk) ke dalam aplikasi. Jika sukses, API akan mengembalikan sesi (token) dari Supabase beserta data profil Prisma pengguna.

1. Di dalam koleksi `CEPAT API`, klik ikon **+ (New Request)**.
2. Isi formulir sebagai berikut:
   - **Name**: `Auth - Login`
   - **Method**: `POST`
   - **URL**: `http://localhost:3000/api/auth/login`
3. Masuk ke *tab* **Body** di bawah kolom URL, dan pilih format **JSON**.
4. Masukkan *payload* JSON berikut ke dalam editor (gunakan data yang sama dengan saat mendaftar):

   ```json
   {
     "email": "testuser1@example.com",
     "password": "PasswordKuat123!"
   }
   ```

5. Klik tombol **▶ Send**.

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

API ini digunakan untuk melihat data profil *user* yang sedang aktif.

1. Buat permintaan baru dengan klik **+ (New Request)**.
2. Isi:
   - **Name**: `Auth - Get Profile`
   - **Method**: `GET`
   - **URL**: `http://localhost:3000/api/auth/me`
3. Masuk ke *tab* **Headers**.
4. Tambahkan *header* berikut untuk mensimulasikan sesi (*karena login Supabase asli berbasis Cookie/JWT, untuk versi tes kita buat simulasi x-auth-id terlebih dahulu sesuai kode di `route.ts`*):
   - **Name**: `x-auth-id`
   - **Value**: Masukkan UUID *auth_id* milik Anda yang sudah masuk ke *database* atau token dari Supabase (tergantung implementasi akhir Anda).
5. Klik **▶ Send**.

**Ekspektasi Respons Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_user": "uuid",
    "id_role": "uuid",
    "nama_role": "Requester",
    "email": "testuser1@example.com",
    "username": "budisantoso1",
    "nama_lengkap": "Budi Santoso",
    "total_balance": 0,
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

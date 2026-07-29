# API Reference — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Overview

- **Framework**: Next.js App Router API Routes (`src/app/api/`)
- **Auth**: Supabase Auth JWT — setiap request authenticated harus menyertakan `Authorization: Bearer <token>` atau cookie session Supabase
- **Format**: JSON request/response
- **Base URL**: `http://localhost:3000/api` (dev) / `https://cepat.vercel.app/api` (prod)

---

## 2. Authentication

Supabase Auth menangani auth flow. API routes memvalidasi input menggunakan **Zod schemas** (`src/lib/validations.ts`) dan mengelola profil user via **Prisma ORM**.

### POST `/api/auth/register`

Register user baru. Memvalidasi input via Zod, membuat user di Supabase Auth, lalu menyinkronkan profil ke tabel Prisma `User` dengan mapping `auth_id`.

**Rate Limit:** 5 requests per 15 menit per IP (diatur via `src/lib/rate-limit.ts`).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nama_lengkap": "John Doe",
  "username": "johndoe",
  "id_role": "uuid-opsional"
}
```

**Validasi Rules (Zod):**
- `email`: Format email valid, max 254 karakter, **disposable/temp mail diblokir otomatis** (100+ domain).
- `password`: String (minimal 6 karakter).
- `username`: String (3-30 karakter, alfanumerik + `.` + `_`, tidak boleh diawali/diakhiri simbol).
- `nama_lengkap`: String (2-100 karakter, bebas XSS/tag HTML).
- `id_role` *(opsional)*: UUID role. Jika tidak diisi, otomatis mengambil role default pertama dari tabel `Role`.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "user_id": "uuid-prisma",
    "email": "user@example.com",
    "username": "johndoe",
    "nama_lengkap": "John Doe",
    "role": "Requester"
  }
}
```

**Response Error (400 / 409 / 429):**
- `400 Bad Request`: Data tidak valid (misal email temp, password kurang dari 6 char, format username salah).
- `409 Conflict`: Username atau email sudah terdaftar.
- `429 Too Many Requests`: Melebihi rate limit.

---

### POST `/api/auth/login`

Login via email + password.

**Rate Limit:** 10 requests per 15 menit per IP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "ey...",
      "refresh_token": "...",
      "expires_at": 1785155159
    },
    "user": {
      "id": "uuid-prisma",
      "email": "user@example.com",
      "username": "johndoe",
      "nama_lengkap": "John Doe",
      "avatar_url": null,
      "bio": null,
      "rating_avg": 0.0,
      "total_completed": 0,
      "total_balance": 0.0,
      "role": "Requester"
    }
  }
}
```

**Response Error (401 / 429):**
- `401 Unauthorized`: `"Email atau password salah."` (sengaja generik untuk mencegah user enumeration).

---

### POST `/api/auth/logout`

Logout, invalidate Supabase session cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Berhasil logout."
}
```

---

### GET `/api/auth/me`

🔒 **Authenticated** — Get profile user yang sedang login.

**Rate Limit:** 30 requests per 1 menit per IP.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-prisma",
    "email": "user@example.com",
    "username": "johndoe",
    "nama_lengkap": "John Doe",
    "avatar_url": null,
    "bio": null,
    "pendidikan_terakhir": null,
    "alamat": null,
    "no_telpon": null,
    "rating_avg": 0.0,
    "total_completed": 0,
    "total_balance": 0.0,
    "role": {
      "id_role": "uuid",
      "nama_role": "Requester"
    },
    "skills": []
  }
}
```

---

## 3. Tasks

### GET `/api/tasks`

Ambil daftar task. Mendukung geo-query dan filter.

**Query Parameters:**

| Param      | Type    | Required | Default | Deskripsi                          |
| ---------- | ------- | -------- | ------- | ---------------------------------- |
| `lat`      | number  | Ya*      | -       | Latitude posisi user               |
| `lng`      | number  | Ya*      | -       | Longitude posisi user              |
| `radius`   | number  | Tidak    | 2000    | Radius pencarian dalam meter       |
| `category` | string  | Tidak    | -       | Filter by kategori skill           |
| `status`   | string  | Tidak    | 'open'  | Filter by status task              |
| `sort`     | string  | Tidak    | 'distance' | Sort: 'distance', 'newest', 'compensation' |
| `page`     | number  | Tidak    | 1       | Pagination page                    |
| `limit`    | number  | Tidak    | 20      | Items per page                     |

> *`lat` dan `lng` wajib untuk geo-query. Jika tidak disertakan, return semua task tanpa sorting by distance.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Foto Produk UMKM",
      "description": "Butuh bantuan foto 20 produk makanan...",
      "category": "fotografi",
      "requester": {
        "id": "uuid",
        "full_name": "Jane Doe",
        "avatar_url": "...",
        "reputation": 4.8
      },
      "location": { "lat": -6.9823, "lng": 110.4093 },
      "address_text": "Jl. Prof. Sudarto No.13, Tembalang",
      "estimated_time": 120,
      "compensation": 50,
      "status": "open",
      "distance_m": 850,
      "applicant_count": 3,
      "created_at": "2026-07-27T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### GET `/api/tasks/:id`

Detail satu task.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Foto Produk UMKM",
    "description": "Butuh bantuan foto 20 produk makanan untuk katalog online",
    "category": "fotografi",
    "requester": { "id": "uuid", "full_name": "Jane", "reputation": 4.8 },
    "worker": null,
    "location": { "lat": -6.9823, "lng": 110.4093 },
    "address_text": "Jl. Prof. Sudarto No.13, Tembalang",
    "estimated_time": 120,
    "compensation": 50,
    "status": "open",
    "applicants": [
      { "id": "uuid", "worker": { "id": "uuid", "full_name": "...", "reputation": 4.5 }, "message": "Saya bisa bantu!", "applied_at": "..." }
    ],
    "created_at": "2026-07-27T10:00:00Z",
    "updated_at": "2026-07-27T10:00:00Z"
  }
}
```

---

### POST `/api/tasks`

🔒 **Authenticated** — Buat task baru.

**Request Body:**
```json
{
  "title": "Foto Produk UMKM",
  "description": "Butuh bantuan foto 20 produk makanan untuk katalog online",
  "category": "fotografi",
  "lat": -6.9823,
  "lng": 110.4093,
  "address_text": "Jl. Prof. Sudarto No.13, Tembalang",
  "estimated_time": 120,
  "compensation": 50
}
```

**Validasi:**
- `compensation` harus ≤ `total_points` user (saldo cukup)
- `estimated_time` dalam menit, minimal 15
- `category` harus dari daftar kategori valid

**Response (201):**
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "open", "created_at": "..." }
}
```

**Side effects:**
- Poin requester di-hold (dikurangi sementara)
- Supabase Realtime broadcast: new task ke channel area

---

### POST `/api/tasks/:id/apply`

🔒 **Authenticated (Worker)** — Apply ke task.

**Request Body:**
```json
{
  "message": "Saya punya pengalaman fotografi 2 tahun, bisa mulai sekarang!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { "applicant_id": "uuid", "status": "pending" }
}
```

**Validasi:**
- Tidak bisa apply ke task sendiri
- Tidak bisa apply 2x ke task yang sama
- Task harus berstatus `open`

---

### POST `/api/tasks/:id/accept`

🔒 **Authenticated (Requester)** — Accept applicant tertentu.

**Request Body:**
```json
{
  "worker_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "task_id": "uuid", "status": "accepted", "worker_id": "uuid" }
}
```

**Side effects:**
- Task status → `accepted`, `accepted_at` di-set
- `task_applicants` status worker → `accepted`, lainnya → `rejected`
- Notifikasi ke worker yang diterima
- FCM push ke worker

---

### PATCH `/api/tasks/:id/status`

🔒 **Authenticated** — Update status task.

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Transisi status yang valid:**
| Dari            | Ke              | Aktor      |
| --------------- | --------------- | ---------- |
| `open`          | `cancelled`     | Requester  |
| `accepted`      | `in_progress`   | Worker     |
| `accepted`      | `cancelled`     | Requester  |
| `in_progress`   | `completed`     | Requester  |

**Side effects (completed):**
- Transfer poin dari hold requester ke worker
- Buat `point_transactions` entries
- Notifikasi ke kedua pihak

---

## 4. Users / Profiles

### GET `/api/users/:id`

Get public profile user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "avatar_url": "...",
    "bio": "Mahasiswa Teknik Informatika UNDIP",
    "university": "Universitas Diponegoro",
    "skills": ["fotografi", "desain_grafis", "data_entry"],
    "reputation": 4.75,
    "total_reviews": 12,
    "task_stats": {
      "completed_as_requester": 8,
      "completed_as_worker": 15
    }
  }
}
```

---

### PATCH `/api/users/me`

🔒 **Authenticated** — Update profil sendiri.

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "bio": "Updated bio",
  "skills": ["fotografi", "desain_grafis"],
  "role_pref": "both"
}
```

---

### PATCH `/api/users/me/fcm-token`

🔒 **Authenticated** — Update FCM token untuk push notification.

**Request Body:**
```json
{
  "fcm_token": "firebase-cloud-messaging-token-here"
}
```

---

## 5. Reviews

### POST `/api/reviews`

🔒 **Authenticated** — Beri rating setelah task selesai.

**Request Body:**
```json
{
  "task_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 5,
  "comment": "Kerjanya cepat dan rapi, recommended!"
}
```

**Validasi:**
- Task harus berstatus `completed`
- Reviewer harus requester atau worker dari task tersebut
- Belum pernah review task ini sebelumnya

**Side effects:**
- Trigger `update_reputation()` function di DB
- Notifikasi ke reviewee

---

### GET `/api/reviews/user/:id`

Get semua review yang diterima user.

**Query Parameters:**

| Param  | Type   | Default | Deskripsi       |
| ------ | ------ | ------- | --------------- |
| `page` | number | 1       | Pagination page |
| `limit`| number | 10      | Items per page  |

---

## 6. Notifications

### GET `/api/notifications`

🔒 **Authenticated** — Get notifikasi user.

**Query Parameters:**

| Param     | Type    | Default | Deskripsi                |
| --------- | ------- | ------- | ------------------------ |
| `unread`  | boolean | false   | Hanya tampilkan unread   |
| `page`    | number  | 1       | Pagination page          |
| `limit`   | number  | 20      | Items per page           |

---

### PATCH `/api/notifications/:id/read`

🔒 **Authenticated** — Tandai notifikasi sebagai read.

---

### PATCH `/api/notifications/read-all`

🔒 **Authenticated** — Tandai semua notifikasi sebagai read.

---

## 7. Points

### GET `/api/points/balance`

🔒 **Authenticated** — Get saldo poin current user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "balance": 250,
    "pending_hold": 50
  }
}
```

---

### GET `/api/points/history`

🔒 **Authenticated** — Get histori transaksi poin.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 50,
      "type": "task_earning",
      "description": "Menyelesaikan: Foto Produk UMKM",
      "task_id": "uuid",
      "created_at": "2026-07-27T12:00:00Z"
    },
    {
      "id": "uuid",
      "amount": -30,
      "type": "task_payment",
      "description": "Posting task: Entry Data Katalog",
      "task_id": "uuid",
      "created_at": "2026-07-26T15:00:00Z"
    }
  ]
}
```

---

### POST `/api/points/topup`

🔒 **Authenticated** — Mock top-up poin (untuk demo, bukan payment riil).

**Request Body:**
```json
{
  "amount": 100
}
```

---

## 8. Geo RPC

### POST `/api/geo/nearby-tasks`

Query task terdekat menggunakan PostGIS. Ini wrapper untuk Supabase RPC.

**Request Body:**
```json
{
  "lat": -6.9823,
  "lng": 110.4093,
  "radius_m": 2000,
  "category": "fotografi",
  "limit": 20
}
```

> Secara internal, endpoint ini memanggil Supabase `.rpc('get_nearby_tasks', {...})`.

---

## 9. Error Response Format

Semua error mengikuti format standar:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Compensation exceeds your available points",
    "details": {
      "field": "compensation",
      "current_balance": 30,
      "requested": 50
    }
  }
}
```

### HTTP Status Codes

| Code | Penggunaan                        |
| ---- | --------------------------------- |
| 200  | Success (GET, PATCH)              |
| 201  | Created (POST)                    |
| 400  | Bad request / validation error    |
| 401  | Unauthorized (no/invalid token)   |
| 403  | Forbidden (not allowed)           |
| 404  | Resource not found                |
| 409  | Conflict (duplicate apply, dll)   |
| 500  | Internal server error             |

### Error Codes

| Code                  | Deskripsi                               |
| --------------------- | --------------------------------------- |
| `VALIDATION_ERROR`    | Input tidak valid                       |
| `AUTH_REQUIRED`       | Token tidak ada / expired               |
| `FORBIDDEN`           | Tidak punya akses                       |
| `NOT_FOUND`           | Resource tidak ditemukan                 |
| `INSUFFICIENT_POINTS` | Saldo poin tidak cukup                  |
| `INVALID_STATUS`      | Transisi status tidak valid             |
| `DUPLICATE_ACTION`    | Aksi sudah pernah dilakukan             |
| `SELF_ACTION`         | Tidak bisa apply ke task sendiri        |

---

## 10. Catatan untuk AI Agent

- Semua API route ada di `src/app/api/` menggunakan Next.js App Router conventions (`route.ts` file).
- Auth check: gunakan `createServerClient` dari `@supabase/ssr` lalu `supabase.auth.getUser()`.
- Untuk geo-queries, buat Supabase RPC function (`get_nearby_tasks`) dan panggil via `supabase.rpc()`.
- Response format harus konsisten: selalu ada `success: boolean` dan `data` atau `error`.
- Validasi input dengan Zod di setiap endpoint sebelum proses.
- Pagination konsisten: `{ page, limit, total, total_pages }`.

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

## 3. Categories

### GET `/api/categories`

Ambil daftar master kategori tugas (TaskCategory). Diurutkan secara alfabetis.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_category": "uuid",
      "nama_kategori": "Administrasi & Data",
      "icon": "description"
    },
    {
      "id_category": "uuid",
      "nama_kategori": "Fotografi & Videografi",
      "icon": "camera_alt"
    }
  ]
}
```

---

## 4. Tasks

### GET `/api/tasks/map` -> (Diganti menjadi `/api/tasks/nearby`)

Endpoint yang sangat ringan (lightweight) khusus untuk menampilkan *marker* di atas peta. Hanya mereturn data spasial dan ikon kategori.

**Query Parameters:**

| Param      | Type    | Required | Default | Deskripsi                          |
| ---------- | ------- | -------- | ------- | ---------------------------------- |
| `lat`      | number  | Ya       | -       | Latitude posisi user               |
| `lng`      | number  | Ya       | -       | Longitude posisi user              |
| `radius`   | number  | Tidak    | 2000    | Radius pencarian dalam meter       |
| `q`        | string  | Tidak    | -       | Pencarian kata kunci               |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_task": "uuid",
      "latitude": -7.79194,
      "longitude": 111.003746,
      "category_icon": "camera_alt",
      "id_category": "uuid"
    }
  ]
}
```

---

### GET `/api/tasks/feed`

Endpoint utama untuk daftar/feed tugas. Menghasilkan data yang kaya lengkap dengan info Requester, Kalkulasi Jarak, dan mendukung fitur Pagination, Filter Kategori, serta Sorting.

**Query Parameters:**

| Param         | Type    | Required | Default        | Deskripsi                                             |
| ------------- | ------- | -------- | -------------- | ----------------------------------------------------- |
| `lat`         | number  | Ya       | -              | Latitude posisi user                                  |
| `lng`         | number  | Ya       | -              | Longitude posisi user                                 |
| `radius`      | number  | Tidak    | 5000           | Radius pencarian dalam meter                          |
| `q`           | string  | Tidak    | -              | Pencarian teks pada judul/deskripsi                   |
| `id_category` | string  | Tidak    | -              | UUID Kategori untuk filter                            |
| `sort`        | string  | Tidak    | `distance_asc` | `distance_asc`, `price_desc`, `price_asc`, `newest`   |
| `page`        | number  | Tidak    | 1              | Halaman pagination                                    |
| `limit`       | number  | Tidak    | 10             | Jumlah maksimal item per halaman                      |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_task": "uuid",
      "id_requester": "uuid",
      "title": "Foto Produk UMKM",
      "description": "Butuh bantuan foto 20 produk makanan...",
      "duration_estimate": 120,
      "compensation": 50000,
      "created_at": "2026-07-27T10:00:00.000Z",
      "category_name": "Fotografi & Videografi",
      "category_icon": "camera_alt",
      "requester_name": "John Doe",
      "requester_rating": 4.8,
      "requester_completed_tasks": 10,
      "distance": 1.25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

---

### POST `/api/tasks`

🔒 **Authenticated (Requester)** — Membuat tugas baru (mendukung mode Fixed-Price dan Bidding).

**Request Body:**
```json
{
  "judul_tugas": "Fotografi Menu Makanan Cafe",
  "deskripsi_tugas": "Dibutuhkan fotografer untuk 10 menu baru...",
  "estimasi_waktu": "2 Jam",
  "kompensasi": 150000,
  "latitude": -7.79194,
  "longitude": 111.003746,
  "id_category": "uuid-category",
  "skill_requirements": ["uuid-skill-1"],
  "max_applicants": 1,
  "max_apply_attempts": 3,
  "is_bidding": true,
  "budget_min": 100000,
  "budget_max": 150000
}
```

**Validasi & Catatan Escrow:**
- Untuk mode bidding (`is_bidding = true`), `budget_min` & `budget_max` wajib diisi (`budget_min < budget_max`).
- `kompensasi` harus sama dengan `budget_max` sebagai plafon batas atas hold escrow.
- Saldo requester akan di-hold di awal sebesar `budget_max * max_applicants`.

**Response (201):**
```json
{
  "success": true,
  "message": "Task berhasil dibuat.",
  "data": {
    "id_tasks": "uuid",
    "judul_tugas": "Fotografi Menu Makanan Cafe",
    "kompensasi": 150000,
    "is_bidding": true,
    "budget_min": 100000,
    "budget_max": 150000,
    "max_applicants": 1,
    "status": "open"
  }
}
```

---

### POST `/api/tasks/[id]/apply`

🔒 **Authenticated (Worker)** — Mengirimkan lamaran ke tugas tertentu (mendukung pengajuan nominal penawaran `bid_amount`).

**Request Body:**
```json
{
  "pesan": "Saya memiliki kamera DSLR dan pengalaman foto produk UMKM.",
  "bid_amount": 125000
}
```

**Validasi:**
- Pada task mode bidding: `bid_amount` **wajib diisi** dan harus berada dalam rentang `budget_min <= bid_amount <= budget_max`.
- Menggunakan sistem *Sealed-Bid*: Nominal penawaran hanya dapat dilihat oleh Requester pembuat tugas.
- Worker tidak bisa melamar task buatannya sendiri atau melamar melebihi `max_apply_attempts`.

**Response (201):**
```json
{
  "success": true,
  "message": "Lamaran berhasil dikirim.",
  "data": {
    "id_task_applicants": "uuid",
    "id_tasks": "uuid",
    "id_worker": "uuid",
    "bid_amount": 125000,
    "pesan": "Saya memiliki kamera DSLR...",
    "status": "pending",
    "applied_at": "2026-08-16T15:00:00.000Z"
  }
}
```

---

### PATCH `/api/tasks/[id]/apply`

🔒 **Authenticated (Worker)** — Mengubah nominal harga penawaran (*update bid*) yang masih berstatus `pending`.

**Request Body:**
```json
{
  "bid_amount": 120000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Penawaran berhasil diperbarui.",
  "data": {
    "id_task_applicants": "uuid",
    "bid_amount": 120000
  }
}
```

---

### DELETE `/api/tasks/[id]/apply`

🔒 **Authenticated (Worker)** — Membatalkan lamaran/penawaran yang diajukan.

**Response (200):**
```json
{
  "success": true,
  "message": "Lamaran berhasil dibatalkan."
}
```

---

### GET `/api/tasks/[id]/bids`

🔒 **Authenticated (Requester Pemilik Task)** — Melihat seluruh daftar penawaran harga pelamar (Sealed Bids) diurutkan dari penawaran terendah.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "task_id": "uuid",
    "is_bidding": true,
    "budget_min": 100000,
    "budget_max": 150000,
    "total_bids": 4,
    "lowest_bid": 110000,
    "highest_bid": 145000,
    "bids": [
      {
        "id_task_applicants": "uuid-app-1",
        "worker_id": "uuid-worker-1",
        "worker_name": "Budi Santoso",
        "worker_avatar": "https://...",
        "rating": 4.9,
        "total_completed": 12,
        "bid_amount": 110000,
        "message": "Siap kerja hari ini",
        "status": "pending",
        "applied_at": "2026-08-16T15:10:00.000Z"
      }
    ]
  }
}
```

---

### POST `/api/tasks/applicants/[id]`

🔒 **Authenticated (Requester)** — Menerima (*accept*) atau menolak (*reject*) lamaran pelamar tertentu.

**Request Body (Accept):**
```json
{
  "action": "accept"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "alasan_penolakan": "Kualifikasi portofolio belum sesuai."
}
```

**Logika Escrow & Refund (Model C):**
- Saat `action: "accept"` disetujui pada task bidding:
  - Worker diterima dengan nilai kontrak `bid_amount`.
  - Selisih `(budget_max - bid_amount)` otomatis di-refund ke saldo Requester seketika.
  - Alokasi slot dicatat pada `held_slots_json`.
- Jika slot penuh (`accepted_count == max_applicants`), sisa pelamar `pending` otomatis diubah statusnya menjadi `rejected`.

**Response (200):**
```json
{
  "success": true,
  "message": "Pelamar berhasil diterima.",
  "data": {
    "id_task_applicants": "uuid",
    "status": "accepted",
    "bid_accepted": 110000,
    "refund_amount": 40000
  }
}
```

---

### GET `/api/tasks/applications/me`

🔒 **Authenticated (Worker)** — Melihat daftar lamaran yang pernah diajukan oleh user saat ini.

**Query Parameters:**

| Param    | Type   | Required | Default | Deskripsi                                        |
| -------- | ------ | -------- | ------- | ------------------------------------------------ |
| `status` | string | Tidak    | -       | Filter status lamaran (`PENDING`, `ACCEPTED`, dll) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_task_applicants": "uuid",
      "applied_at": "2026-08-03T10:00:00.000Z",
      "bid_amount": 110000,
      "status_applicant": {
        "nama_status": "PENDING"
      },
      "task": {
        "judul_tugas": "Perbaiki Pipa Bocor",
        "kompensasi": 100000,
        "is_bidding": true,
        "status_task": {
          "nama_status": "OPEN"
        },
        "requester": {
          "nama_lengkap": "Bapak Budi",
          "rating_avg": 4.5,
          "total_completed": 5
        }
      }
    }
  ]
}
```
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

## 10. Chat (Real-time Messaging)

### GET `/api/chat`

🔒 **Authenticated** — Ambil daftar ruang obrolan (*chat rooms*) yang melibatkan pengguna saat ini (baik sebagai pembuat tugas maupun pekerja).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id_chat_room": "uuid",
      "created_at": "2023-01-01T00:00:00Z",
      "task": {
        "judul_tugas": "Nama Tugas"
      },
      "requester": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Requester",
        "avatar_url": "url_foto"
      },
      "worker": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Pekerja",
        "avatar_url": "url_foto"
      },
      "messages": [
        {
          "id_message": "uuid",
          "teks_pesan": "Isi pesan terakhir",
          "image_url": null,
          "created_at": "2023-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### POST `/api/chat/init`

🔒 **Authenticated** — Membuat ruang obrolan baru atau mendapatkan ruangan obrolan yang sudah ada untuk sebuah tugas antara pembuat tugas dan pekerja.

**Request Body:**
```json
{
  "id_tasks": "uuid",
  "id_worker": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_chat_room": "uuid"
  }
}
```

### GET `/api/chat/[roomId]`

🔒 **Authenticated** — Mengambil seluruh isi pesan di dalam satu ruang obrolan secara urut dari yang paling lama.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id_message": "uuid",
      "id_sender": "uuid",
      "teks_pesan": "Halo mas",
      "image_url": null,
      "is_read": true,
      "created_at": "2023-01-01T00:00:00Z",
      "sender": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Pengirim",
        "avatar_url": "url_foto"
      }
    }
  ]
}
```

### POST `/api/chat/[roomId]`

🔒 **Authenticated** — Mengirim pesan teks atau gambar ke dalam ruang obrolan tertentu.

**Request Body:** (Zod Validated, minimal satu dari teks atau gambar harus ada)
```json
{
  "teks_pesan": "Halo mas",
  "image_url": "https://url.com/gambar.jpg"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_message": "uuid",
    "id_chat_room": "uuid",
    "id_sender": "uuid",
    "teks_pesan": "Halo mas",
    "image_url": "https://url.com/gambar.jpg",
    "is_read": false,
    "created_at": "2023-01-01T00:00:00Z",
    "sender": {
      "id_user": "uuid",
      "nama_lengkap": "Nama Pengirim",
      "avatar_url": "url_foto"
    }
  }
}
```

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

## 10. Chat (Real-time Messaging)

### GET `/api/chat`

🔒 **Authenticated** — Ambil daftar ruang obrolan (*chat rooms*) yang melibatkan pengguna saat ini (baik sebagai pembuat tugas maupun pekerja).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id_chat_room": "uuid",
      "created_at": "2023-01-01T00:00:00Z",
      "task": {
        "judul_tugas": "Nama Tugas"
      },
      "requester": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Requester",
        "avatar_url": "url_foto"
      },
      "worker": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Pekerja",
        "avatar_url": "url_foto"
      },
      "messages": [
        {
          "id_message": "uuid",
          "teks_pesan": "Isi pesan terakhir",
          "image_url": null,
          "created_at": "2023-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

### POST `/api/chat/init`

🔒 **Authenticated** — Membuat ruang obrolan baru atau mendapatkan ruangan obrolan yang sudah ada untuk sebuah tugas antara pembuat tugas dan pekerja.

**Request Body:**
```json
{
  "id_tasks": "uuid",
  "id_worker": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_chat_room": "uuid"
  }
}
```

### GET `/api/chat/[roomId]`

🔒 **Authenticated** — Mengambil seluruh isi pesan di dalam satu ruang obrolan secara urut dari yang paling lama.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id_message": "uuid",
      "id_sender": "uuid",
      "teks_pesan": "Halo mas",
      "image_url": null,
      "is_read": true,
      "created_at": "2023-01-01T00:00:00Z",
      "sender": {
        "id_user": "uuid",
        "nama_lengkap": "Nama Pengirim",
        "avatar_url": "url_foto"
      }
    }
  ]
}
```

### POST `/api/chat/[roomId]`

🔒 **Authenticated** — Mengirim pesan teks atau gambar ke dalam ruang obrolan tertentu.

**Request Body:** (Zod Validated, minimal satu dari teks atau gambar harus ada)
```json
{
  "teks_pesan": "Halo mas",
  "image_url": "https://url.com/gambar.jpg"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_message": "uuid",
    "id_chat_room": "uuid",
    "id_sender": "uuid",
    "teks_pesan": "Halo mas",
    "image_url": "https://url.com/gambar.jpg",
    "is_read": false,
    "created_at": "2023-01-01T00:00:00Z",
    "sender": {
      "id_user": "uuid",
      "nama_lengkap": "Nama Pengirim",
      "avatar_url": "url_foto"
    }
  }
}
```

### PUT `/api/chat/[roomId]`

🔒 **Authenticated** — Menandai semua pesan yang dikirim oleh **lawan bicara** di ruang obrolan ini sebagai telah dibaca (`is_read: true`). Ini digunakan untuk memicu centang 2 biru secara *real-time*.

**Response (200 OK):**
```json
{
  "success": true,
  "updated_count": 2
}
```

---

## 11. Admin & User Moderation APIs

### GET `/api/admin/users`

🔒 **Admin Auth** — Mengambil daftar seluruh pengguna terdaftar dengan pagination, filter role, dan pencarian.

**Query Parameters:**
- `search` (optional): Kata kunci nama, email, atau username
- `role` (optional): Filter role (`All`, `Worker`, `Requester`, `Admin`)
- `page` (default: 1)
- `limit` (default: 10)

---

### POST `/api/admin/users/[userId]/suspend`

🔒 **Admin Auth** — Menangguhkan akun pengguna (Permanent / Temporary).

**Request Body:**
```json
{
  "type": "TEMPORARY",
  "reason": "Pelanggaran pedoman komunitas",
  "duration_hours": 168,
  "duration_days": 7
}
```

---

### POST `/api/admin/users/[userId]/unsuspend`

🔒 **Admin Auth** — Mencabut status penangguhan pengguna dan mengaktifkan kembali akun.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status penangguhan untuk Nama User berhasil dicabut. User sudah aktif kembali."
}
```

---

### POST `/api/admin/users/[userId]/warning`

🔒 **Admin Auth** — Mengirimkan pesan peringatan resmi ke notifikasi inbox pengguna.

**Request Body:**
```json
{
  "message": "Harap lengkapi informasi profil Anda dengan data yang valid."
}
```

---

## 12. User Reports & Admin Global Search APIs

### POST `/api/reports`

🔒 **Authenticated User** — Mengirimkan laporan masalah/aduan dari pengguna ke Admin.

**Request Body:**
```json
{
  "kategori": "Kendala Teknis / Bug",
  "subjek": "Gagal tarik saldo poin",
  "deskripsi": "Saat klik tarik saldo muncul pesan error 500 pada jam 14:00"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan Anda berhasil dikirim ke Admin.",
  "data": {
    "id_report": "uuid",
    "kategori": "Kendala Teknis / Bug",
    "subjek": "Gagal tarik saldo poin",
    "status": "pending",
    "created_at": "2026-08-13T20:00:00.000Z"
  }
}
```

---

### GET `/api/admin/search`

🔒 **Admin Auth** — Pencarian global real-time (debounced) di seluruh database admin: Menu, Pengguna, Task, dan Kategori.

**Query Parameters:**
- `q`: Kata kunci pencarian (min 1 karakter)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "menus": [
      { "title": "User Management", "url": "/admin/users", "description": "...", "icon": "Users" }
    ],
    "users": [
      { "id": "uuid", "nama_lengkap": "Budi Santoso", "email": "budi@gmail.com", "role": "Worker" }
    ],
    "tasks": [
      { "id": "uuid", "judul_tugas": "Desain Banner", "kompensasi": 50000, "status": "open" }
    ],
    "categories": [
      { "id": "uuid", "nama_kategori": "Desain Grafis", "total_tasks": 12 }
    ]
  }
}
```

---

### GET `/api/admin/reports`

🔒 **Admin Auth** — Mengambil daftar laporan pengguna terdaftar dengan pagination, filter status, dan statistik.

**Query Parameters:**
- `search` (optional): Filter kata kunci subjek, deskripsi, atau nama pelapor
- `status` (optional): Filter status (`All`, `pending`, `reviewed`, `resolved`, `rejected`)
- `id` (optional): Ambil laporan spesifik berdasarkan ID
- `page` (default: 1)
- `limit` (default: 10)

---

### PATCH `/api/admin/reports/[reportId]`

🔒 **Admin Auth** — Memperbarui status laporan user (`reviewed`, `resolved`, `rejected`) dan mengirimkan notifikasi update ke user.

**Request Body:**
```json
{
  "status": "resolved"
}
```

---

### GET `/api/admin/notifications`

🔒 **Admin Auth** — Mengambil daftar notifikasi khusus admin (`user_report`, `report`, `dispute`, `admin_alert`) dan jumlah belum dibaca.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "user_report",
      "title": "Laporan Baru dari Budi Santoso",
      "message": "[Kendala Teknis / Bug] Gagal tarik saldo poin",
      "is_read": false,
      "created_at": "2026-08-13T20:00:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

---

## 13. Catatan untuk AI Agent

- Semua API route ada di `src/app/api/` menggunakan Next.js App Router conventions (`route.ts` file).
- Auth check: gunakan `createServerClient` dari `@supabase/ssr` lalu `supabase.auth.getUser()`.
- Untuk geo-queries, buat Supabase RPC function (`get_nearby_tasks`) dan panggil via `supabase.rpc()`.
- Response format harus konsisten: selalu ada `success: boolean` dan `data` atau `error`.
- Validasi input dengan Zod di setiap endpoint sebelum proses.
- Pagination konsisten: `{ page, limit, total, total_pages }`.

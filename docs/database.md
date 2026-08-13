# Skema Database — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan

- **Database**: PostgreSQL (via Supabase)
- **Extension wajib**: `postgis` (untuk geo-query radius)
- **Realtime**: Supabase Realtime diaktifkan pada tabel `tasks`, `notifications`, `task_applicants`

> Skema ini mengikuti ERD resmi tim versi terbaru (file `Itechno_drawio.html`, diagram "ERD") — 13 tabel. Dua tabel baru ditambahkan sejak revisi sebelumnya: **`chat_room`** dan **`message`**. Kolom `kompensasi` juga sudah ditambahkan ke `tasks` (menjawab poin "belum difinalisasi" di revisi sebelumnya).
>
> ⚠️ Ada file `database.md` versi lain yang sempat beredar (dari rekan tim) yang memakai skema `profiles`/`point_transactions` + Prisma ORM — itu **tidak dipakai** di sini karena tidak sesuai ERD terbaru dan belum dikonfirmasi tim (lihat §7 poin Prisma).

---


## 2. Diagram Relasi Entitas (ERD)

```text
┌──────────────┐       ┌──────────────────┐       ┌───────────────┐
│     User     │       │       Task       │       │    Reviews    │
│──────────────│       │──────────────────│       │───────────────│
│ id_user (PK) │──┐    │ id_tasks (PK)    │    ┌──│ id_reviews(PK)│
│ auth_id      │  │    │ judul_tugas      │    │  │ id_tasks (FK) │
│ username     │  ├───▶│ id_requester(FK) │◀───┤  │ id_rater (FK) │
│ email        │  │    │ id_status_task   │◀───┘  │ id_ratee (FK) │
│ total_balance│  │    │ id_category (FK) │       │ rating        │
└──────────────┘  │    └──────────────────┘       └───────────────┘
                  │    ┌──────────────────┐       ┌───────────────┐
                  │    │  TaskCategory    │       │  Notifications│
                  │    │──────────────────│       │───────────────│
                  │    │ id_category (PK) │◀───┐  │ id_notif (PK) │
                  │    │ nama_kategori    │    │  │ user_id (FK)  │
                  │    │ icon             │    │  └───────────────┘
                  │    └──────────────────┘    │
                  │    ┌──────────────────┐    │
                  │    │  TaskApplicants  │    │
                  │    │──────────────────│    │
                  ├───▶│ id_task_app..(PK)│    │
                  │    │ id_tasks (FK)    │────┘
                  │    │ id_worker (FK)   │
                  │    └──────────────────┘
                  │    ┌──────────────────┐       ┌─────────────────┐
                  │    │    ChatRoom      │       │  Transactions   │
                  │    │──────────────────│       │─────────────────│
                  └───▶│ id_chat_room (PK)│       │ id_trans (PK)   │
                       │ id_tasks (FK)    │       │ id_user (FK)    │
                       │ id_requester (FK)│       │ nominal         │
                       │ id_worker (FK)   │       │ tipe_transaksi  │
                       └──────────────────┘       └─────────────────┘
                                ▲
                                │
                       ┌──────────────────┐
                       │     Message      │
                       │──────────────────│
                       │ id_message (PK)  │
                       │ id_chat_room (FK)│
                       │ id_sender (FK)   │
                       │ teks_pesan       │
                       │ image_url        │
                       └──────────────────┘
```

## 2. Daftar Tabel (dari ERD)

| Tabel                    | Deskripsi                                              |
| ------------------------ | ------------------------------------------------------ |
| `role`                   | Master role (requester / worker / admin)               |
| `user`                   | Akun pengguna                                          |
| `skills_master`          | Master daftar skill                                    |
| `skills_user`            | Skill yang dimiliki user (junction, dengan portofolio) |
| `tasks`                  | Task/micro-job                                         |
| `status_task`            | Master status task                                     |
| `task_requirements`      | Skill yang dibutuhkan suatu task (junction task↔skill) |
| `task_applicants`        | Worker yang apply ke suatu task                        |
| `status_task_applicants` | Master status lamaran                                  |
| `reviews`                | Rating & review antar user setelah task selesai        |
| `transactions`           | Log transaksi saldo user                               |
| `notifications`          | Notifikasi in-app (terpisah antara user & admin types) |
| `chat_room`              | Ruang chat antara requester & worker per task          |
| `message`                | Pesan dalam suatu chat_room                            |
| `AdminSession`           | Sesi autentikasi admin console                         |
| `UserReport`             | Laporan aduan & masalah dari pengguna ke admin         |

---

## 3. Skema Definisi Tabel (DDL Lengkap)


Berikut adalah definisi struktur tabel secara menyeluruh, termasuk penambahan ekstensi spasial, indeks pencarian, dan relasi kunci asing (*Foreign Keys*) yang digunakan pada proyek ini.

> [!WARNING]
> **Penting: Case-Sensitivity pada Status (Mirip Enum)**
> Saat melakukan *query* Prisma untuk mencari berdasarkan string di tabel referensi (seperti `status_task` atau `status_task_applicants`), ingat bahwa PostgreSQL dan Prisma secara default bersifat **case-sensitive**. 
> Jika di database status tersimpan sebagai huruf kapital (contoh: `ACCEPTED`), sedangkan query mencari `'accepted'`, hasilnya akan **kosong**. 
> Selalu pastikan menggunakan `mode: 'insensitive'` pada klausa `where` Prisma untuk string enum:
> `where: { nama_status: { equals: 'accepted', mode: 'insensitive' } }`
### 3.1 `role`

### 3.1 Prasyarat Ekstensi dan Enums
```sql

-- Mengaktifkan ekstensi pencarian geospasial (wajib untuk fitur radius/area terdekat)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Arah mutasi saldo (dipakai bersama sub_type di bawah)
CREATE TYPE "TransactionType" AS ENUM ('MASUK', 'KELUAR');

-- Sub-tipe transaksi — sumber kebenaran jenis mutasi, bukan deskripsi teks.
-- topup        : pengisian saldo oleh user (simulasi/mock untuk demo)
-- task_earning : pendapatan worker setelah task selesai
-- task_payment : pembayaran final requester ke worker saat release escrow
-- refund       : pengembalian escrow ke requester saat task di-cancel
-- hold         : escrow ditahan saat requester memposting task
CREATE TYPE "TransactionSubType" AS ENUM ('topup', 'task_earning', 'task_payment', 'refund', 'hold');
```

### 3.2 Tabel Profil dan Entitas Utama (`User` dan `Task`)
```sql
-- Tabel Profil Pengguna (terhubung dengan Supabase Auth melalui auth_id)
CREATE TABLE "User" (
    "id_user" TEXT NOT NULL,
    "id_role" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "pendidikan_terakhir" TEXT,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_completed" INTEGER NOT NULL DEFAULT 0,
    "total_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,  -- total saldo (termasuk yang ditahan)
    "held_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,   -- saldo escrow aktif (ditahan)
    "username" TEXT NOT NULL,
    "alamat" TEXT,
    "no_telpon" TEXT,
    "email" TEXT NOT NULL,
    "auth_id" UUID,
    "fcm_token" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,             -- status penangguhan akun
    "ban_type" TEXT,                                        -- jenis ban: PERMANENT / TEMPORARY
    "ban_reason" TEXT,                                      -- alasan penangguhan dari admin
    "banned_at" TIMESTAMP(3),                               -- timestamp penangguhan dimulai
    "banned_until" TIMESTAMP(3),                            -- tanggal berakhirnya penangguhan (temporary)

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- Saldo yang bisa dipakai user = total_balance - held_balance
-- Keduanya diupdate dalam 1 prisma.$transaction untuk atomicity.

-- Tabel Pekerjaan/Tugas (menyimpan lokasi titik secara presisi)
CREATE TABLE "Task" (
    "id_tasks" TEXT NOT NULL,
    "id_requester" TEXT NOT NULL,
    "id_status_task" TEXT NOT NULL,
    "judul_tugas" TEXT NOT NULL,
    "deskripsi_tugas" TEXT NOT NULL,
    "estimasi_waktu" TEXT,
    "kompensasi" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "worker_started" BOOLEAN NOT NULL DEFAULT FALSE,
    "requester_started" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "lokasi_geo" geography(Point, 4326),
    "id_category" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id_tasks")
);
```

### 3.3 Tabel Aktivitas (Transaksi, Lamaran, dan Ulasan)
```sql
-- Tabel Riwayat Saldo Pengguna
CREATE TABLE "Transactions" (
    "id_transactions" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "tipe_transaksi" "TransactionType" NOT NULL,
    "sub_type" "TransactionSubType" NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id_transactions")
);

-- Tabel Pendaftar Tugas (Pekerja yang mengajukan lamaran)
CREATE TABLE "TaskApplicants" (
    "id_task_applicants" TEXT NOT NULL,
    "id_status_task_applicants" TEXT NOT NULL,
    "id_worker" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskApplicants_pkey" PRIMARY KEY ("id_task_applicants")
);

-- Tabel Ulasan dan Penilaian Performa
CREATE TABLE "Reviews" (
    "id_reviews" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "id_rater" TEXT NOT NULL,
    "id_ratee" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "url_photo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id_reviews")
);

-- Tabel Notifikasi Sistem
CREATE TABLE "Notifications" (
    "id_notifications" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id_notifications")
);

-- Tabel Ruang Obrolan
CREATE TABLE "ChatRoom" (
    "id_chat_room" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "id_requester" TEXT NOT NULL,
    "id_worker" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id_chat_room")
);

-- Tabel Pesan Obrolan
CREATE TABLE "Message" (
    "id_message" TEXT NOT NULL,
    "id_chat_room" TEXT NOT NULL,
    "id_sender" TEXT NOT NULL,
    "teks_pesan" TEXT,
    "image_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id_message")
);
```

### 3.4 Tabel Referensi / Pemetaan (Lookup Tables)
```sql
CREATE TABLE "Role" (
    "id_role" TEXT NOT NULL,
    "nama_role" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id_role")

CREATE TABLE role (
  id_role     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_role   TEXT NOT NULL   -- 'requester' | 'worker' | 'admin'
);
```

### 3.2 `user`

> ✅ **Sudah diimplementasikan dengan Supabase Auth.** Kolom `password` tidak ada di tabel ini — autentikasi dikelola sepenuhnya oleh `auth.users`. `id_user` di-mapping ke `auth.users.id` via kolom `auth_id`. Dua kolom wallet ditambahkan pada migrasi `20260805_wallet_schema.sql`.

```sql
CREATE TABLE "User" (
  id_user               TEXT PRIMARY KEY,    -- mapped ke auth.users.id (UUID sebagai TEXT)
  id_role               TEXT NOT NULL REFERENCES "Role"(id_role),
  nama_lengkap          TEXT NOT NULL,
  avatar_url            TEXT,
  bio                   TEXT,
  pendidikan_terakhir   TEXT,
  rating_avg            DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  total_completed       INTEGER NOT NULL DEFAULT 0,
  total_balance         DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- total saldo (termasuk escrow)
  held_balance          DOUBLE PRECISION NOT NULL DEFAULT 0.0, -- saldo ditahan escrow
  username              TEXT NOT NULL UNIQUE,
  alamat                TEXT,
  no_telpon             TEXT,               -- TEXT, bukan INT (leading zero)
  email                 TEXT NOT NULL UNIQUE,
  auth_id               UUID UNIQUE,        -- FK ke auth.users.id
  fcm_token             TEXT,               -- untuk Firebase Cloud Messaging
  is_banned             BOOLEAN NOT NULL DEFAULT false, -- status penangguhan akun
  ban_type              TEXT,               -- PERMANENT | TEMPORARY
  ban_reason            TEXT,               -- alasan penangguhan dari admin
  banned_at             TIMESTAMP(3),       -- timestamp penangguhan dimulai
  banned_until          TIMESTAMP(3)        -- timestamp kedaluwarsa penangguhan (temporary)
);

-- Saldo tersedia untuk user = total_balance - held_balance
```

### 3.3 `skills_master`

```sql
CREATE TABLE skills_master (
  id_skill_master   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_skill        TEXT NOT NULL UNIQUE
);
```

### 3.4 `skills_user`

```sql
CREATE TABLE skills_user (
  id_skills_user         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user                UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_skills_master        UUID NOT NULL REFERENCES skills_master(id_skill_master) ON DELETE CASCADE,
  deskripsi_pengalaman     TEXT,
  portofolio_url          TEXT,   -- optional
  certificate_url         TEXT,

  UNIQUE(id_user, id_skills_master)
);
```

### 3.5 `status_task`

```sql
CREATE TABLE status_task (
  id_status_task   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_status      TEXT NOT NULL   -- 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
);
```

### 3.6 `tasks`

```sql
CREATE TABLE tasks (
  id_tasks          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_requester       UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_status_task      UUID NOT NULL REFERENCES status_task(id_status_task),
  judul_tugas         TEXT NOT NULL,
  deskripsi_tugas      TEXT NOT NULL,
  estimasi_waktu       INTEGER NOT NULL,     -- menit
  kompensasi          DECIMAL(12,2) NOT NULL,  -- jumlah imbalan (poin/saldo)
  lokasi_geo          GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  accepted_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_tasks_location ON tasks USING GIST (lokasi_geo);
CREATE INDEX idx_tasks_requester ON tasks (id_requester);
CREATE INDEX idx_tasks_status ON tasks (id_status_task);
```

> `kompensasi` sudah masuk ERD terbaru — insert task sekarang wajib menyertakan nilai ini. Saat task `completed`, nilai ini yang dipindah lewat `transactions` dari saldo requester ke worker.

### 3.7 `task_requirements`

Skill yang dibutuhkan suatu task (many-to-many task ↔ skill).

```sql
CREATE TABLE task_requirements (
  id_task_requirements   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tasks               UUID NOT NULL REFERENCES tasks(id_tasks) ON DELETE CASCADE,
  id_skill_master         UUID NOT NULL REFERENCES skills_master(id_skill_master) ON DELETE CASCADE,

  UNIQUE(id_tasks, id_skill_master)
);
```

### 3.8 `status_task_applicants`

```sql
CREATE TABLE status_task_applicants (
  id_status_task_applicants   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_status                 TEXT NOT NULL   -- 'pending' | 'accepted' | 'rejected'
);
```

### 3.9 `task_applicants`

```sql
CREATE TABLE task_applicants (
  id_task_applicants           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_status_task_applicants     UUID NOT NULL REFERENCES status_task_applicants(id_status_task_applicants),
  id_worker                    UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_tasks                     UUID NOT NULL REFERENCES tasks(id_tasks) ON DELETE CASCADE,
  pesan                        TEXT,                            -- pesan singkat saat melamar
  applied_at                   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(id_tasks, id_worker)   -- satu worker hanya bisa apply sekali per task
);
```

### 3.10 `reviews`

```sql
CREATE TABLE reviews (
  id_reviews    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tasks      UUID NOT NULL REFERENCES tasks(id_tasks) ON DELETE CASCADE,
  id_rater      UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_ratee      UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       TEXT,
  url_photo     TEXT,   -- optional
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(id_tasks, id_rater)
);

-- Trigger update rating_avg & total_completed di "user"
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "user"
  SET rating_avg = (
    SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE id_ratee = NEW.id_ratee
  )
  WHERE id_user = NEW.id_ratee;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_rating
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();
```

### 3.11 `transactions`

> ✅ **Skema sudah difinalisasi** pada migrasi `20260805_wallet_schema.sql`. Kolom `sub_type` (enum `TransactionSubType`) adalah sumber kebenaran jenis transaksi — **jangan** andalkan field `deskripsi` untuk menentukan jenis mutasi saldo.

```sql
CREATE TABLE "Transactions" (
  id_transactions   TEXT PRIMARY KEY,
  id_user           TEXT NOT NULL REFERENCES "User"(id_user) ON DELETE CASCADE,
  nominal           DOUBLE PRECISION NOT NULL,  -- selalu positif; arah ditentukan tipe_transaksi
  tipe_transaksi    "TransactionType" NOT NULL,  -- MASUK | KELUAR
  sub_type          "TransactionSubType" NOT NULL, -- sumber kebenaran jenis transaksi
  deskripsi         TEXT,                          -- label human-readable untuk UI
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON "Transactions" (id_user, created_at DESC);
```

**Mapping `sub_type` → `tipe_transaksi`:**

| `sub_type`       | `tipe_transaksi` | Trigger                                      | Efek pada saldo requester          | Efek pada saldo worker    |
| ---------------- | ---------------- | -------------------------------------------- | ---------------------------------- | ------------------------- |
| `topup`          | `MASUK`          | User klik Top Up (mock)                      | `total_balance` ↑                  | —                         |
| `hold`           | `KELUAR`         | Requester posting task                       | `held_balance` ↑ (total tetap)     | —                         |
| `task_payment`   | `KELUAR`         | Requester confirm task selesai (release escrow) | `total_balance` ↓ + `held_balance` ↓ | —                      |
| `task_earning`   | `MASUK`          | Worker terima kompensasi (saat task selesai) | —                                  | `total_balance` ↑         |
| `refund`         | `MASUK`          | Requester cancel task (escrow dilepas)       | `held_balance` ↓ (total tetap)     | —                         |

> **Atomicity**: Setiap operasi yang melibatkan perubahan saldo dilakukan dalam satu `prisma.$transaction([...])`. Lihat `src/services/wallet.service.ts` untuk implementasi lengkap.

### 3.12 `notifications`

```sql
CREATE TABLE notifications (
  id_notifications   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  type               TEXT NOT NULL,
  title              TEXT NOT NULL,
  message            TEXT NOT NULL,
  data               JSONB DEFAULT '{}',
  is_read            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW()

);

CREATE TABLE "TaskCategory" (
    "id_category" TEXT NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "icon" TEXT,
    CONSTRAINT "TaskCategory_pkey" PRIMARY KEY ("id_category")
);

CREATE TABLE "StatusTask" (
    "id_status_task" TEXT NOT NULL,
    "nama_status" TEXT NOT NULL,
    CONSTRAINT "StatusTask_pkey" PRIMARY KEY ("id_status_task")
);

CREATE TABLE "StatusTaskApplicants" (
    "id_status_task_applicants" TEXT NOT NULL,
    "nama_status" TEXT NOT NULL,
    CONSTRAINT "StatusTaskApplicants_pkey" PRIMARY KEY ("id_status_task_applicants")
);

CREATE TABLE "SkillsMaster" (
    "id_skill_master" TEXT NOT NULL,
    "nama_skill" TEXT NOT NULL,
    CONSTRAINT "SkillsMaster_pkey" PRIMARY KEY ("id_skill_master")
);

CREATE TABLE "SkillsUser" (
    "id_skills_user" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_skills_master" TEXT NOT NULL,
    "deskripsi_pengalaman" TEXT,
    "portofolio_url" TEXT,
    "certificate_url" TEXT,
    CONSTRAINT "SkillsUser_pkey" PRIMARY KEY ("id_skills_user")
);

CREATE TABLE "TaskRequirements" (
    "id_task_requirements" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "id_skill_master" TEXT NOT NULL,
    CONSTRAINT "TaskRequirements_pkey" PRIMARY KEY ("id_task_requirements")
);
```


### 3.5 Indeks Unik (Unique Constraints)
```sql
CREATE UNIQUE INDEX "Role_nama_role_key" ON "Role"("nama_role");
CREATE UNIQUE INDEX "TaskCategory_nama_kategori_key" ON "TaskCategory"("nama_kategori");
CREATE UNIQUE INDEX "StatusTask_nama_status_key" ON "StatusTask"("nama_status");
CREATE UNIQUE INDEX "StatusTaskApplicants_nama_status_key" ON "StatusTaskApplicants"("nama_status");
CREATE UNIQUE INDEX "SkillsMaster_nama_skill_key" ON "SkillsMaster"("nama_skill");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_auth_id_key" ON "User"("auth_id");
CREATE UNIQUE INDEX "SkillsUser_id_user_id_skills_master_key" ON "SkillsUser"("id_user", "id_skills_master");
CREATE UNIQUE INDEX "ChatRoom_id_tasks_id_worker_key" ON "ChatRoom"("id_tasks", "id_worker");
```

### 3.6 Relasi Kunci Asing (Foreign Keys)
```sql
-- Relasi Pengguna
ALTER TABLE "User" ADD CONSTRAINT "User_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relasi Tugas
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_requester_fkey" FOREIGN KEY ("id_requester") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_status_task_fkey" FOREIGN KEY ("id_status_task") REFERENCES "StatusTask"("id_status_task") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "TaskCategory"("id_category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Relasi Transaksi dan Notifikasi
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Keahlian (Skills)
ALTER TABLE "SkillsUser" ADD CONSTRAINT "SkillsUser_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillsUser" ADD CONSTRAINT "SkillsUser_id_skills_master_fkey" FOREIGN KEY ("id_skills_master") REFERENCES "SkillsMaster"("id_skill_master") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Kebutuhan Tugas (Task Requirements)
ALTER TABLE "TaskRequirements" ADD CONSTRAINT "TaskRequirements_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskRequirements" ADD CONSTRAINT "TaskRequirements_id_skill_master_fkey" FOREIGN KEY ("id_skill_master") REFERENCES "SkillsMaster"("id_skill_master") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Pelamar Tugas (Task Applicants)
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_status_task_applicants_fkey" FOREIGN KEY ("id_status_task_applicants") REFERENCES "StatusTaskApplicants"("id_status_task_applicants") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_worker_fkey" FOREIGN KEY ("id_worker") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Ulasan (Reviews)
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_rater_fkey" FOREIGN KEY ("id_rater") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_ratee_fkey" FOREIGN KEY ("id_ratee") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- Relasi Obrolan (ChatRoom & Message)
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_id_requester_fkey" FOREIGN KEY ("id_requester") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_id_worker_fkey" FOREIGN KEY ("id_worker") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_chat_room_fkey" FOREIGN KEY ("id_chat_room") REFERENCES "ChatRoom"("id_chat_room") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_id_sender_fkey" FOREIGN KEY ("id_sender") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

### 3.13 `chat_room`

Satu ruang chat per task, antara requester & worker yang sudah `accepted`.

```sql
CREATE TABLE chat_room (
  id_chat_room   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tasks       UUID NOT NULL REFERENCES tasks(id_tasks) ON DELETE CASCADE,
  id_requester    UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  id_worker      UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(id_tasks)   -- satu task hanya punya satu chat_room
);
```

### 3.14 `message`

```sql
CREATE TABLE message (
  id_message    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_room_chat   UUID NOT NULL REFERENCES chat_room(id_chat_room) ON DELETE CASCADE,
  id_sender     UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  teks_pesan    TEXT,
  image_url     TEXT,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_room ON message (id_room_chat, created_at DESC);
```

### 3.15 `UserReport`

Tabel untuk menyimpan laporan aduan dan kendala yang dikirimkan oleh pengguna biasa kepada Admin.

```sql
CREATE TABLE "public"."UserReport" (
    "id_report" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "subjek" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, rejected
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id_report")
);

ALTER TABLE "public"."UserReport" ADD CONSTRAINT "UserReport_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
```

> **Perubahan scope**: `features.md` §5 sebelumnya eksplisit menyatakan chat **tidak** dikerjakan di MVP penyisihan (dianggap kompleks & tidak kritis). ERD terbaru ini menambahkan `chat_room` + `message`, yang berarti keputusan itu perlu ditinjau ulang oleh tim. Jangan implementasikan fitur chat di kode sebelum `features.md` diupdate untuk mencerminkan keputusan final — kalau tetap masuk MVP, itu artinya fase baru perlu ditambahkan ke `features.md` dan `roadmap.md`/`strategy.md` (alokasi waktu W-nya belum ada).

---

## 4. Contoh Kueri Geospasial (PostGIS)

Meskipun struktur ditangani oleh Prisma, kueri yang melibatkan kalkulasi jarak absolut wajib menggunakan `prisma.$queryRaw`:


```typescript
const radiusMeters = 2000;
const tasksNearMe = await prisma.$queryRaw`
  SELECT 
    id_tasks, judul_tugas, deskripsi_tugas, 
    ST_Distance(lokasi_geo, ST_MakePoint(${lng}, ${lat})::geography) AS distance_m
  FROM "Task"
  WHERE ST_DWithin(
    lokasi_geo, 
    ST_MakePoint(${lng}, ${lat})::geography, 
    ${radiusMeters}
  )
  ORDER BY distance_m ASC;
`;

```sql
SELECT
  t.*,
  ST_Distance(t.lokasi_geo, ST_MakePoint(:lng, :lat)::GEOGRAPHY) AS distance_m
FROM tasks t
JOIN status_task st ON st.id_status_task = t.id_status_task
WHERE
  st.nama_status = 'open'
  AND ST_DWithin(
    t.lokasi_geo,
    ST_MakePoint(:lng, :lat)::GEOGRAPHY,
    2000
  )
ORDER BY distance_m ASC;
```

### 4.2 Insert task dengan lokasi

```sql
INSERT INTO tasks (id_requester, id_status_task, judul_tugas, deskripsi_tugas, estimasi_waktu, kompensasi, lokasi_geo)
VALUES (
  :requester_id,
  (SELECT id_status_task FROM status_task WHERE nama_status = 'open'),
  'Foto Produk UMKM',
  'Butuh bantuan foto 20 produk makanan untuk katalog online',
  120,
  50,
  ST_MakePoint(:lng, :lat)::GEOGRAPHY   -- longitude dulu, baru latitude
);

```

---

## 5. Keamanan Row Level Security (RLS)


Implementasi keamanan data dikelola secara terpisah dari Prisma melalui berkas `supabase/migrations/20260729_enable_rls.sql`. 
- Kueri `INSERT` diblokir secara mutlak pada tabel `Transactions` dari akses klien eksternal.
- Sistem memvalidasi otoritas pengubahan data dengan mencocokkan `auth_id` dari token JWT dengan tabel `User`.

```sql
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user profiles"
  ON "user" FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON "user" FOR UPDATE USING (auth.uid() = id_user);

CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT WITH CHECK (auth.uid() = id_requester);

CREATE POLICY "Users can only view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only participants can view chat_room"
  ON chat_room FOR SELECT USING (
    auth.uid() = id_requester OR auth.uid() = id_worker
  );

CREATE POLICY "Only participants can view messages"
  ON message FOR SELECT USING (
    id_room_chat IN (
      SELECT id_chat_room FROM chat_room
      WHERE auth.uid() = id_requester OR auth.uid() = id_worker
    )
  );
```

---

## 6. Catatan untuk AI Agent

- ERD ini adalah **dasar awalan resmi** tim (dari `Itechno_drawio.html`) — bisa berubah seiring development, tapi jadi acuan sampai ada revisi baru.
- Nama tabel/kolom pakai gaya campuran (`id_tasks`, `judul_tugas`, dst) sesuai ERD asli — **jangan** diganti ke gaya `snake_case` generik (`task_id`, `title`) tanpa persetujuan tim, supaya konsisten dengan diagram.
- `"User"` adalah nama tabel yang di-quote (PascalCase sesuai Prisma model). Di SQL mentah selalu tulis `"User"` — bukan `user` (reserved word PostgreSQL).
- Lokasi disimpan sebagai `GEOGRAPHY(POINT, 4326)` — parameter `(longitude, latitude)`, perhatikan urutan.
- Gunakan `.rpc()` di Supabase client untuk geo-query, karena PostGIS function tidak bisa langsung dari query builder biasa.
- Setiap perubahan skema didokumentasikan di `supabase/migrations/`.

### Keputusan yang Sudah Difinalisasi (tidak perlu tanya lagi)

| Topik | Keputusan |
| --- | --- |
| Auth | Supabase Auth. `password` tidak ada di tabel `User` — dikelola `auth.users`. |
| ORM | **Prisma ORM v7** (`@prisma/adapter-pg`) dipakai untuk semua query DB. Supabase client (`@supabase/ssr`) dipakai hanya untuk Auth & Realtime. |
| `transactions.sub_type` | Enum `TransactionSubType` (`topup`, `task_earning`, `task_payment`, `refund`, `hold`) — sudah di DB. |
| Escrow wallet | `held_balance` eksplisit di `User`. Saldo tersedia = `total_balance - held_balance`. Diupdate atomik via `prisma.$transaction`. |

### Hal yang Masih Terbuka

- **Status fitur chat** (`chat_room`, `message`) — ERD sudah mencantumkannya tapi `features.md` masih menyatakan chat di luar scope MVP. Jangan implementasikan endpoint/UI chat sampai dikonfirmasi tim dan `features.md` diupdate.

### Referensi Implementasi Wallet

- Service layer: `src/services/wallet.service.ts`
- API routes: `src/app/api/points/{balance,history,topup}/route.ts`
- React hook: `src/hooks/useWallet.ts`
- Halaman: `src/app/(main)/wallet/page.tsx`
- Migration SQL: `supabase/migrations/20260805_wallet_schema.sql`

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
| `notifications`          | Notifikasi in-app                                      |
| `chat_room`              | Ruang chat antara requester & worker per task (BARU)   |
| `message`                | Pesan dalam suatu chat_room (BARU)                     |

---

## 3. Skema Definisi Tabel (DDL Lengkap)


Berikut adalah definisi struktur tabel secara menyeluruh, termasuk penambahan ekstensi spasial, indeks pencarian, dan relasi kunci asing (*Foreign Keys*) yang digunakan pada proyek ini.

### 3.1 `role`

### 3.1 Prasyarat Ekstensi dan Enums
```sql

-- Mengaktifkan ekstensi pencarian geospasial (wajib untuk fitur radius/area terdekat)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tipe data spesifik untuk mutasi saldo
CREATE TYPE "TransactionType" AS ENUM ('MASUK', 'KELUAR');
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
    "total_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "username" TEXT NOT NULL,
    "alamat" TEXT,
    "no_telpon" TEXT,
    "email" TEXT NOT NULL,
    "auth_id" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- Tabel Pekerjaan/Tugas (menyimpan lokasi titik secara presisi)
CREATE TABLE "Task" (
    "id_tasks" TEXT NOT NULL,
    "id_requester" TEXT NOT NULL,
    "id_status_task" TEXT NOT NULL,
    "judul_tugas" TEXT NOT NULL,
    "deskripsi_tugas" TEXT NOT NULL,
    "estimasi_waktu" TEXT,
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

```sql
CREATE TABLE "user" (
  id_user               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_role                UUID NOT NULL REFERENCES role(id_role),
  nama_lengkap           TEXT NOT NULL,
  avatar_url             TEXT,
  bio                    TEXT,
  pendidikan_terakhir     TEXT,
  rating_avg             DECIMAL(3,2) DEFAULT 0.00,
  total_completed         INTEGER DEFAULT 0,
  total_balance           DECIMAL(12,2) DEFAULT 0,
  username               TEXT NOT NULL UNIQUE,
  alamat                 TEXT,
  no_telpon               TEXT,             -- disimpan sebagai TEXT, bukan INT (leading zero, format lokal)
  email                   TEXT NOT NULL UNIQUE,
  password                TEXT NOT NULL,     -- hashed (Supabase Auth menangani ini jika pakai auth.users)
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

> **Catatan implementasi:** ERD menggambar `user` sebagai tabel mandiri dengan kolom `password` sendiri. Jika tim tetap pakai **Supabase Auth** (disarankan — sesuai `techstack.md` & `deployment.md`), maka `password` cukup dikelola oleh `auth.users` dan tabel `user` di sini menjadi **extension profile** dengan `id_user` = `auth.users.id`, tanpa kolom `password` duplikat. Perlu dikonfirmasi ke tim mana yang dipakai sebelum migration final ditulis.

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

```sql
CREATE TABLE transactions (
  id_transactions   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user           UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  nominal           DECIMAL(12,2) NOT NULL,   -- positif = masuk, negatif = keluar
  tipe_transaksi     TEXT NOT NULL,            -- belum difinalisasi, lihat catatan di bawah
  deskripsi         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions (id_user, created_at DESC);
```

> **Belum difinalisasi**: nilai valid untuk `tipe_transaksi`. Usulan mengikuti pola sebelumnya: `'topup'`, `'earning'`, `'payment'`, `'withdrawal'` — perlu dikonfirmasi tim lalu ditambahkan `CHECK` constraint.

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
- `"user"` adalah reserved word di PostgreSQL — selalu quote sebagai `"user"` di SQL mentah; di Supabase client biasanya aman karena lewat query builder.
- Hal yang **masih belum difinalisasi**, jangan diasumsikan sendiri oleh AI agent — tanyakan/tunggu keputusan tim:
  1. Apakah `user.password` dikelola sendiri atau pakai Supabase Auth (`auth.users`) — mempengaruhi apakah tabel `user` perlu kolom `password`.
  2. Nilai valid `transactions.tipe_transaksi` — belum ada `CHECK` constraint.
  3. **Status fitur chat** (`chat_room`, `message`) — ERD sudah mencantumkannya tapi `features.md` masih bilang chat di luar scope MVP. Jangan implementasikan endpoint/UI chat sampai ini eksplisit dikonfirmasi tim dan `features.md` diupdate.
  4. **ORM**: ada versi `database.md` lain (dari rekan tim) yang menyebut Prisma ORM v7 + `@prisma/adapter-pg` dan bridging `auth_id`. Ini **belum dipakai** di skema ini karena (a) konflik dengan `techstack.md` yang menetapkan `@supabase/supabase-js` + `@supabase/ssr` langsung tanpa ORM, dan (b) penamaan kolom Prisma (PascalCase model, `authId`) tidak cocok dengan ERD yang pakai snake_case (`id_user`, dst). Perlu keputusan tim: pindah ke Prisma (dan sesuaikan seluruh dokumentasi lain), atau tetap Supabase client langsung.
- Lokasi disimpan sebagai `GEOGRAPHY(POINT, 4326)` — parameter `(longitude, latitude)`, perhatikan urutan.
- Gunakan `.rpc()` di Supabase client untuk geo-query, karena PostGIS function tidak bisa langsung dari query builder biasa.
- Setiap perubahan skema didokumentasikan di `supabase/migrations/`.

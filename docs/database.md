# Skema Database — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan

- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma ORM v7 (`prisma/schema.prisma`) dengan `@prisma/adapter-pg` driver adapter
- **Extension wajib**: `postgis` (untuk geo-query radius)
- **Auth Bridging**: Supabase Auth (tabel `auth.users` terhubung ke tabel Prisma `User` melalui kolom `auth_id` UUID)
- **Security**: Row Level Security (RLS) diaktifkan pada semua tabel via script SQL (`supabase/migrations/20260729_enable_rls.sql`)

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
│ total_balance│  │    │ lokasi_geo       │       │ rating        │
└──────────────┘  │    └──────────────────┘       └───────────────┘
                  │    ┌──────────────────┐       │  Notifications  │
                  │    │  TaskApplicants  │       │─────────────────│
                  │    │──────────────────│       │ id_notif (PK)   │
                  ├───▶│ id_task_app..(PK)│       │ user_id (FK)    │
                  │    │ id_tasks (FK)    │       │ title           │
                  │    │ id_worker (FK)   │       │ message         │
                  │    └──────────────────┘       └─────────────────┘
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

---

## 3. Skema Definisi Tabel (DDL Lengkap)

Berikut adalah definisi struktur tabel secara menyeluruh, termasuk penambahan ekstensi spasial, indeks pencarian, dan relasi kunci asing (*Foreign Keys*) yang digunakan pada proyek ini.

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
```

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
```

---

## 5. Keamanan Row Level Security (RLS)

Implementasi keamanan data dikelola secara terpisah dari Prisma melalui berkas `supabase/migrations/20260729_enable_rls.sql`. 
- Kueri `INSERT` diblokir secara mutlak pada tabel `Transactions` dari akses klien eksternal.
- Sistem memvalidasi otoritas pengubahan data dengan mencocokkan `auth_id` dari token JWT dengan tabel `User`.

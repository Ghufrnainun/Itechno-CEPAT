# Database Schema — KerjaMicro

## 1. Overview

- **Database**: PostgreSQL (via Supabase)
- **Extension wajib**: `postgis` (untuk geo-query radius)
- **Auth**: Supabase Auth (tabel `auth.users` managed oleh Supabase, kita buat tabel `profiles` sebagai extension)
- **Realtime**: Supabase Realtime diaktifkan pada tabel `tasks` dan `notifications`

---

## 2. Entity Relationship Diagram (ERD)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   profiles   │       │      tasks       │       │   reviews    │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK/FK)   │──┐    │ id (PK)          │    ┌──│ id (PK)      │
│ full_name    │  │    │ title            │    │  │ task_id (FK) │
│ avatar_url   │  │    │ description      │    │  │ reviewer_id  │
│ bio          │  ├───▶│ requester_id(FK) │◀───┤  │ reviewee_id  │
│ university   │  │    │ worker_id (FK)   │◀───┘  │ rating       │
│ skills[]     │  │    │ category         │       │ comment      │
│ reputation   │  │    │ location (geo)   │       │ created_at   │
│ total_points │  │    │ address_text     │       └──────────────┘
│ role_pref    │  │    │ radius_m         │
│ fcm_token    │  │    │ estimated_time   │       ┌──────────────────┐
│ created_at   │  │    │ compensation     │       │  notifications   │
│ updated_at   │  │    │ status           │       │──────────────────│
└──────────────┘  │    │ created_at       │       │ id (PK)          │
                  │    │ updated_at       │       │ user_id (FK)     │
                  │    │ accepted_at      │       │ type             │
                  │    │ completed_at     │       │ title            │
                  │    └──────────────────┘       │ message          │
                  │                               │ data (jsonb)     │
                  │    ┌──────────────────┐       │ is_read          │
                  │    │  task_applicants │       │ created_at       │
                  │    │──────────────────│       └──────────────────┘
                  │    │ id (PK)          │
                  └───▶│ task_id (FK)     │       ┌──────────────────┐
                       │ worker_id (FK)  │       │ point_transactions│
                       │ message         │       │──────────────────│
                       │ applied_at      │       │ id (PK)          │
                       │ status          │       │ user_id (FK)     │
                       └──────────────────┘       │ task_id (FK)     │
                                                  │ amount           │
                                                  │ type             │
                                                  │ description      │
                                                  │ created_at       │
                                                  └──────────────────┘
```

---

## 3. Tabel Detail

### 3.1 `profiles`

Extension dari `auth.users`. ID sama dengan `auth.users.id`.

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  university    TEXT,                          -- universitas / instansi
  skills        TEXT[] DEFAULT '{}',           -- array of skill tags
  reputation    DECIMAL(3,2) DEFAULT 0.00,     -- rata-rata rating (0.00 - 5.00)
  total_reviews INTEGER DEFAULT 0,
  total_points  INTEGER DEFAULT 100,           -- saldo poin awal (bonus registrasi)
  role_pref     TEXT DEFAULT 'both'            -- 'requester' | 'worker' | 'both'
                CHECK (role_pref IN ('requester', 'worker', 'both')),
  fcm_token     TEXT,                          -- Firebase Cloud Messaging token
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk search by skill
CREATE INDEX idx_profiles_skills ON profiles USING GIN (skills);
```

### 3.2 `tasks`

Tabel utama task/micro-job.

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,               -- kategori skill (e.g. 'fotografi', 'data_entry')
  requester_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Geolocation (PostGIS)
  location        GEOGRAPHY(POINT, 4326) NOT NULL,  -- titik lokasi task
  address_text    TEXT,                              -- alamat readable (opsional)
  
  -- Task details
  estimated_time  INTEGER NOT NULL,            -- estimasi waktu dalam menit
  compensation    INTEGER NOT NULL,            -- jumlah poin kompensasi
  
  -- Status tracking
  status          TEXT DEFAULT 'open'
                  CHECK (status IN ('open', 'accepted', 'in_progress', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Index geospasial untuk radius query cepat
CREATE INDEX idx_tasks_location ON tasks USING GIST (location);

-- Index untuk filter status + tanggal
CREATE INDEX idx_tasks_status_created ON tasks (status, created_at DESC);

-- Index untuk lookup by requester / worker
CREATE INDEX idx_tasks_requester ON tasks (requester_id);
CREATE INDEX idx_tasks_worker ON tasks (worker_id);
```

### 3.3 `task_applicants`

Tabel junction: worker yang apply ke suatu task.

```sql
CREATE TABLE task_applicants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT,                            -- pesan singkat saat apply
  status      TEXT DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, worker_id)                  -- satu worker hanya bisa apply sekali per task
);
```

### 3.4 `reviews`

Rating & review setelah task selesai.

```sql
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(task_id, reviewer_id)                -- satu reviewer hanya bisa review sekali per task
);

-- Trigger untuk update reputation di profiles setelah review baru
CREATE OR REPLACE FUNCTION update_reputation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    reputation = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    updated_at = NOW()
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reputation
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reputation();
```

### 3.5 `notifications`

Notifikasi in-app.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                   -- 'task_applied', 'task_accepted', 'task_completed', 'review_received', 'points_received'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB DEFAULT '{}',             -- metadata tambahan (task_id, sender_id, dll)
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);
```

### 3.6 `point_transactions`

Log transaksi poin.

```sql
CREATE TABLE point_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  amount      INTEGER NOT NULL,               -- positif = masuk, negatif = keluar
  type        TEXT NOT NULL                    -- 'task_payment', 'task_earning', 'topup', 'bonus'
              CHECK (type IN ('task_payment', 'task_earning', 'topup', 'bonus')),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_user ON point_transactions (user_id, created_at DESC);
```

---

## 4. PostGIS Geo-Query Contoh

### 4.1 Cari task dalam radius 2km

```sql
SELECT 
  t.*,
  ST_Distance(t.location, ST_MakePoint(:lng, :lat)::GEOGRAPHY) AS distance_m
FROM tasks t
WHERE 
  t.status = 'open'
  AND ST_DWithin(
    t.location,
    ST_MakePoint(:lng, :lat)::GEOGRAPHY,
    2000  -- radius dalam meter
  )
ORDER BY distance_m ASC;
```

### 4.2 Insert task dengan lokasi

```sql
INSERT INTO tasks (title, description, category, requester_id, location, address_text, estimated_time, compensation)
VALUES (
  'Foto Produk UMKM',
  'Butuh bantuan foto 20 produk makanan untuk katalog online',
  'fotografi',
  :requester_id,
  ST_MakePoint(:lng, :lat)::GEOGRAPHY,
  'Jl. Prof. Sudarto No.13, Tembalang, Semarang',
  120,
  50
);
```

---

## 5. Row Level Security (RLS)

```sql
-- Aktifkan RLS di semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Contoh policy: profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Contoh policy: tasks
CREATE POLICY "Anyone can view open tasks"
  ON tasks FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requester can update own tasks"
  ON tasks FOR UPDATE USING (
    auth.uid() = requester_id 
    OR auth.uid() = worker_id
  );

-- Contoh policy: notifications
CREATE POLICY "Users can only view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
```

---

## 6. Supabase Realtime Config

Aktifkan realtime pada tabel berikut di Supabase Dashboard:

| Tabel             | Event yang di-broadcast                         |
| ----------------- | ----------------------------------------------- |
| `tasks`           | INSERT, UPDATE (status changes)                 |
| `notifications`   | INSERT (new notification)                       |
| `task_applicants` | INSERT (new applicant)                          |

---

## 7. Catatan untuk AI Agent

- Selalu gunakan `gen_random_uuid()` untuk primary key (bukan auto-increment).
- Semua timestamp harus `TIMESTAMPTZ` (timezone-aware).
- Location disimpan sebagai `GEOGRAPHY(POINT, 4326)` — parameter: `(longitude, latitude)` (perhatikan urutan!).
- Saat query Supabase dari client, gunakan `.rpc()` untuk geo-queries karena PostGIS functions tidak bisa langsung dari query builder.
- Pastikan `profiles` row dibuat otomatis saat user register (gunakan Supabase Database Function / Trigger on `auth.users` INSERT).
- Setiap perubahan skema harus didokumentasikan di file migrasi (`supabase/migrations/`).

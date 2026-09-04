# Skema Database — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Ringkasan & Arsitektur Data

Database platform **CEPAT** menggunakan **PostgreSQL** yang di-host pada infrastruktur **Supabase** dan dikelola secara terpadu melalui **Prisma ORM 7** (`prisma/schema.prisma`) sebagai *single source of truth*.

- **Database Engine**: PostgreSQL 15+ dengan ekstensi geospasial `postgis` aktif untuk perhitungan radius spasial.
- **ORM & Driver**: Prisma ORM 7 dengan `@prisma/adapter-pg` untuk koneksi cepat dan *type safety* menyeluruh.
- **Autentikasi**: Terintegrasi dengan **Supabase Auth** melalui pemetaan UUID `auth_id` pada tabel `User`.
- **Realtime**: Supabase Realtime Channels terhubung ke tabel `Task`, `TaskApplicants`, `Notifications`, `ChatRoom`, dan `Message`.
- **Row Level Security (RLS)**: Diaktifkan pada seluruh tabel publik via skrip SQL terisolasi di `supabase/migrations/`.

> [!NOTE]
> Seluruh model data Prisma menggunakan penamaan terstandarisasi **PascalCase** (`User`, `Task`, `TaskApplicants`, dll). Saat melakukan query Prisma berbasis status referensi (seperti `status_task` atau `status_task_applicants`), gunakan selalu opsi `mode: 'insensitive'` pada klausa `where`.

---

## 2. Diagram Relasi Entitas (ERD)

```text
┌────────────────┐           ┌────────────────────┐           ┌─────────────────┐
│      User      │           │        Task        │           │     Reviews     │
│────────────────│           │────────────────────│           │─────────────────│
│ id_user (PK)   │───(1:N)──▶│ id_tasks (PK)      │◀──(1:N)───│ id_reviews (PK) │
│ id_role (FK)   │           │ id_requester (FK)  │           │ id_tasks (FK)   │
│ auth_id (UUID) │           │ id_status_task(FK) │           │ id_rater (FK)   │
│ email (unique) │           │ id_category (FK)   │           │ id_ratee (FK)   │
│ total_balance  │           │ is_bidding         │           │ rating          │
│ held_balance   │           │ budget_min/max     │           └─────────────────┘
│ xp / level     │           │ lokasi_geo (Point) │
└───────┬────────┘           └─────────┬──────────┘
        │                              │
        ├─────────────(1:N)────────────┼──────────────┐
        │                              ▼              │
        │                    ┌──────────────────┐     │
        │                    │  TaskApplicants  │     │
        │                    │──────────────────│     │
        │                    │ id_task_app (PK) │     │
        │                    │ id_tasks (FK)    │     │
        │                    │ id_worker (FK)   │     │
        │                    │ bid_amount       │     │
        │                    └──────────────────┘     │
        │                                             ▼
        │                    ┌──────────────────┐   ┌─────────────────┐
        │                    │     ChatRoom     │   │     Dispute     │
        │                    │──────────────────│   │─────────────────│
        ├────────(1:N)──────▶│ id_chat_room(PK) │   │ id_dispute (PK) │
        │                    │ id_tasks (FK)    │◀──│ id_task (FK)    │
        │                    │ id_requester(FK) │   │ id_reporter(FK) │
        │                    │ id_worker (FK)   │   │ status          │
        │                    └────────┬─────────┘   └────────┬────────┘
        │                             │                      │
        │                             ▼                      ▼
        │                    ┌──────────────────┐   ┌─────────────────┐
        │                    │     Message      │   │ DisputeEvidence │
        │                    │──────────────────│   │ DisputeMessage  │
        │                    │ id_message (PK)  │   └─────────────────┘
        │                    │ id_chat_room(FK) │
        │                    │ teks_pesan       │
        │                    └──────────────────┘
        │
        ├────────► [Transactions] (Log mutasi saldo, escrow hold & release)
        ├────────► [PaymentTransaction] (Integrasi Midtrans Snap topup)
        ├────────► [SavedTask] (Bookmark pekerjaan tersimpan)
        ├────────► [PortfolioItem] (Showcase hasil karya worker)
        ├────────► [UserBadge] & [Badge] (Gamifikasi badges)
        ├────────► [UserStreak] & [XPLog] (Aktivitas harian & level)
        ├────────► [UserReport] (Aduan pengguna ke konsol admin)
        └────────► [AdminSession] (Autentikasi admin berbasis hashed token)
```

---

## 3. Definisi Model Prisma (`prisma/schema.prisma`)

### 3.1 Enumerasi (Enums)

```prisma
enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
}

enum TransactionType {
  MASUK
  KELUAR
}

enum TransactionSubType {
  topup
  task_earning
  task_payment
  refund
  hold
}

enum DisputeStatus {
  OPEN
  IN_REVIEW
  RESOLVED_FAVOR_WORKER
  RESOLVED_FAVOR_REQUESTER
  CLOSED
}
```

---

### 3.2 Tabel Master & Referensi

#### `Role`
Menyimpan master peran pengguna sistem (`Requester`, `Worker`, `Admin`).

```prisma
model Role {
  id_role   String @id @default(uuid())
  nama_role String @unique
  users     User[]
}
```

#### `StatusTask`
Menyimpan master siklus status tugas (`open`, `accepted`, `in_progress`, `completed`, `cancelled`).

```prisma
model StatusTask {
  id_status_task String @id @default(uuid())
  nama_status    String @unique
  tasks          Task[]
}
```

#### `StatusTaskApplicants`
Menyimpan status lamaran pengerja (`pending`, `accepted`, `rejected`).

```prisma
model StatusTaskApplicants {
  id_status_task_applicants String           @id @default(uuid())
  nama_status               String           @unique
  applicants                TaskApplicants[]
}
```

#### `TaskCategory` & `SkillsMaster`
Kategori pekerjaan mikro dan daftar keahlian master terdaftar.

```prisma
model TaskCategory {
  id_category   String  @id @default(uuid())
  nama_kategori String  @unique
  icon          String?
  tasks         Task[]
}

model SkillsMaster {
  id_skill_master   String             @id @default(uuid())
  nama_skill        String             @unique
  icon              String?
  skills_user       SkillsUser[]
  task_requirements TaskRequirements[]
}
```

---

### 3.3 Entitas Pengguna (`User`)

Tabel profil terpusat untuk pengguna dengan arsitektur akun terpadu (dual-role):

```prisma
model User {
  id_user                 String           @id @default(uuid())
  id_role                 String
  nama_lengkap            String
  avatar_url              String?
  bio                     String?
  pendidikan_terakhir     String?
  rating_avg              Float            @default(0.0)
  total_completed         Int              @default(0)
  total_balance           Float            @default(0.0)  // Total saldo fisik user
  held_balance            Float            @default(0.0)  // Saldo yang sedang dikunci di escrow
  username                String           @unique
  alamat                  String?
  no_telpon               String?
  email                   String           @unique
  auth_id                 String?          @unique @db.Uuid // FK ke auth.users Supabase
  fcm_token               String?          // Push notification FCM device token
  last_seen_at            DateTime?
  is_banned               Boolean          @default(false)
  ban_type                String?          // PERMANENT | TEMPORARY
  ban_reason              String?
  banned_at               DateTime?
  banned_until            DateTime?        // Kedaluwarsa penangguhan (untuk auto-unban)
  xp                      Int              @default(0)
  level                   Int              @default(1)
  tagline                 String?
  is_verified             Boolean          @default(false)

  // Relasi
  role                    Role             @relation(fields: [id_role], references: [id_role])
  tasks_posted            Task[]           @relation("RequesterTasks")
  task_applications       TaskApplicants[] @relation("WorkerApplications")
  transactions            Transactions[]
  payment_transactions    PaymentTransaction[]
  portfolio_items         PortfolioItem[]
  saved_tasks             SavedTask[]
  user_badges             UserBadge[]
  user_streak             UserStreak?
  xp_logs                 XPLog[]
  user_reports            UserReport[]
  admin_sessions          AdminSession[]
  chat_rooms_as_requester ChatRoom[]       @relation("RequesterChats")
  chat_rooms_as_worker    ChatRoom[]       @relation("WorkerChats")
  messages_sent           Message[]        @relation("UserMessages")
  reviews_received        Reviews[]        @relation("RateeReviews")
  reviews_given           Reviews[]        @relation("RaterReviews")
  disputes_reported       Dispute[]        @relation("DisputeReporter")
  disputes_received       Dispute[]        @relation("DisputeRespondent")
  skills_user             SkillsUser[]
  notifications           Notifications[]
}
```

> **Aturan Saldo**: Saldo yang dapat dibelanjakan (*usable balance*) pengguna adalah `total_balance - held_balance`. Setiap perubahan saldo escrow dikontrol atomik dalam `prisma.$transaction`.

---

### 3.4 Entitas Pekerjaan (`Task`) & Bookmark (`SavedTask`)

```prisma
model Task {
  id_tasks          String                    @id @default(uuid())
  id_requester      String
  id_status_task    String
  judul_tugas       String
  deskripsi_tugas   String
  estimasi_waktu    String?
  kompensasi        Float                     @default(0.0) // Plafon budget escrow
  id_category       String
  worker_started    Boolean                   @default(false)
  requester_started Boolean                   @default(false)
  max_applicants    Int                       @default(1)
  max_apply_attempts Int                      @default(3)
  
  // Fitur Bidding
  is_bidding        Boolean                   @default(false)
  budget_min        Float?
  budget_max        Float?
  held_slots_json   String?                   // Map pembukuan escrow { applicant_id: nominal_held }

  // Fitur Penjadwalan
  scheduled_at      DateTime?
  scheduled_end     DateTime?

  // Geospasial (PostGIS Point WGS84)
  lokasi_geo        Unsupported("geography")?

  created_at        DateTime                  @default(now())
  accepted_at       DateTime?
  completed_at      DateTime?

  // Relasi
  requester         User                      @relation("RequesterTasks", fields: [id_requester], references: [id_user], onDelete: Cascade)
  status_task       StatusTask                @relation(fields: [id_status_task], references: [id_status_task])
  kategori          TaskCategory              @relation(fields: [id_category], references: [id_category])
  applicants        TaskApplicants[]
  requirements      TaskRequirements[]
  chat_rooms        ChatRoom[]
  reviews           Reviews[]
  disputes          Dispute[]
  saved_by          SavedTask[]
}

model SavedTask {
  id_saved    String   @id @default(uuid())
  id_user     String
  id_tasks    String
  created_at  DateTime @default(now())

  user        User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
  task        Task     @relation(fields: [id_tasks], references: [id_tasks], onDelete: Cascade)

  @@unique([id_user, id_tasks])
  @@index([id_user])
}
```

---

### 3.5 Pelamar (`TaskApplicants`) & Bidding

```prisma
model TaskApplicants {
  id_task_applicants        String               @id @default(uuid())
  id_status_task_applicants String
  id_worker                 String
  id_tasks                  String
  applied_at                DateTime             @default(now())
  apply_count               Int                  @default(1)
  alasan_penolakan          String?
  pesan                     String?
  worker_confirmed          Boolean              @default(false)
  bid_amount                Float?               // Nilai penawaran sealed-bid worker

  status_applicant          StatusTaskApplicants @relation(fields: [id_status_task_applicants], references: [id_status_task_applicants])
  task                      Task                 @relation(fields: [id_tasks], references: [id_tasks], onDelete: Cascade)
  worker                    User                 @relation("WorkerApplications", fields: [id_worker], references: [id_user], onDelete: Cascade)
}
```

---

### 3.6 Transaksi Keuangan & Pembayaran Midtrans

```prisma
model Transactions {
  id_transactions String              @id @default(uuid())
  id_user         String
  nominal         Float
  tipe_transaksi  TransactionType
  sub_type        TransactionSubType
  deskripsi       String?
  created_at      DateTime            @default(now())

  user            User                @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
}

model PaymentTransaction {
  id                String        @id @default(uuid())
  id_user           String
  order_id          String        @unique
  amount            Float
  snap_token        String?
  redirect_url      String?
  payment_type      String?
  status            PaymentStatus @default(PENDING)
  midtrans_response Json?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  user              User          @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
}
```

---

### 3.7 Komunikasi Obrolan Realtime (`ChatRoom` & `Message`)

```prisma
model ChatRoom {
  id_chat_room         String    @id @default(uuid())
  id_tasks             String
  id_requester         String
  id_worker            String
  created_at           DateTime  @default(now())
  cleared_at_requester DateTime?
  cleared_at_worker    DateTime?

  requester            User      @relation("RequesterChats", fields: [id_requester], references: [id_user], onDelete: Cascade)
  worker               User      @relation("WorkerChats", fields: [id_worker], references: [id_user], onDelete: Cascade)
  task                 Task      @relation(fields: [id_tasks], references: [id_tasks], onDelete: Cascade)
  messages             Message[]

  @@unique([id_tasks, id_worker])
}

model Message {
  id_message              String   @id @default(uuid())
  id_chat_room            String
  id_sender               String
  teks_pesan              String?
  image_url               String?
  is_read                 Boolean  @default(false)
  is_deleted_for_everyone Boolean  @default(false)
  deleted_by              String[] @default([])
  created_at              DateTime @default(now())

  chat_room               ChatRoom @relation(fields: [id_chat_room], references: [id_chat_room], onDelete: Cascade)
  sender                  User     @relation("UserMessages", fields: [id_sender], references: [id_user], onDelete: Cascade)
}
```

---

### 3.8 Gamifikasi, XP, Badges & Portofolio

```prisma
model Badge {
  id_badge      String       @id @default(uuid())
  kode_badge    String       @unique
  nama_badge    String
  deskripsi     String
  icon_url      String?
  criteria_type String       // 'task_count' | 'rating' | 'streak' | 'earning'
  criteria_val  Int
  created_at    DateTime     @default(now())
  user_badges   UserBadge[]
}

model UserBadge {
  id_user_badge String   @id @default(uuid())
  id_user       String
  id_badge      String
  earned_at     DateTime @default(now())

  user          User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
  badge         Badge    @relation(fields: [id_badge], references: [id_badge], onDelete: Cascade)

  @@unique([id_user, id_badge])
}

model UserStreak {
  id_streak          String    @id @default(uuid())
  id_user            String    @unique
  current_streak     Int       @default(0)
  longest_streak     Int       @default(0)
  last_activity_date DateTime?

  user               User      @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
}

model XPLog {
  id_xp_log   String   @id @default(uuid())
  id_user     String
  xp_amount   Int
  source      String?  
  created_at  DateTime @default(now())

  user        User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
}

model PortfolioItem {
  id_portfolio  String   @id @default(uuid())
  id_user       String
  title         String
  description   String?
  image_url     String
  related_task  String?
  created_at    DateTime @default(now())

  user          User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
}
```

---

### 3.9 Pusat Sengketa (`Dispute`), Laporan User & Sesi Admin

```prisma
model Dispute {
  id_dispute    String            @id @default(uuid())
  id_task       String
  id_reporter   String
  id_respondent String
  reason        String
  description   String
  status        DisputeStatus     @default(OPEN)
  resolution    String?
  resolved_by   String?
  resolved_at   DateTime?
  created_at    DateTime          @default(now())
  updated_at    DateTime          @updatedAt

  task          Task              @relation(fields: [id_task], references: [id_tasks], onDelete: Cascade)
  reporter      User              @relation("DisputeReporter", fields: [id_reporter], references: [id_user], onDelete: Cascade)
  respondent    User              @relation("DisputeRespondent", fields: [id_respondent], references: [id_user], onDelete: Cascade)
  evidences     DisputeEvidence[]
  messages      DisputeMessage[]
}

model DisputeEvidence {
  id_evidence   String   @id @default(uuid())
  id_dispute    String
  id_user       String
  type          String   // 'text' | 'image'
  content       String
  created_at    DateTime @default(now())

  dispute       Dispute  @relation(fields: [id_dispute], references: [id_dispute], onDelete: Cascade)
}

model DisputeMessage {
  id_message    String   @id @default(uuid())
  id_dispute    String
  id_sender     String
  message       String
  is_admin      Boolean  @default(false)
  created_at    DateTime @default(now())

  dispute       Dispute  @relation(fields: [id_dispute], references: [id_dispute], onDelete: Cascade)
}

model UserReport {
  id_report   String   @id @default(uuid())
  user_id     String
  kategori    String
  subjek      String
  deskripsi   String
  status      String   @default("pending") // pending | reviewed | resolved | rejected
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  user        User     @relation(fields: [user_id], references: [id_user], onDelete: Cascade)
}

model AdminSession {
  id         String   @id @default(uuid())
  admin_id   String
  token      String   @unique // SHA-256 Hashed admin_token
  created_at DateTime @default(now())
  expires_at DateTime

  user       User     @relation(fields: [admin_id], references: [id_user], onDelete: Cascade)
}
```

---

## 4. Query Spasial PostGIS

Untuk menemukan tugas terdekat dalam radius (default 2 km = 2000 m), query spasial dieksekusi via Prisma `$queryRaw` dengan fungsi PostGIS:

```sql
SELECT 
  t.id_tasks,
  t.judul_tugas,
  t.kompensasi,
  t.is_bidding,
  t.budget_min,
  t.budget_max,
  ST_Distance(t.lokasi_geo, ST_SetSRID(ST_MakePoint($user_lng, $user_lat), 4326)::geography) AS jarak_meter
FROM "Task" t
WHERE ST_DWithin(
  t.lokasi_geo, 
  ST_SetSRID(ST_MakePoint($user_lng, $user_lat), 4326)::geography, 
  $radius_meter
)
AND t.id_status_task = (SELECT id_status_task FROM "StatusTask" WHERE LOWER(nama_status) = 'open')
ORDER BY jarak_meter ASC;
```

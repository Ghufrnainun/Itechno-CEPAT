# 🚀 CEPAT — 5 Fitur Baru Implementation Plan

Dokumen ini mencakup rencana implementasi 5 fitur baru untuk platform CEPAT berdasarkan arsitektur yang sudah ada (Next.js + Prisma + Supabase + PostGIS).

---

## User Review Required

> [!IMPORTANT]
> **Urutan implementasi** diurutkan berdasarkan dependency & impact. Fitur 1 (Bidding) akan mengubah core flow task, jadi harus duluan.

> [!WARNING]
> **Breaking change pada Task flow**: Fitur Bidding mengubah cara worker melamar tugas — dari "apply langsung" menjadi "apply + bid harga". Requester yang sudah posting tugas lama tetap pakai flow lama (backward compatible).

---

## Open Questions

> [!IMPORTANT]
>
> 1. **Bidding**: Apakah bidding bersifat **opsional per tugas** (requester pilih mode: fixed price vs bidding) atau **semua tugas wajib pakai bidding**?
> 2. **Scheduling**: Mau pakai format waktu **slot-based** (pilih jam mulai-selesai) atau **free datetime** (tanggal + jam bebas)?
> 3. **Dispute**: Siapa yang resolve dispute — **admin manual** atau mau ada **auto-resolution** (misal: otomatis refund kalau requester gak respond dalam 48 jam)?
> 4. **Leaderboard**: Mau scope **per kota/area** atau **nasional**? Dan periode resetnya **mingguan** atau **bulanan**?
> 5. **Portfolio**: Mau support **upload gambar** (perlu storage) atau cukup **URL link** ke portfolio external?

---

## Proposed Changes

### Fase 1: 🎯 Task Bidding System

> _Worker bisa nego harga (bid) saat melamar tugas_

#### Konsep

- Requester bisa set tugas sebagai **"Open for Bidding"** saat membuat tugas
- Worker melamar dengan menyertakan **harga bid** dan pesan
- Requester melihat semua bid → pilih penawaran terbaik
- Escrow di-hold berdasarkan bid yang diterima (bukan harga awal)

---

#### [MODIFY] [schema.prisma](file:///d:/VsCode/Itechno/prisma/schema.prisma)

Tambah field pada model yang ada:

```diff
 model Task {
   ...
+  is_bidding        Boolean                   @default(false)
+  budget_min        Float?
+  budget_max        Float?
   ...
 }

 model TaskApplicants {
   ...
+  bid_amount        Float?
   ...
 }
```

**Migration SQL:**

```sql
ALTER TABLE "Task" ADD COLUMN "is_bidding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "budget_min" FLOAT;
ALTER TABLE "Task" ADD COLUMN "budget_max" FLOAT;
ALTER TABLE "TaskApplicants" ADD COLUMN "bid_amount" FLOAT;
```

---

#### [MODIFY] [task.schema.ts](file:///d:/VsCode/Itechno/src/lib/validations/task.schema.ts)

Tambah field validasi baru:

- `is_bidding: z.boolean().optional().default(false)`
- `budget_min: z.number().positive().optional()`
- `budget_max: z.number().positive().optional()`
- Validasi: `budget_min < budget_max` jika `is_bidding = true`

Tambah pada `applyTaskSchema`:

- `bid_amount: z.number().positive().optional()`
- Validasi: wajib diisi jika task `is_bidding = true`

---

#### [MODIFY] [task.service.ts](file:///d:/VsCode/Itechno/src/services/task.service.ts)

- Update `createTask()`: simpan `is_bidding`, `budget_min`, `budget_max`
- Update `applyToTask()`: simpan `bid_amount` di `TaskApplicants`
- Update `acceptApplicant()`: jika bidding task, hold escrow berdasarkan `bid_amount` (bukan `kompensasi`)
- Tambah method `getBidsForTask(taskId)` → return semua bid beserta worker info

---

#### [MODIFY] [new/page.tsx](<file:///d:/VsCode/Itechno/src/app/(main)/task/new/page.tsx>) — Form Buat Tugas

Tambah toggle "Aktifkan Bidding" + input range budget (min-max):

- Toggle switch: `is_bidding`
- Conditional: Jika bidding aktif, tampilkan input `Budget Minimum` dan `Budget Maksimum`
- Hide field `Kompensasi` jika bidding aktif (karena ditentukan oleh bid)

---

#### [MODIFY] [feed/page.tsx](<file:///d:/VsCode/Itechno/src/app/(main)/feed/page.tsx>) — Apply Modal

Update apply modal untuk tugas bidding:

- Tampilkan input `Harga Penawaran Anda` jika task `is_bidding = true`
- Tampilkan range budget requester sebagai referensi
- Badge "🏷️ Terbuka untuk Bidding" pada task card

---

#### [MODIFY] Task Detail Page — Applicant List (Requester View)

- Tampilkan kolom `Bid Amount` di samping nama worker
- Sort by: harga terendah, rating tertinggi
- Button "Terima Bid" per applicant

---

#### [NEW] `src/app/api/tasks/[id]/bids/route.ts`

- `GET` → List semua bid untuk task (requester only)
- Response: `{ worker_name, bid_amount, rating, message, applied_at }`

---

### Fase 2: 📅 Task Scheduling

> _Requester bisa jadwalkan tugas untuk waktu tertentu di masa depan_

#### Konsep

- Requester set tanggal & jam mulai saat buat tugas
- Worker bisa lihat scheduled tasks di calendar view
- Notifikasi reminder H-1 dan H-1jam sebelum tugas dimulai

---

#### [MODIFY] [schema.prisma](file:///d:/VsCode/Itechno/prisma/schema.prisma)

```diff
 model Task {
   ...
+  scheduled_at      DateTime?
+  scheduled_end     DateTime?
   ...
 }
```

---

#### [MODIFY] [task.schema.ts](file:///d:/VsCode/Itechno/src/lib/validations/task.schema.ts)

Tambah:

- `scheduled_at: z.string().datetime().optional()` — tanggal & jam mulai
- `scheduled_end: z.string().datetime().optional()` — tanggal & jam selesai
- Validasi: `scheduled_at` harus di masa depan, `scheduled_end > scheduled_at`

---

#### [MODIFY] [new/page.tsx](<file:///d:/VsCode/Itechno/src/app/(main)/task/new/page.tsx>)

Tambah section "Jadwalkan Tugas":

- Toggle "Jadwalkan untuk nanti"
- Date picker + Time picker untuk `scheduled_at`
- Optional: Duration auto-calculate `scheduled_end`

---

#### [MODIFY] [task.service.ts](file:///d:/VsCode/Itechno/src/services/task.service.ts)

- Update `createTask()`: simpan `scheduled_at`, `scheduled_end`
- Tambah method `getScheduledTasks(userId)` → return tasks with schedule info

---

#### [NEW] `src/app/(main)/schedule/page.tsx` — Calendar View

Halaman baru di sidebar: **"Jadwal"**

- Calendar view (monthly/weekly) menampilkan tugas terjadwal
- Worker: lihat tugas yang sudah accepted + jadwalnya
- Requester: lihat semua tugas yang di-schedule
- Click task → navigate ke detail

---

#### [NEW] `src/app/api/tasks/scheduled/route.ts`

- `GET` → Return scheduled tasks untuk current user (filter by role)
- Query params: `month`, `year`, `role`

---

#### [NEW] `src/app/api/cron/schedule-reminder/route.ts`

- Cron job (Vercel Cron): cek tasks yang `scheduled_at` dalam H-24jam dan H-1jam
- Kirim notifikasi reminder ke worker & requester
- Cron expression: `0 * * * *` (setiap jam)

---

### Fase 3: 🏆 Leaderboard & Gamification

> _Ranking, badges, streaks, XP system_

#### Konsep

- **Leaderboard**: Top 10/20 worker per bulan berdasarkan poin, rating, task selesai
- **Badges**: Achievements otomatis (First Task, 10 Tasks, Top Rated, dll)
- **Streak**: Login harian + task completion streak
- **XP System**: Extend sistem poin yang sudah ada

---

#### [MODIFY] [schema.prisma](file:///d:/VsCode/Itechno/prisma/schema.prisma)

```diff
+model Badge {
+  id_badge      String       @id @default(uuid())
+  kode_badge    String       @unique
+  nama_badge    String
+  deskripsi     String
+  icon_url      String?
+  criteria_type String       // 'task_count' | 'rating' | 'streak' | 'earning'
+  criteria_val  Int          // threshold value
+  created_at    DateTime     @default(now())
+  user_badges   UserBadge[]
+}
+
+model UserBadge {
+  id_user_badge String   @id @default(uuid())
+  id_user       String
+  id_badge      String
+  earned_at     DateTime @default(now())
+  user          User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
+  badge         Badge    @relation(fields: [id_badge], references: [id_badge], onDelete: Cascade)
+
+  @@unique([id_user, id_badge])
+}
+
+model UserStreak {
+  id_streak          String   @id @default(uuid())
+  id_user            String   @unique
+  current_streak     Int      @default(0)
+  longest_streak     Int      @default(0)
+  last_activity_date DateTime?
+  user               User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
+}

 model User {
   ...
+  xp              Int          @default(0)
+  level           Int          @default(1)
+  user_badges     UserBadge[]
+  user_streak     UserStreak?
   ...
 }
```

---

#### [NEW] `src/services/gamification.service.ts`

Service layer untuk:

- `checkAndAwardBadges(userId)` — cek eligibility & award badges
- `addXP(userId, amount, reason)` — tambah XP + level up check
- `updateStreak(userId)` — update streak harian
- `getLeaderboard(period, limit)` — query leaderboard
- `getUserAchievements(userId)` — ambil badges + streak + XP

XP rewards:
| Aksi | XP |
|---|---|
| Menyelesaikan tugas | +50 XP |
| Dapat rating 5★ | +25 XP |
| Login harian (streak) | +10 XP |
| First task completed | +100 XP (bonus) |

Level formula: `level = floor(sqrt(xp / 100)) + 1`

---

#### [NEW] `src/app/(main)/leaderboard/page.tsx`

Halaman leaderboard:

- Tab: **Mingguan** / **Bulanan** / **Sepanjang Waktu**
- Kartu top 3 worker dengan medal (🥇🥈🥉)
- List ranking 4-20 dengan avatar, nama, stats
- "Peringkat Kamu" card sticky di bawah jika user terdaftar

---

#### [NEW] `src/app/api/leaderboard/route.ts`

- `GET ?period=weekly|monthly|alltime&limit=20`
- Query: sort by `(total_completed * 3 + rating_avg * 20 + xp * 0.1)` weighted score

---

#### [NEW] `src/app/api/users/[id]/badges/route.ts`

- `GET` → Return badges yang dimiliki user
- `POST` → (internal) Award badge ke user

---

#### [MODIFY] [task.service.ts](file:///d:/VsCode/Itechno/src/services/task.service.ts) — Hook Gamification

Di `completeTask()`:

- Call `gamificationService.addXP(workerId, 50, 'task_completed')`
- Call `gamificationService.updateStreak(workerId)`
- Call `gamificationService.checkAndAwardBadges(workerId)`

---

#### [NEW] `src/components/ui/BadgeDisplay.tsx`

Komponen reusable:

- Grid/list badge dengan icon, nama, status (earned/locked)
- Animasi unlock saat badge baru didapat

---

#### [MODIFY] Profile Page — Tambah Badge Showcase

Di [profile/[id]/page.tsx](<file:///d:/VsCode/Itechno/src/app/(main)/profile/[id]/page.tsx>):

- Tambah section "Pencapaian" setelah skills
- Tampilkan badges yang sudah earned
- XP bar + level indicator
- Streak counter

---

#### Navigation Updates

Tambah link **"Leaderboard"** di:

- [Sidebar.tsx](file:///d:/VsCode/Itechno/src/components/ui/Sidebar.tsx) — icon: `Trophy`
- [BottomNav.tsx](file:///d:/VsCode/Itechno/src/components/ui/BottomNav.tsx) — Bisa diakses dari menu "more" atau replace salah satu nav

---

### Fase 4: ⭐ Worker Portfolio / Showcase

> _Halaman publik profil worker dengan galeri hasil kerja_

#### Konsep

- Worker bisa upload foto hasil kerja per skill/tugas
- Halaman profil publik yang shareable
- Verified badge untuk skill yang ada sertifikatnya
- Testimonial dari requester (extend dari reviews)

---

#### [MODIFY] [schema.prisma](file:///d:/VsCode/Itechno/prisma/schema.prisma)

```diff
+model PortfolioItem {
+  id_portfolio  String   @id @default(uuid())
+  id_user       String
+  title         String
+  description   String?
+  image_url     String
+  related_task  String?  // optional link ke id_tasks
+  created_at    DateTime @default(now())
+  user          User     @relation(fields: [id_user], references: [id_user], onDelete: Cascade)
+}

 model User {
   ...
+  portfolio_items  PortfolioItem[]
+  tagline          String?
+  is_verified      Boolean          @default(false)
   ...
 }
```

---

#### [NEW] `src/app/api/portfolio/route.ts`

- `GET ?user_id=xxx` → List portfolio items
- `POST` → Create portfolio item (upload image to Supabase Storage)
- `DELETE` → Remove portfolio item

---

#### [MODIFY] [profile/[id]/page.tsx](<file:///d:/VsCode/Itechno/src/app/(main)/profile/[id]/page.tsx>)

Major upgrade ke halaman profil:

**Tab baru: "Portfolio"**

- Masonry grid gallery foto hasil kerja
- Click → lightbox preview dengan deskripsi
- Jika `isCurrentUser`: button "Tambah Portfolio"

**Upgrade section header:**

- Tampilkan tagline di bawah nama
- Verified badge ✅ jika `is_verified = true`
- Share button → copy link profil publik
- Badge showcase (dari Fase 3)

**Tab "Ulasan" upgrade:**

- Tampilkan foto dari review (field `url_photo` sudah ada)
- Aggregate stats: total reviews, average response time

---

#### [NEW] `src/app/api/upload/route.ts`

- Generic upload endpoint ke Supabase Storage
- Support image upload dengan resize/compress
- Return public URL
- Max size: 5MB, format: jpg/png/webp

---

### Fase 5: 🛡️ Dispute & Resolution Center

> _Sistem penyelesaian masalah antara worker & requester_

#### Konsep

- Worker atau requester bisa buka dispute untuk tugas yang sedang berjalan
- Submit bukti (teks + foto)
- Admin mediasi dan putuskan resolusi
- Auto-escalation jika tidak ada respons dalam 48 jam

---

#### [MODIFY] [schema.prisma](file:///d:/VsCode/Itechno/prisma/schema.prisma)

```diff
+enum DisputeStatus {
+  OPEN
+  IN_REVIEW
+  RESOLVED_FAVOR_WORKER
+  RESOLVED_FAVOR_REQUESTER
+  CLOSED
+}
+
+model Dispute {
+  id_dispute     String          @id @default(uuid())
+  id_task        String
+  id_reporter    String          // siapa yang buka dispute
+  id_respondent  String          // pihak lawan
+  reason         String
+  description    String
+  status         DisputeStatus   @default(OPEN)
+  resolution     String?         // keputusan admin
+  resolved_by    String?         // admin id
+  resolved_at    DateTime?
+  created_at     DateTime        @default(now())
+  updated_at     DateTime        @updatedAt
+  task           Task            @relation(fields: [id_task], references: [id_tasks], onDelete: Cascade)
+  reporter       User            @relation("DisputeReporter", fields: [id_reporter], references: [id_user])
+  respondent     User            @relation("DisputeRespondent", fields: [id_respondent], references: [id_user])
+  evidences      DisputeEvidence[]
+  messages       DisputeMessage[]
+}
+
+model DisputeEvidence {
+  id_evidence    String   @id @default(uuid())
+  id_dispute     String
+  id_user        String   // siapa yang submit
+  type           String   // 'text' | 'image'
+  content        String   // teks atau image URL
+  created_at     DateTime @default(now())
+  dispute        Dispute  @relation(fields: [id_dispute], references: [id_dispute], onDelete: Cascade)
+}
+
+model DisputeMessage {
+  id_message     String   @id @default(uuid())
+  id_dispute     String
+  id_sender      String   // user atau admin
+  message        String
+  is_admin       Boolean  @default(false)
+  created_at     DateTime @default(now())
+  dispute        Dispute  @relation(fields: [id_dispute], references: [id_dispute], onDelete: Cascade)
+}

 model Task {
   ...
+  disputes        Dispute[]
   ...
 }

 model User {
   ...
+  disputes_reported   Dispute[] @relation("DisputeReporter")
+  disputes_received   Dispute[] @relation("DisputeRespondent")
   ...
 }
```

---

#### [NEW] `src/services/dispute.service.ts`

Service layer:

- `createDispute(data)` → buat dispute baru, kirim notif ke lawan & admin
- `submitEvidence(disputeId, userId, data)` → tambah bukti
- `sendMessage(disputeId, userId, message)` → kirim pesan mediasi
- `resolveDispute(disputeId, adminId, resolution, favor)` → putuskan + refund/release
- `getDisputesByUser(userId)` → list disputes user
- `getDisputeDetail(disputeId)` → detail + evidences + messages

Resolusi otomatis:

- Jika respondent tidak merespons dalam 48 jam → auto-resolve favor reporter
- Cron job check pending disputes

---

#### [NEW] `src/app/(main)/disputes/page.tsx` — Dispute List

Halaman daftar dispute user:

- Tab: **Aktif** / **Selesai**
- Card per dispute: task title, status badge, lawan, tanggal
- Click → navigate ke detail

---

#### [NEW] `src/app/(main)/disputes/[id]/page.tsx` — Dispute Detail

Halaman detail dispute:

- Timeline bukti & pesan (chat-like UI)
- Form submit bukti baru (teks + upload foto)
- Status badge + resolusi admin
- Jika admin: tombol "Resolve" dengan opsi favor

---

#### [NEW] `src/app/api/disputes/route.ts`

- `GET` → List disputes current user
- `POST` → Create new dispute

#### [NEW] `src/app/api/disputes/[id]/route.ts`

- `GET` → Detail dispute + evidences + messages
- `PATCH` → Resolve dispute (admin only)

#### [NEW] `src/app/api/disputes/[id]/evidence/route.ts`

- `POST` → Submit evidence (foto/teks)

#### [NEW] `src/app/api/disputes/[id]/messages/route.ts`

- `GET` → List messages
- `POST` → Send message

---

#### [MODIFY] Task Detail Page

Tambah button "Laporkan Masalah" di task detail:

- Hanya visible jika task status `in_progress` atau `completed`
- Hanya untuk worker & requester task tersebut
- Opens dispute creation form

---

#### [MODIFY] Admin Dashboard

Tambah section "Dispute Center":

- List semua dispute yang `OPEN` atau `IN_REVIEW`
- Quick stats: total aktif, avg resolution time
- Click → admin mediasi view

#### [NEW] `src/app/(admin)/admin/disputes/page.tsx`

Admin dispute management page:

- Table semua disputes dengan filter status
- Detail view + resolve actions

---

## Ringkasan File Changes

| Fase           | File Baru                               | File Modifikasi     | Model DB Baru                    |
| -------------- | --------------------------------------- | ------------------- | -------------------------------- |
| 1. Bidding     | 1 API                                   | 4 files             | 0 (field tambahan)               |
| 2. Scheduling  | 1 page, 2 API                           | 3 files             | 0 (field tambahan)               |
| 3. Leaderboard | 1 page, 2 API, 2 components, 1 service  | 3 files             | 3 (Badge, UserBadge, UserStreak) |
| 4. Portfolio   | 2 API                                   | 1 file              | 1 (PortfolioItem)                |
| 5. Dispute     | 2 pages, 5 API, 1 service, 1 admin page | 3 files             | 3 (Dispute, Evidence, Message)   |
| **Total**      | **~17 files baru**                      | **~10 files modif** | **7 model baru**                 |

---

## Verification Plan

### Automated Tests

Karena project belum punya test framework:

- Build check: `npm run build` — pastikan zero errors
- Lint check: `npx next lint`
- Prisma validation: `npx prisma validate`
- Migration dry-run: `npx prisma migrate dev --create-only`

### Manual Verification

Per fase:

1. **Bidding**: Buat task bidding → apply dengan bid → requester terima bid → escrow correct
2. **Scheduling**: Buat scheduled task → muncul di calendar → reminder terkirim
3. **Leaderboard**: Complete tasks → XP bertambah → muncul di leaderboard → badge unlock
4. **Portfolio**: Upload foto portfolio → muncul di profil publik → shareable link works
5. **Dispute**: Buka dispute → submit bukti → admin resolve → refund/release sesuai

### Database

- `npx prisma db push` atau migration untuk semua schema changes
- Seed data untuk badges awal

---

## Estimated Timeline

| Fase                          | Estimasi       | Prioritas |
| ----------------------------- | -------------- | --------- |
| 1. Task Bidding               | 2-3 hari       | 🔴 Tinggi |
| 2. Task Scheduling            | 1-2 hari       | 🟠 Sedang |
| 3. Leaderboard & Gamification | 2-3 hari       | 🟡 Sedang |
| 4. Worker Portfolio           | 1-2 hari       | 🟢 Normal |
| 5. Dispute Center             | 2-3 hari       | 🟢 Normal |
| **Total**                     | **~8-13 hari** |           |

---

> [!TIP]
> Gue saranin kerjain **per fase, satu-satu**. Setiap fase di-approve dulu baru lanjut ke fase berikutnya. Ini biar tiap perubahan bisa di-test isolated dan gak ada breaking changes bertumpuk.

Mau langsung mulai dari fase mana, bang? Atau ada pertanyaan/revisi dulu?

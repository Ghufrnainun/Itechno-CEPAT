# Deployment & DevOps — KerjaMicro

## 1. Hosting

### Vercel (Frontend + API)

- **Platform**: Vercel (sesuai anjuran panitia)
- **Framework preset**: Next.js (auto-detected)
- **Deploy method**: Git push ke GitHub → auto-deploy
- **Domain**: `kerjamicro.vercel.app` (default) atau custom domain

### Supabase (Database + Auth + Realtime)

- **Plan**: Free tier (cukup untuk kompetisi)
- **Region**: Southeast Asia (Singapore) — paling dekat untuk latency rendah
- **Limits Free tier**:
  - 500 MB database
  - 1 GB storage
  - 50,000 monthly active users
  - 2 GB bandwidth
  - Realtime: 200 concurrent connections

---

## 2. Environment Setup

### Development

```bash
# 1. Clone repo
git clone https://github.com/Ghufrnainun/Itechno.git
cd Itechno

# 2. Install dependencies
npm install

# 3. Copy env template
cp .env.example .env.local
# Isi dengan credentials Supabase & Firebase dev project

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

### Production

Environment variables di-set melalui Vercel Dashboard:
- Settings → Environment Variables
- Semua variabel dari `.env.example` harus diisi
- `SUPABASE_SERVICE_ROLE_KEY` hanya di server (tidak prefix `NEXT_PUBLIC_`)

---

## 3. Supabase Setup

### Inisialisasi Database

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ke project
supabase link --project-ref <project-id>

# Enable PostGIS extension (jalankan di SQL Editor Supabase Dashboard)
# CREATE EXTENSION IF NOT EXISTS postgis;

# Run migrations
supabase db push
```

### Migration Files

Simpan di `supabase/migrations/`:

```
supabase/
└── migrations/
    ├── 20260727_001_create_profiles.sql
    ├── 20260727_002_create_tasks.sql
    ├── 20260727_003_create_task_applicants.sql
    ├── 20260727_004_create_reviews.sql
    ├── 20260727_005_create_notifications.sql
    ├── 20260727_006_create_point_transactions.sql
    ├── 20260727_007_enable_rls.sql
    ├── 20260727_008_create_functions.sql
    └── 20260727_009_create_triggers.sql
```

---

## 4. Firebase Setup (FCM Only)

### Firebase Console

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Tambahkan web app
3. Aktifkan Cloud Messaging
4. Generate VAPID key (Project Settings → Cloud Messaging → Web Push certificates)
5. Copy config ke `.env.local`

### Service Worker

File `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  messagingSenderId: '...',
  appId: '...',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, { body });
});
```

> **Catatan**: Service worker file harus ada di `public/` root agar bisa diakses di root scope.

---

## 5. Vercel Deployment

### vercel.json (Opsional)

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "headers": [
    {
      "source": "/firebase-messaging-sw.js",
      "headers": [
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    }
  ]
}
```

### Deploy Commands

```bash
# Preview deploy (dari branch)
git push origin feature/task-feed

# Production deploy (merge ke main)
git checkout main
git merge feature/task-feed
git push origin main
# → Vercel auto-deploys ke production
```

---

## 6. Git Branching Strategy

```
main              ← production (auto-deploy ke Vercel)
├── dev           ← integration branch
│   ├── feat/auth
│   ├── feat/task-feed
│   ├── feat/map-view
│   ├── feat/notifications
│   └── fix/radius-query
```

**Flow:**
1. Buat branch dari `dev`: `git checkout -b feat/task-feed`
2. Develop & commit
3. Push & buat PR ke `dev`
4. Review → merge ke `dev`
5. Saat ready release: merge `dev` ke `main`

---

## 7. Scripts (package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --project-id <id> > src/types/database.ts"
  }
}
```

> `db:types` akan auto-generate TypeScript types dari skema Supabase — sangat berguna untuk type safety.

---

## 8. Pre-submission Checklist

Sebelum submit ke ITechno Cup:

- [ ] Semua fitur P0 berfungsi di production URL
- [ ] README.md sudah mengikuti template resmi ITechno Cup
- [ ] `.env.example` ada di repo (tanpa values secret)
- [ ] Tidak ada API key/secret ter-commit
- [ ] PWA installable (manifest + service worker berjalan)
- [ ] Responsive di mobile (360px) + desktop (1280px)
- [ ] Dokumentasi penggunaan AI sudah ada di README
- [ ] Repo public & link hosting aktif
- [ ] Map + geolocation berfungsi di production (HTTPS required)

---

## 9. Catatan untuk AI Agent

- Jangan pernah hardcode Supabase URL/key di source code — selalu dari `process.env`.
- Geolocation API hanya berfungsi di HTTPS (production) atau localhost (development).
- Saat generate migration files, gunakan format: `YYYYMMDD_NNN_description.sql`.
- Setelah ubah skema database, jalankan `npm run db:types` untuk regenerate TypeScript types.
- Vercel free tier: 100 GB bandwidth/bulan, 6000 minutes build/bulan — lebih dari cukup untuk kompetisi.

# Arsitektur Sistem — KerjaMicro

## 1. Ringkasan Arsitektur

KerjaMicro menggunakan arsitektur **monolith modular** berbasis Next.js App Router. Semua fitur (frontend, API routes, server actions) berada dalam satu codebase Next.js yang di-deploy ke Vercel. Backend data layer menggunakan Supabase (PostgreSQL + PostGIS + Auth + Realtime). Push notification dihandle oleh Firebase Cloud Messaging (FCM).

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER / PWA                      │
│  Next.js Client (React) + Tailwind CSS + Leaflet.js     │
│  Service Worker (next-pwa) → offline support + FCM      │
└─────────────┬──────────────────────────┬────────────────┘
              │ HTTPS                    │ WebSocket
              ▼                          ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│   Next.js API Routes    │  │  Supabase Realtime       │
│   (Vercel Serverless)   │  │  (WebSocket channel)     │
│   - /api/tasks/*        │  │  - task status updates   │
│   - /api/users/*        │  │  - new task broadcasts   │
│   - /api/reviews/*      │  │  - notification events   │
│   - /api/notifications/*│  └──────────────────────────┘
└─────────────┬───────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                             │
│  ┌───────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  PostgreSQL   │  │   Auth   │  │  Storage (opt.)  │  │
│  │  + PostGIS    │  │  (JWT)   │  │  (avatars, etc)  │  │
│  └───────────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
              │
              ▼ (Server-side trigger / Edge Function)
┌─────────────────────────────────────────────────────────┐
│          Firebase Cloud Messaging (FCM)                 │
│          Push notifications ke device user              │
└─────────────────────────────────────────────────────────┘
```

## 2. Tech Stack Detail

| Layer          | Teknologi                            | Versi Target | Keterangan                                 |
| -------------- | ------------------------------------ | ------------ | ------------------------------------------ |
| **Framework**  | Next.js (App Router)                 | 14.x / 15.x  | SSR + API routes + Server Actions          |
| **PWA**        | next-pwa                             | latest       | Service worker, manifest, offline cache    |
| **Styling**    | Tailwind CSS                         | 3.x / 4.x    | Utility-first, responsive design           |
| **Map**        | Leaflet.js + react-leaflet           | latest       | Peta interaktif, tile dari OpenStreetMap   |
| **Database**   | Supabase (PostgreSQL + PostGIS)      | latest       | Geo-query radius, RLS (Row Level Security) |
| **Auth**       | Supabase Auth                        | built-in     | Email/password, OAuth (Google), JWT        |
| **Realtime**   | Supabase Realtime                    | built-in     | WebSocket untuk live status update         |
| **Push Notif** | Firebase Cloud Messaging             | v9+          | Web push, gratis unlimited (Spark plan)    |
| **Hosting**    | Vercel                               | -            | Auto-deploy dari GitHub, edge network      |
| **Language**   | TypeScript                           | 5.x          | Type safety end-to-end                     |
| **Validation** | Zod                                  | latest       | Schema validation untuk API & forms        |
| **State Mgmt** | React Context + Zustand (jika perlu) | latest       | Client-side state                          |

## 3. Folder Structure (Rencana)

```
kerjamicro/
├── public/
│   ├── icons/                # PWA icons (192x192, 512x512)
│   ├── manifest.json         # PWA manifest
│   └── firebase-messaging-sw.js  # FCM service worker
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Route group: login, register
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/      # Route group: authenticated pages
│   │   │   ├── feed/         # Task feed (list + map view)
│   │   │   ├── task/
│   │   │   │   ├── [id]/     # Task detail
│   │   │   │   └── create/   # Create new task
│   │   │   ├── profile/
│   │   │   │   └── [id]/     # User profile
│   │   │   ├── history/      # Task history
│   │   │   └── notifications/
│   │   ├── api/              # API Routes
│   │   │   ├── tasks/
│   │   │   ├── users/
│   │   │   ├── reviews/
│   │   │   └── notifications/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css
│   │
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Primitives (Button, Input, Card, Modal)
│   │   ├── layout/           # Header, Footer, Sidebar, BottomNav
│   │   ├── map/              # MapView, TaskMarker, RadiusCircle
│   │   ├── task/             # TaskCard, TaskForm, TaskStatusBadge
│   │   └── profile/          # ProfileCard, SkillTag, RatingStars
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useGeolocation.ts
│   │   ├── useNearbyTasks.ts
│   │   ├── useSupabaseAuth.ts
│   │   └── useRealtimeTask.ts
│   │
│   ├── lib/                  # Library configs & utilities
│   │   ├── supabase/
│   │   │   ├── client.ts     # Browser client
│   │   │   ├── server.ts     # Server client
│   │   │   └── middleware.ts # Auth middleware
│   │   ├── firebase.ts       # FCM config
│   │   └── utils.ts          # Helper functions
│   │
│   ├── services/             # Business logic / data access
│   │   ├── task.service.ts
│   │   ├── user.service.ts
│   │   ├── review.service.ts
│   │   ├── notification.service.ts
│   │   └── geo.service.ts    # PostGIS radius queries
│   │
│   └── types/                # TypeScript types & interfaces
│       ├── task.ts
│       ├── user.ts
│       ├── review.ts
│       └── database.ts       # Supabase generated types
│
├── docs/                     # Dokumentasi proyek
├── tests/                    # Test files
├── .env.local                # Environment variables (git-ignored)
├── .env.example              # Template env vars
├── next.config.js            # Next.js + PWA config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 4. Alur Data Utama

### 4.1 Posting Task (Requester)

```
User submit form → Client validation (Zod)
  → POST /api/tasks → Server validation
    → Insert ke Supabase PostgreSQL (dengan PostGIS point)
      → Supabase Realtime broadcast "new_task" ke channel area
        → Worker dalam radius menerima update di feed
      → (Opsional) FCM push ke worker nearby yang sedang offline
```

### 4.2 Accept Task (Worker)

```
Worker klik "Accept" → POST /api/tasks/[id]/accept
  → Update status task: 'open' → 'accepted'
  → Assign worker_id ke task
  → Supabase Realtime notify requester
  → FCM push ke requester: "Task Anda diterima oleh [worker]"
```

### 4.3 Geo-query Feed

```
Client ambil posisi GPS (navigator.geolocation)
  → GET /api/tasks?lat=X&lng=Y&radius=2000
    → PostGIS query: ST_DWithin(task.location, user_point, radius)
    → Return sorted by distance + relevance (skill match + rating)
```

## 5. Keamanan

- **Row Level Security (RLS)**: Supabase RLS aktif di semua tabel. User hanya bisa CRUD data miliknya sendiri.
- **Auth JWT**: Setiap API request membawa Supabase JWT token. Server-side middleware memvalidasi token.
- **Input validation**: Zod schema di client & server untuk mencegah injection.
- **CORS**: Di-handle oleh Vercel + Supabase config.
- **Environment secrets**: API keys disimpan di Vercel environment variables, tidak di-commit ke repo.

## 6. Deployment Pipeline

```
Developer push ke GitHub
  → Vercel auto-deploy (preview branch / production main)
  → Build: next build (SSR + static)
  → Output: Vercel Edge Network (global CDN)
```

- **Preview deploys**: setiap PR mendapat URL preview otomatis.
- **Production**: merge ke `main` → auto-deploy ke domain production.
- **Database**: Supabase project terpisah untuk dev vs production (disarankan).

## 7. Catatan Penting untuk AI Agent

- Gunakan **App Router** (bukan Pages Router). Semua route di `src/app/`.
- Supabase client ada 2 versi: `client.ts` (browser, `createBrowserClient`) dan `server.ts` (server components/API routes, `createServerClient`).
- Untuk geo-query, PostGIS extension harus diaktifkan di Supabase dashboard (`CREATE EXTENSION IF NOT EXISTS postgis;`).
- PWA config ada di `next.config.js` via `next-pwa` wrapper.
- FCM service worker (`firebase-messaging-sw.js`) harus di `public/` root.

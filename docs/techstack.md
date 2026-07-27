# Tech Stack & Dependencies — KerjaMicro

## 1. Core Dependencies

### Framework & Runtime

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `next`              | ^14.x   | Framework utama — SSR, App Router, API Routes   |
| `react`             | ^18.x   | UI library                                      |
| `react-dom`         | ^18.x   | React DOM rendering                             |
| `typescript`        | ^5.x    | Type safety end-to-end                          |

### Styling

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `tailwindcss`       | ^3.x    | Utility-first CSS framework                     |
| `postcss`           | latest  | CSS processing pipeline                         |
| `autoprefixer`      | latest  | Vendor prefix otomatis                          |

### PWA

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `next-pwa`          | latest  | Service worker + manifest generation untuk PWA  |

### Database & Auth

| Package                    | Versi   | Peruntukan                               |
| -------------------------- | ------- | ---------------------------------------- |
| `@supabase/supabase-js`   | ^2.x    | Supabase client (query, auth, realtime)  |
| `@supabase/ssr`           | latest  | Server-side Supabase client untuk Next.js |

### Map & Geolocation

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `leaflet`           | ^1.9.x  | Map rendering library                           |
| `react-leaflet`     | ^4.x    | React wrapper untuk Leaflet                     |
| `@types/leaflet`    | latest  | TypeScript types untuk Leaflet                  |

### Push Notification

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `firebase`          | ^10.x   | Firebase SDK — hanya FCM (Cloud Messaging)      |

### Validation & Utils

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `zod`               | ^3.x    | Schema validation (forms + API)                 |
| `date-fns`          | ^3.x    | Date formatting & manipulation                  |
| `lucide-react`      | latest  | Icon library (clean, consistent)                |

### Font

| Package             | Versi   | Peruntukan                                      |
| ------------------- | ------- | ----------------------------------------------- |
| `@next/font`        | built-in| Google Fonts optimization (Inter)               |

---

## 2. Dev Dependencies

| Package                    | Peruntukan                               |
| -------------------------- | ---------------------------------------- |
| `eslint`                   | Linting                                  |
| `eslint-config-next`       | Next.js ESLint rules                     |
| `prettier`                 | Code formatting                          |
| `@types/react`             | React types                              |
| `@types/node`              | Node.js types                            |

---

## 3. Environment Variables

File `.env.local` (jangan di-commit, ada di `.gitignore`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxx  # hanya server-side, jangan expose ke client

# Firebase (FCM)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPxxxxxxxxxx  # untuk web push

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_RADIUS=2000  # radius default dalam meter
```

> **PENTING**: Variable dengan prefix `NEXT_PUBLIC_` akan ter-expose ke client. Jangan taruh secret di situ.

---

## 4. Alasan Pemilihan Teknologi

| Teknologi          | Alasan                                                                                |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Next.js**        | SSR + API routes dalam satu codebase, performa optimal, native Vercel support         |
| **Tailwind CSS**   | Rapid prototyping, konsisten, responsive-first, sangat populer di kompetisi            |
| **Supabase**       | PostgreSQL managed + PostGIS + Auth + Realtime dalam satu platform, free tier generous |
| **PostGIS**        | Extension PostgreSQL untuk geo-query radius — industry standard, cepat                |
| **Leaflet + OSM**  | Gratis tanpa API key (vs Google Maps), ringan, customizable                           |
| **FCM**            | Push notification gratis unlimited (Spark plan), mature SDK, cross-browser            |
| **Vercel**         | Sesuai anjuran panitia, zero-config deploy untuk Next.js, preview deploys             |
| **TypeScript**     | Type safety, autocomplete, mengurangi runtime error, standar industri                  |
| **Zod**            | Schema validation yang bisa dipakai di client + server, type inference otomatis        |
| **Lucide Icons**   | Lightweight (tree-shakable), clean design, React-native support                       |

---

## 5. Catatan untuk AI Agent

- Selalu gunakan import dari `@supabase/ssr` (bukan `@supabase/auth-helpers-nextjs` yang deprecated).
- Leaflet CSS harus di-import manual: `import 'leaflet/dist/leaflet.css'` di komponen map.
- Leaflet tidak SSR-compatible — gunakan `dynamic(() => import(...), { ssr: false })` dari `next/dynamic`.
- Firebase SDK hanya digunakan untuk FCM, **bukan** untuk auth/database (itu pakai Supabase).
- Zod schemas sebaiknya didefinisikan di `src/types/` dan dipakai bersama oleh client form + API validation.
- `next-pwa` di-config di `next.config.js` — hanya aktifkan di production (`disable: process.env.NODE_ENV === 'development'`).

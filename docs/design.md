# Design System & UI/UX — KerjaMicro

## 1. Design Philosophy

KerjaMicro harus terasa **cepat, lokal, dan terpercaya**. Desain diarahkan mobile-first (PWA) dengan nuansa yang:

- **Friendly & Approachable** — target user mahasiswa, jadi hindari kesan terlalu korporat
- **Clean & Functional** — task-centric, informasi penting langsung terlihat
- **Trustworthy** — rating, verifikasi, status jelas — membangun kepercayaan antar user
- **Location-aware** — map dan info lokasi selalu prominent

---

## 2. Color Palette

### Primary Colors

| Token               | Hex       | Penggunaan                                |
| -------------------- | --------- | ----------------------------------------- |
| `--primary-50`       | `#EEF2FF` | Background subtle                         |
| `--primary-100`      | `#E0E7FF` | Hover state, selected background          |
| `--primary-500`      | `#6366F1` | Primary buttons, links, accents           |
| `--primary-600`      | `#4F46E5` | Primary button hover                      |
| `--primary-700`      | `#4338CA` | Active state, pressed                     |
| `--primary-900`      | `#312E81` | Dark text on light bg                     |

> Warna primary: **Indigo** — profesional tapi tetap friendly, berbeda dari biru generik.

### Secondary / Accent

| Token               | Hex       | Penggunaan                                |
| -------------------- | --------- | ----------------------------------------- |
| `--accent-400`       | `#34D399` | Success, completed, poin masuk            |
| `--accent-500`       | `#10B981` | Emerald green — CTA sekunder              |
| `--warning-400`      | `#FBBF24` | Warning, pending status                   |
| `--warning-500`      | `#F59E0B` | Amber — attention needed                  |
| `--error-400`        | `#F87171` | Error, cancelled                          |
| `--error-500`        | `#EF4444` | Red — destructive actions                 |

### Neutral

| Token               | Hex       | Penggunaan                                |
| -------------------- | --------- | ----------------------------------------- |
| `--gray-50`          | `#F9FAFB` | Page background                           |
| `--gray-100`         | `#F3F4F6` | Card background, input bg                 |
| `--gray-200`         | `#E5E7EB` | Borders, dividers                         |
| `--gray-400`         | `#9CA3AF` | Placeholder text, disabled                |
| `--gray-600`         | `#4B5563` | Secondary text                            |
| `--gray-800`         | `#1F2937` | Primary text                              |
| `--gray-900`         | `#111827` | Headings                                  |

### Dark Mode (Opsional — P2)

Jika dark mode diimplementasi, inverse neutral scale:
- Background: `#0F172A` (slate-900)
- Card: `#1E293B` (slate-800)
- Text: `#F1F5F9` (slate-100)

---

## 3. Typography

### Font Family

```css
--font-sans: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

> **Inter** — clean, highly readable, excellent di small sizes (mobile). Load dari Google Fonts.

### Type Scale

| Name     | Size   | Weight  | Line Height | Penggunaan                    |
| -------- | ------ | ------- | ----------- | ----------------------------- |
| `h1`     | 30px   | 700     | 1.2         | Page title                    |
| `h2`     | 24px   | 600     | 1.3         | Section heading               |
| `h3`     | 20px   | 600     | 1.4         | Card title, subsection        |
| `h4`     | 18px   | 500     | 1.4         | Sub-heading                   |
| `body`   | 16px   | 400     | 1.5         | Body text                     |
| `body-sm`| 14px   | 400     | 1.5         | Secondary text, metadata      |
| `caption`| 12px   | 400     | 1.4         | Timestamps, labels, helper    |
| `button` | 14px   | 500     | 1           | Button text                   |

---

## 4. Spacing & Layout

### Spacing Scale

Menggunakan kelipatan 4px (Tailwind default):

```
4px  → p-1    (micro spacing)
8px  → p-2    (tight spacing)
12px → p-3    (compact spacing)
16px → p-4    (standard spacing)
20px → p-5
24px → p-6    (section gap)
32px → p-8    (large gap)
48px → p-12   (section padding)
```

### Breakpoints (Tailwind)

| Breakpoint | Min Width | Target Device          |
| ---------- | --------- | ---------------------- |
| `sm`       | 640px     | Large phone landscape  |
| `md`       | 768px     | Tablet                 |
| `lg`       | 1024px    | Laptop                 |
| `xl`       | 1280px    | Desktop                |

**Mobile-first**: desain default untuk viewport 360-414px (smartphone). Lalu scale up.

### Border Radius

```
--radius-sm: 6px;     (buttons kecil, badges)
--radius-md: 8px;     (cards, inputs)
--radius-lg: 12px;    (modals, large cards)
--radius-xl: 16px;    (map container, hero sections)
--radius-full: 9999px; (avatars, pills)
```

---

## 5. Komponen UI Utama

### 5.1 Bottom Navigation (Mobile)

Karena PWA mobile-first, gunakan bottom nav (bukan hamburger):

```
┌─────────────────────────────────┐
│  🏠 Feed   🗺️ Map   ➕ Post   │
│  👤 Profil  🔔 Notif           │
└─────────────────────────────────┘
```

- 5 tab max
- Icon + label
- Active state: primary color + filled icon
- Badge counter pada Notif (unread count)

### 5.2 Task Card

```
┌─────────────────────────────────────┐
│ 📸 Fotografi          🟢 Open       │
│                                     │
│ Foto Produk UMKM                    │
│ Butuh bantuan foto 20 produk...     │
│                                     │
│ 📍 0.8 km  ⏱️ 2 jam  💰 50 poin    │
│                                     │
│ ★ 4.8 · @username · 5 menit lalu   │
└─────────────────────────────────────┘
```

Elemen penting di card:
- Kategori badge (warna per kategori)
- Status badge (open/accepted/in_progress/completed)
- Judul + deskripsi truncated (2 baris max)
- Jarak dari user (km/m), estimasi waktu, kompensasi poin
- Rating requester + username + relative time

### 5.3 Map View

- Full-width map (Leaflet + OSM tiles)
- Marker cluster jika task banyak
- Radius circle semi-transparent (primary-100 fill, primary-500 border)
- Bottom sheet overlay untuk task list (draggable)
- Marker warna berbeda per kategori

### 5.4 Status Badge Colors

| Status        | Background       | Text            |
| ------------- | ---------------- | --------------- |
| `open`        | `emerald-100`    | `emerald-700`   |
| `accepted`    | `blue-100`       | `blue-700`      |
| `in_progress` | `amber-100`      | `amber-700`     |
| `completed`   | `gray-100`       | `gray-600`      |
| `cancelled`   | `red-100`        | `red-700`       |

### 5.5 Rating Stars

- Filled star: `amber-400` (#FBBF24)
- Empty star: `gray-200` (#E5E7EB)
- Half star: gradient fill
- Ukuran: 16px (inline) atau 24px (review form)

### 5.6 Buttons

| Variant    | Style                                              |
| ---------- | -------------------------------------------------- |
| Primary    | bg: primary-500, text: white, hover: primary-600   |
| Secondary  | bg: white, border: gray-200, text: gray-700        |
| Danger     | bg: error-500, text: white                         |
| Ghost      | bg: transparent, text: primary-500                 |
| Disabled   | bg: gray-100, text: gray-400, cursor: not-allowed  |

Semua button: `border-radius: 8px`, `padding: 10px 20px`, transisi 150ms.

---

## 6. Micro-Animations & Transitions

| Element           | Animasi                                    | Durasi |
| ----------------- | ------------------------------------------ | ------ |
| Page transition   | Fade in                                    | 200ms  |
| Card hover        | Subtle lift (translateY -2px) + shadow     | 150ms  |
| Button press      | Scale down (0.97)                          | 100ms  |
| Status change     | Color morph + subtle pulse                 | 300ms  |
| Map marker appear | Pop in (scale 0→1) + bounce               | 400ms  |
| Bottom sheet      | Slide up + backdrop fade                   | 250ms  |
| Notification bell | Shake animation saat ada notif baru        | 500ms  |
| Skeleton loading  | Shimmer gradient (gray-100 → gray-200)     | loop   |

---

## 7. Responsivitas

### Mobile (< 640px) — Primary target

- Bottom navigation
- Single column layout
- Map view: full screen dengan bottom sheet
- Card: full width, stacked
- Touch targets minimal 44x44px

### Tablet (768px - 1024px)

- Side navigation (collapsible)
- 2-column grid untuk task cards
- Map + list side-by-side (split view)

### Desktop (> 1024px)

- Persistent sidebar navigation
- 3-column grid untuk task cards
- Map panel + task list panel + detail panel (3-pane layout)

---

## 8. Ikonografi

Gunakan icon library yang konsisten. Rekomendasi:

- **Lucide Icons** (successor Feather Icons) — clean, lightweight, React-ready
- Atau **Heroicons** (by Tailwind team) — well-maintained

Jangan mix icon libraries. Pilih satu dan konsisten.

---

## 9. Aksesibilitas (a11y)

- Contrast ratio minimal 4.5:1 untuk text
- Focus ring visible pada semua interactive elements
- Semantic HTML (button, nav, main, section, article)
- Alt text pada semua images
- Keyboard navigable (tab order logis)
- ARIA labels pada icon-only buttons

---

## 10. Catatan untuk AI Agent

- Selalu gunakan **Tailwind CSS utility classes**, bukan custom CSS kecuali untuk animasi kompleks.
- Mobile-first: tulis styling untuk mobile dulu, lalu tambahkan `sm:`, `md:`, `lg:` breakpoints.
- Gunakan `Inter` font via `next/font/google` (otomatis optimized oleh Next.js).
- Komponen harus reusable — buat di `src/components/ui/` untuk primitives.
- Skeleton loading wajib untuk semua data-fetching state (jangan blank/spinner saja).
- Setiap warna status harus konsisten di seluruh app (lihat tabel Status Badge Colors).

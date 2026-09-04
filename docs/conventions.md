# Konvensi & Aturan Kode — CEPAT (Cari Entry Pekerjaan Area Terdekat)

## 1. Naming Conventions

### Files & Folders

| Jenis                  | Convention         | Contoh                         |
| ---------------------- | ------------------ | ------------------------------ |
| Komponen React         | PascalCase         | `TaskCard.tsx`, `MapView.tsx`  |
| Hooks                  | camelCase, `use-`  | `useGeolocation.ts`            |
| Utility functions      | camelCase          | `formatDistance.ts`            |
| API routes             | kebab-case folder  | `api/tasks/[id]/route.ts`      |
| Types/interfaces       | PascalCase         | `Task`, `UserProfile`          |
| Constants              | SCREAMING_SNAKE    | `MAX_RADIUS_METERS`            |
| CSS/Tailwind           | kebab-case (jika custom) | `task-card`, `map-container` |
| Service files          | kebab-case + `.service` | `task.service.ts`          |

### Variables & Functions

```typescript
// ✅ Good
const taskList: Task[] = [];
function getTaskById(id: string): Promise<Task> {}
const MAX_RADIUS_METERS = 5000;

// ❌ Bad
const task_list = [];
function GetTaskById() {}
const maxRadiusMeters = 5000;  // gunakan SCREAMING_SNAKE untuk constants
```

---

## 2. Project Structure Rules

```
src/
├── app/          # HANYA route files (page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx)
├── components/   # Reusable UI components (ui/, admin/, landing/, task/, motion/)
├── features/     # Modul fitur khusus (auth/, chat/, task/)
├── hooks/        # Custom React hooks (useGeolocation, useDebounce, dll)
├── lib/          # Library configs (prisma.ts, midtrans.ts, firebase/, supabase/, utils/)
├── services/     # Heavy business logic & database transaction layer
├── types/        # TypeScript types, Zod schemas, enums
└── proxy.ts      # Next.js Middleware (Admin & Supabase Auth Guards)
```

**Aturan:**
- **Jangan** taruh business logic di komponen React atau Route Handlers langsung — pindahkan ke `services/`.
- **Jangan** taruh UI components di `app/` — hanya route-level files.
- **Database Operations**: Gunakan Prisma ORM Client singleton (`@/lib/prisma`) untuk semua operasi data publik. Jangan buat instance Prisma baru.
- **Atomic Transactions**: Setiap mutasi saldo atau perubahan status tugas yang melibatkan escrow WAJIB dibungkus dalam `prisma.$transaction`.
- **Case-Insensitivity**: Selalu sertakan `mode: 'insensitive'` pada klausa `where` pencarian string/enum di Prisma.
- Setiap komponen di `ui/` harus generic dan reusable, tanpa dependency ke data/API spesifik.

---

## 3. Component Patterns

### File Structure per Component

```tsx
// TaskCard.tsx
'use client'; // hanya jika perlu interactivity (onClick, useState, dll)

import { ... } from 'react';
import { ... } from '@/types/task';

// Types (jika hanya dipakai di file ini)
interface TaskCardProps {
  task: Task;
  onAccept?: (taskId: string) => void;
  showDistance?: boolean;
}

// Component
export function TaskCard({ task, onAccept, showDistance = true }: TaskCardProps) {
  return (
    // ...
  );
}
```

**Aturan:**
- Export **named** (bukan default export) — kecuali page/layout Next.js yang wajib default.
- `'use client'` hanya jika komponen benar-benar butuh client-side interactivity.
- Props interface didefinisikan di file yang sama jika hanya dipakai di situ.
- Shared types di `src/types/`.

### Server vs Client Components

```
Server Component (default):
- Fetch data langsung di komponen
- Tidak ada useState, useEffect, onClick
- Contoh: page.tsx, layout.tsx, data-fetching wrappers

Client Component ('use client'):
- Interactive elements (forms, buttons, maps)
- Browser APIs (geolocation, notifications)
- State management (useState, useReducer)
- Contoh: TaskForm, MapView, BottomNav
```

---

## 4. API Route Patterns

### Struktur File

```
src/app/api/tasks/route.ts         → GET (list), POST (create)
src/app/api/tasks/[id]/route.ts    → GET (detail), PATCH, DELETE
src/app/api/tasks/[id]/apply/route.ts → POST (apply to task)
```

### Template API Route

```typescript
// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTaskSchema } from '@/lib/validations/task.schema';
import { taskService } from '@/services/task.service';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse & validate input
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      );
    }

    // 3. Business logic (via service)
    const result = await taskService.createTask(user.id, parsed.data);

    // 4. Return response
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}
```

---

## 5. TypeScript Rules

```typescript
// ✅ Selalu definisikan return type untuk functions publik
export function calculateDistance(from: GeoPoint, to: GeoPoint): number { }

// ✅ Gunakan Zod untuk runtime validation + type inference (di src/lib/validations/)
import { z } from 'zod';
export const createTaskSchema = z.object({
  judul_tugas: z.string().min(5).max(100),
  deskripsi_tugas: z.string().min(20).max(1000),
  id_category: z.string().uuid(),
  lokasi_lat: z.number().min(-90).max(90),
  lokasi_lng: z.number().min(-180).max(180),
  estimasi_waktu: z.string().optional(),
  kompensasi: z.number().min(1),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ✅ Gunakan Prisma Client types / src/types/database.ts untuk shared entity types
import type { Task, StatusTask } from '@prisma/client';

// ❌ Jangan pakai `any` — gunakan `unknown` lalu narrow
```

---

## 6. Import Alias

Gunakan `@/` path alias (configured di `tsconfig.json`):

```typescript
// ✅ Good
import { TaskCard } from '@/features/task/components/TaskCard';
import { createClient } from '@/lib/supabase/server';
import type { Task } from '@prisma/client';

// ❌ Bad
import { TaskCard } from '../../../features/task/components/TaskCard';
```

---

## 7. Error Handling

- API routes: always try-catch, return structured error JSON.
- Client: gunakan `error.tsx` boundary per route segment.
- `loading.tsx` untuk skeleton state per route segment.
- Log errors ke console di development; di production pertimbangkan Sentry (opsional).

---

## 8. Git Commit Conventions

```
feat: add task creation form with geolocation
fix: radius filter not working on map view
docs: update API documentation for task endpoints
style: adjust task card spacing on mobile
refactor: extract geo-query logic to service
chore: update dependencies
```

Format: `type: description` (lowercase, imperative mood, max 72 chars).

---

## 9. Catatan untuk AI Agent

- Selalu ikuti pola di atas saat generate kode baru.
- Gunakan `@/` alias untuk semua imports.
- Pisahkan server/client components secara eksplisit.
- Setiap API endpoint harus punya: auth check → validation → service call → response.
- Jangan generate kode dengan `any` type — selalu properly typed.
- Prefer named exports kecuali Next.js page/layout.
- Jangan lupa `'use client'` directive kalau komponen butuh interactivity.

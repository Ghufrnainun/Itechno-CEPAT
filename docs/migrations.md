# 🚀 Handover Guide: Backend CEPAT (Cari Entry Pekerjaan Area Terdekat)

**Di-update oleh:** Hamim
**Status:** Fase 1 (Database & ORM) - SELESAI ✅

Halo tim! 
Gua udah kelar nge-setup fondasi utama *database* kita pakai **Prisma** dan udah di- *push* ke **Supabase**. Struktur tabel (ERD) udah sinkron 100% dan siap dipake ngoding fitur *frontend*.

Dokumen ini gua bikin biar kalian nggak usah baca kodingan dari awal dan bisa langsung tancap gas ngelanjutin ke Fase 2 (Auth & UI). 

---

## 🛠️ Apa Aja yang Udah Gua Kerjain?

1. **Setup Prisma 7:** Gua udah buang setup URL lama dan udah pakai `prisma.config.ts` (standar terbaru Prisma).
2. **Migrasi Database (`npx prisma migrate dev`):** Semua tabel (User, Task, Transactions, dll) udah *live* di Supabase kita.
3. **Prisma Client (`lib/prisma.ts`):** Gua udah bikinin *singleton connection*. Jadi kalian kalau mau manggil data, **JANGAN** inisialisasi `new PrismaClient()` lagi, langsung *import* dari *file* ini aja biar nggak *memory leak*.

---

## ⚠️ Langkah PERTAMA Kalian (Wajib Dilakuin Pas Baru Pull dari GitHub)

Begitu kalian nge-*pull* kodingan ini ke laptop masing-masing, jangan langsung `npm run dev`. Ikutin *step* ini dulu berurutan:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup File .env Lokal:**
    Minta password Supabase ke gua. Terus bikin file .env di root folder, isinya gini:
    Cuplikan kode
    ```bash
    DATABASE_URL="postgresql://postgres.mprfyueonleyvelcjsuh:[PASSWORD_YANG_GUA_KASIH]@[aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true](https://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true)"
    DIRECT_URL="postgresql://postgres.mprfyueonleyvelcjsuh:[PASSWORD_YANG_GUA_KASIH]@[aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres](https://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres)"
    ```

3. **Generate Prisma Client Lokal:**
    Biar VS Code kalian ngenalin tabel-tabelnya (biar auto-complete-nya nyala), jalanin ini:
    ```bash
    npx prisma generate
    ```
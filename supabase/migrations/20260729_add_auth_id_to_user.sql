-- ============================================================
-- Migration: Add auth_id column to User table
-- Menghubungkan tabel User Prisma dengan Supabase Auth (auth.users)
-- ============================================================

-- Tambah kolom auth_id ke tabel User (nullable dulu agar tidak break data lama)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Tambah index untuk performa lookup saat RLS diaktifkan
CREATE INDEX IF NOT EXISTS idx_user_auth_id ON "User"(auth_id);

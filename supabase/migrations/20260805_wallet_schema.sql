-- ================================================================
-- Migration: 20260805_wallet_schema.sql
-- Deskripsi: Tambah held_balance ke User dan sub_type enum ke Transactions
-- Alasan: Memisahkan sumber kebenaran jenis transaksi dari deskripsi teks;
--         held_balance eksplisit untuk atomicity escrow di 1 DB transaction.
-- ================================================================

-- 1. Tambah kolom held_balance ke tabel User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "held_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- 2. Buat enum TransactionSubType
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionSubType') THEN
    CREATE TYPE "TransactionSubType" AS ENUM (
      'topup',
      'task_earning',
      'task_payment',
      'refund',
      'hold'
    );
  END IF;
END
$$;

-- 3. Tambah kolom sub_type ke tabel Transactions
--    Sementara NULLABLE dulu agar tidak break data lama, nanti diisi default
ALTER TABLE "Transactions"
  ADD COLUMN IF NOT EXISTS "sub_type" "TransactionSubType";

-- 4. Back-fill data lama: MASUK → topup (best-guess untuk demo data)
UPDATE "Transactions"
  SET "sub_type" = 'topup'
  WHERE "sub_type" IS NULL AND "tipe_transaksi" = 'MASUK';

UPDATE "Transactions"
  SET "sub_type" = 'task_payment'
  WHERE "sub_type" IS NULL AND "tipe_transaksi" = 'KELUAR';

-- 5. Set NOT NULL setelah back-fill selesai
ALTER TABLE "Transactions"
  ALTER COLUMN "sub_type" SET NOT NULL;

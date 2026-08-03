-- Add fcm_token column to User table if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fcm_token" TEXT;

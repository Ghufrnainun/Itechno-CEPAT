-- ============================================================
-- RLS Hardening: Restrict Direct Client Mutations on User and Task
-- Project: CEPAT
-- Migration: 20260901_fix_user_task_direct_rls.sql
--
-- Background:
-- All business mutations (role, balance, ban, task status, escrow)
-- are executed server-side via Next.js API routes with Prisma.
-- Direct client Data API UPDATE on "User" and "Task" tables
-- is disabled to prevent privilege escalation and balance tampering.
-- ============================================================

-- 1. Table: User
DROP POLICY IF EXISTS "User can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own safe profile columns" ON "User";

-- Profile mutations must go through Next.js Server API routes (Prisma)
-- Direct client UPDATE via Supabase Data API is restricted
CREATE POLICY "No direct client update on users"
ON "User" FOR UPDATE
TO authenticated
USING (false);

-- 2. Table: Task
DROP POLICY IF EXISTS "Requester can update own task" ON "Task";

-- Task lifecycle, status transitions, and escrow modifications must
-- go through Next.js Server API routes (Prisma)
CREATE POLICY "No direct client update on tasks"
ON "Task" FOR UPDATE
TO authenticated
USING (false);

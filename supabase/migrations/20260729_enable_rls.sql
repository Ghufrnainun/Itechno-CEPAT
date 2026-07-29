-- ============================================================
-- Row Level Security (RLS) Policies
-- Project: CEPAT (Cari Entry Pekerjaan Area Terdekat)
-- ============================================================

-- Utility: Resolve internal user ID from Supabase Auth UUID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
  SELECT id_user FROM "User" WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- 1. TABLE: User
-- ============================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all profiles
CREATE POLICY "Public can view all profiles"
ON "User" FOR SELECT
USING (true);

-- Restrict profile updates to the authenticated owner
CREATE POLICY "User can update own profile"
ON "User" FOR UPDATE
USING (auth.uid()::text = auth_id::text)
WITH CHECK (auth.uid()::text = auth_id::text);

-- Prevent direct deletion of user records
CREATE POLICY "No direct delete on users"
ON "User" FOR DELETE
USING (false);


-- ============================================================
-- 2. TABLE: Task
-- ============================================================
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all tasks
CREATE POLICY "Authenticated users can view all tasks"
ON "Task" FOR SELECT
TO authenticated
USING (true);

-- Restrict task creation to the authenticated requester
CREATE POLICY "User can create own task"
ON "Task" FOR INSERT
TO authenticated
WITH CHECK (id_requester = public.get_current_user_id());

-- Restrict task updates to the authenticated owner
CREATE POLICY "Requester can update own task"
ON "Task" FOR UPDATE
TO authenticated
USING (id_requester = public.get_current_user_id())
WITH CHECK (id_requester = public.get_current_user_id());

-- Restrict task deletion to the authenticated owner
CREATE POLICY "Requester can delete own task"
ON "Task" FOR DELETE
TO authenticated
USING (id_requester = public.get_current_user_id());


-- ============================================================
-- 3. TABLE: Transactions
-- ============================================================
ALTER TABLE "Transactions" ENABLE ROW LEVEL SECURITY;

-- Restrict visibility to the transaction owner
CREATE POLICY "User can view own transactions"
ON "Transactions" FOR SELECT
TO authenticated
USING (id_user = public.get_current_user_id());

-- Prevent direct inserts; transactions must be handled via secure backend services
CREATE POLICY "No direct insert on transactions"
ON "Transactions" FOR INSERT
WITH CHECK (false);

-- Prevent modification of transaction history
CREATE POLICY "No update on transactions"
ON "Transactions" FOR UPDATE
USING (false);

CREATE POLICY "No delete on transactions"
ON "Transactions" FOR DELETE
USING (false);


-- ============================================================
-- 4. TABLE: SkillsUser
-- ============================================================
ALTER TABLE "SkillsUser" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to user skills
CREATE POLICY "Public can view all user skills"
ON "SkillsUser" FOR SELECT
USING (true);

-- Restrict skill insertion to the authenticated owner
CREATE POLICY "User can add own skills"
ON "SkillsUser" FOR INSERT
TO authenticated
WITH CHECK (id_user = public.get_current_user_id());

-- Restrict skill updates to the authenticated owner
CREATE POLICY "User can update own skills"
ON "SkillsUser" FOR UPDATE
TO authenticated
USING (id_user = public.get_current_user_id());

-- Restrict skill deletion to the authenticated owner
CREATE POLICY "User can delete own skills"
ON "SkillsUser" FOR DELETE
TO authenticated
USING (id_user = public.get_current_user_id());


-- ============================================================
-- 5. TABLE: Notifications
-- ============================================================
ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;

-- Restrict visibility to the notification owner
CREATE POLICY "User can view own notifications"
ON "Notifications" FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

-- Allow owners to update their notifications (e.g., mark as read)
CREATE POLICY "User can update own notifications"
ON "Notifications" FOR UPDATE
TO authenticated
USING (user_id = public.get_current_user_id());

-- Prevent direct inserts; notifications must be generated via backend triggers
CREATE POLICY "No direct insert on notifications"
ON "Notifications" FOR INSERT
WITH CHECK (false);


-- ============================================================
-- 6. TABLE: TaskApplicants
-- ============================================================
ALTER TABLE "TaskApplicants" ENABLE ROW LEVEL SECURITY;

-- Allow visibility for the applicant and the task owner
CREATE POLICY "User can view relevant applications"
ON "TaskApplicants" FOR SELECT
TO authenticated
USING (
  id_worker = public.get_current_user_id()
  OR EXISTS (
    SELECT 1 FROM "Task" t
    WHERE t.id_tasks = id_tasks
    AND t.id_requester = public.get_current_user_id()
  )
);

-- Allow workers to apply for tasks, excluding their own tasks
CREATE POLICY "Worker can apply to task"
ON "TaskApplicants" FOR INSERT
TO authenticated
WITH CHECK (
  id_worker = public.get_current_user_id()
  AND NOT EXISTS (
    SELECT 1 FROM "Task" t
    WHERE t.id_tasks = id_tasks
    AND t.id_requester = public.get_current_user_id()
  )
);

-- Allow workers to withdraw their own applications
CREATE POLICY "Worker can withdraw own application"
ON "TaskApplicants" FOR DELETE
TO authenticated
USING (id_worker = public.get_current_user_id());


-- ============================================================
-- 7. TABLE: Reviews
-- ============================================================
ALTER TABLE "Reviews" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reviews
CREATE POLICY "Authenticated users can view reviews"
ON "Reviews" FOR SELECT
TO authenticated
USING (true);

-- Restrict review creation to authenticated users, preventing self-reviews
CREATE POLICY "User can create review, not for themselves"
ON "Reviews" FOR INSERT
TO authenticated
WITH CHECK (
  id_rater = public.get_current_user_id()
  AND id_rater != id_ratee
);

-- Prevent modification of submitted reviews
CREATE POLICY "No update on reviews"
ON "Reviews" FOR UPDATE
USING (false);


-- ============================================================
-- 8. LOOKUP TABLES
-- ============================================================
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on Role"
ON "Role" FOR SELECT USING (true);

ALTER TABLE "StatusTask" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on StatusTask"
ON "StatusTask" FOR SELECT USING (true);

ALTER TABLE "StatusTaskApplicants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on StatusTaskApplicants"
ON "StatusTaskApplicants" FOR SELECT USING (true);

ALTER TABLE "SkillsMaster" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on SkillsMaster"
ON "SkillsMaster" FOR SELECT USING (true);

ALTER TABLE "TaskRequirements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access on TaskRequirements"
ON "TaskRequirements" FOR SELECT USING (true);

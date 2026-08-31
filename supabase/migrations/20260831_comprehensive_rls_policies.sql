-- ============================================================
-- Row Level Security (RLS) Comprehensive Policies
-- Project: CEPAT (Cari Entry Pekerjaan Area Terdekat)
-- Migration: 20260831_comprehensive_rls_policies.sql
-- ============================================================

-- Ensure helper function exists
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS TEXT AS $$
  SELECT id_user FROM "User" WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. TaskCategory
ALTER TABLE "TaskCategory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access on TaskCategory" ON "TaskCategory";
CREATE POLICY "Public read access on TaskCategory"
ON "TaskCategory" FOR SELECT USING (true);

-- 2. PortfolioItem
ALTER TABLE "PortfolioItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view portfolio items" ON "PortfolioItem";
DROP POLICY IF EXISTS "User can create own portfolio items" ON "PortfolioItem";
DROP POLICY IF EXISTS "User can update own portfolio items" ON "PortfolioItem";
DROP POLICY IF EXISTS "User can delete own portfolio items" ON "PortfolioItem";

CREATE POLICY "Public can view portfolio items"
ON "PortfolioItem" FOR SELECT
USING (true);

CREATE POLICY "User can create own portfolio items"
ON "PortfolioItem" FOR INSERT
TO authenticated
WITH CHECK (id_user = public.get_current_user_id());

CREATE POLICY "User can update own portfolio items"
ON "PortfolioItem" FOR UPDATE
TO authenticated
USING (id_user = public.get_current_user_id())
WITH CHECK (id_user = public.get_current_user_id());

CREATE POLICY "User can delete own portfolio items"
ON "PortfolioItem" FOR DELETE
TO authenticated
USING (id_user = public.get_current_user_id());

-- 3. Gamification (Badge, UserBadge, UserStreak)
ALTER TABLE "Badge" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access on Badge" ON "Badge";
CREATE POLICY "Public read access on Badge"
ON "Badge" FOR SELECT USING (true);

ALTER TABLE "UserBadge" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access on UserBadge" ON "UserBadge";
CREATE POLICY "Public read access on UserBadge"
ON "UserBadge" FOR SELECT USING (true);

ALTER TABLE "UserStreak" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access on UserStreak" ON "UserStreak";
CREATE POLICY "Public read access on UserStreak"
ON "UserStreak" FOR SELECT USING (true);

-- 4. PaymentTransaction
ALTER TABLE "PaymentTransaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view own payment transactions" ON "PaymentTransaction";
DROP POLICY IF EXISTS "No direct insert on payment transactions" ON "PaymentTransaction";
DROP POLICY IF EXISTS "No direct update on payment transactions" ON "PaymentTransaction";
DROP POLICY IF EXISTS "No direct delete on payment transactions" ON "PaymentTransaction";

CREATE POLICY "User can view own payment transactions"
ON "PaymentTransaction" FOR SELECT
TO authenticated
USING (id_user = public.get_current_user_id());

CREATE POLICY "No direct insert on payment transactions"
ON "PaymentTransaction" FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update on payment transactions"
ON "PaymentTransaction" FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on payment transactions"
ON "PaymentTransaction" FOR DELETE
USING (false);

-- 5. UserReport
ALTER TABLE "UserReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view own reports" ON "UserReport";
DROP POLICY IF EXISTS "User can submit report" ON "UserReport";
DROP POLICY IF EXISTS "No direct update on reports" ON "UserReport";
DROP POLICY IF EXISTS "No direct delete on reports" ON "UserReport";

CREATE POLICY "User can view own reports"
ON "UserReport" FOR SELECT
TO authenticated
USING (user_id = public.get_current_user_id());

CREATE POLICY "User can submit report"
ON "UserReport" FOR INSERT
TO authenticated
WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "No direct update on reports"
ON "UserReport" FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on reports"
ON "UserReport" FOR DELETE
USING (false);

-- 6. Dispute & Resolution Center
ALTER TABLE "Dispute" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view dispute" ON "Dispute";
DROP POLICY IF EXISTS "Reporter can create dispute" ON "Dispute";
DROP POLICY IF EXISTS "No direct update on dispute" ON "Dispute";
DROP POLICY IF EXISTS "No direct delete on dispute" ON "Dispute";

CREATE POLICY "Participants can view dispute"
ON "Dispute" FOR SELECT
TO authenticated
USING (
  id_reporter = public.get_current_user_id() OR
  id_respondent = public.get_current_user_id()
);

CREATE POLICY "Reporter can create dispute"
ON "Dispute" FOR INSERT
TO authenticated
WITH CHECK (
  id_reporter = public.get_current_user_id()
);

CREATE POLICY "No direct update on dispute"
ON "Dispute" FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on dispute"
ON "Dispute" FOR DELETE
USING (false);

-- 7. DisputeEvidence
ALTER TABLE "DisputeEvidence" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view evidence" ON "DisputeEvidence";
DROP POLICY IF EXISTS "Participants can submit evidence" ON "DisputeEvidence";
DROP POLICY IF EXISTS "No direct update on evidence" ON "DisputeEvidence";
DROP POLICY IF EXISTS "No direct delete on evidence" ON "DisputeEvidence";

CREATE POLICY "Participants can view evidence"
ON "DisputeEvidence" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

CREATE POLICY "Participants can submit evidence"
ON "DisputeEvidence" FOR INSERT
TO authenticated
WITH CHECK (
  id_user = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

CREATE POLICY "No direct update on evidence"
ON "DisputeEvidence" FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on evidence"
ON "DisputeEvidence" FOR DELETE
USING (false);

-- 8. DisputeMessage
ALTER TABLE "DisputeMessage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can view dispute messages" ON "DisputeMessage";
DROP POLICY IF EXISTS "Participants can send dispute messages" ON "DisputeMessage";
DROP POLICY IF EXISTS "No direct update on dispute messages" ON "DisputeMessage";
DROP POLICY IF EXISTS "No direct delete on dispute messages" ON "DisputeMessage";

CREATE POLICY "Participants can view dispute messages"
ON "DisputeMessage" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

CREATE POLICY "Participants can send dispute messages"
ON "DisputeMessage" FOR INSERT
TO authenticated
WITH CHECK (
  id_sender = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

CREATE POLICY "No direct update on dispute messages"
ON "DisputeMessage" FOR UPDATE
USING (false);

CREATE POLICY "No direct delete on dispute messages"
ON "DisputeMessage" FOR DELETE
USING (false);

-- 9. AdminSession
ALTER TABLE "AdminSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No public access on AdminSession" ON "AdminSession";
CREATE POLICY "No public access on AdminSession"
ON "AdminSession" FOR ALL
USING (false);

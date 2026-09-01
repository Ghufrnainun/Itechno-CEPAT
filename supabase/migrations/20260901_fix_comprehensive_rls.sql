-- ============================================================
-- Row Level Security (RLS) Comprehensive Hotfix
-- Project: CEPAT (Cari Entry Pekerjaan Area Terdekat)
-- Migration: 20260901_fix_comprehensive_rls.sql
-- ============================================================

-- 1. Perbaiki RLS DisputeEvidence: kualifikasikan "DisputeEvidence".id_dispute
DROP POLICY IF EXISTS "Participants can view evidence" ON "DisputeEvidence";
CREATE POLICY "Participants can view evidence"
ON "DisputeEvidence" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = "DisputeEvidence".id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Participants can submit evidence" ON "DisputeEvidence";
CREATE POLICY "Participants can submit evidence"
ON "DisputeEvidence" FOR INSERT TO authenticated
WITH CHECK (
  id_user = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = "DisputeEvidence".id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

-- 2. Perbaiki RLS DisputeMessage: kualifikasikan "DisputeMessage".id_dispute
DROP POLICY IF EXISTS "Participants can view dispute messages" ON "DisputeMessage";
CREATE POLICY "Participants can view dispute messages"
ON "DisputeMessage" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = "DisputeMessage".id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Participants can send dispute messages" ON "DisputeMessage";
CREATE POLICY "Participants can send dispute messages"
ON "DisputeMessage" FOR INSERT TO authenticated
WITH CHECK (
  id_sender = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "Dispute" d
    WHERE d.id_dispute = "DisputeMessage".id_dispute
    AND (
      d.id_reporter = public.get_current_user_id() OR
      d.id_respondent = public.get_current_user_id()
    )
  )
);

-- 3. Perbaiki RLS ChatRoom: wajibkan relasi task valid dan partisipan yang sah
DROP POLICY IF EXISTS "ChatRoom participants can create" ON "ChatRoom";
CREATE POLICY "ChatRoom participants can create"
ON "ChatRoom" FOR INSERT TO authenticated
WITH CHECK (
  (id_requester = public.get_current_user_id() OR id_worker = public.get_current_user_id())
  AND EXISTS (
    SELECT 1 FROM "Task" t
    WHERE t.id_tasks = "ChatRoom".id_tasks
    AND (
      t.id_requester = public.get_current_user_id() OR 
      EXISTS (
        SELECT 1 FROM "TaskApplicants" ta 
        WHERE ta.id_tasks = t.id_tasks AND ta.id_worker = public.get_current_user_id()
      )
    )
  )
);

-- 4. Perbaiki RLS Message: kualifikasikan "Message".id_chat_room
DROP POLICY IF EXISTS "Message participants can view" ON "Message";
CREATE POLICY "Message participants can view"
ON "Message" FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "ChatRoom" c
    WHERE c.id_chat_room = "Message".id_chat_room
    AND (
      c.id_requester = public.get_current_user_id() OR 
      c.id_worker = public.get_current_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Message participants can insert" ON "Message";
CREATE POLICY "Message participants can insert"
ON "Message" FOR INSERT TO authenticated
WITH CHECK (
  id_sender = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "ChatRoom" c
    WHERE c.id_chat_room = "Message".id_chat_room
    AND (
      c.id_requester = public.get_current_user_id() OR 
      c.id_worker = public.get_current_user_id()
    )
  )
);

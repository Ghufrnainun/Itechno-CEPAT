-- ============================================================
-- SQL Migrations for Chat Features (Storage & RLS)
-- Project: CEPAT
-- ============================================================

-- 1. Create a Storage Bucket for Chat Images
-- (Assuming the Supabase storage schema exists. Supabase provisions this automatically)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Row Level Security for ChatRoom
ALTER TABLE "ChatRoom" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ChatRoom participants can view"
ON "ChatRoom" FOR SELECT
TO authenticated
USING (
  id_requester = public.get_current_user_id() OR 
  id_worker = public.get_current_user_id()
);

CREATE POLICY "ChatRoom participants can create"
ON "ChatRoom" FOR INSERT
TO authenticated
WITH CHECK (
  id_requester = public.get_current_user_id() OR 
  id_worker = public.get_current_user_id()
);

-- 3. Row Level Security for Message
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Message participants can view"
ON "Message" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "ChatRoom" c
    WHERE c.id_chat_room = id_chat_room
    AND (
      c.id_requester = public.get_current_user_id() OR 
      c.id_worker = public.get_current_user_id()
    )
  )
);

CREATE POLICY "Message participants can insert"
ON "Message" FOR INSERT
TO authenticated
WITH CHECK (
  id_sender = public.get_current_user_id() AND
  EXISTS (
    SELECT 1 FROM "ChatRoom" c
    WHERE c.id_chat_room = id_chat_room
    AND (
      c.id_requester = public.get_current_user_id() OR 
      c.id_worker = public.get_current_user_id()
    )
  )
);

-- 4. Storage Bucket Policies for 'chat-images'
-- Authenticated users can upload to chat-images
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
);

-- Public can read chat images
CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-images'
);

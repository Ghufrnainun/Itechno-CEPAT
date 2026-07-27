-- ========================================================
-- RADIUS (MICRO-TASK & FREELANCING PLATFORM) DDL SCHEMA
-- Target Database: PostgreSQL / Supabase
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE task_status AS ENUM (
  'OPEN',        -- Task baru dibuat, mencari tasker
  'ASSIGNED',    -- Tasker sudah dipilih oleh Poster
  'IN_PROGRESS', -- Tasker sedang mengerjakan
  'SUBMITTED',   -- Tasker telah mengirimkan bukti pengerjaan
  'COMPLETED',   -- Poster telah mengonfirmasi & saldo escrow cair
  'CANCELLED'    -- Task dibatalkan & saldo di-refund ke Poster
);

CREATE TYPE application_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED'
);

CREATE TYPE transaction_type AS ENUM (
  'TOPUP',           -- Tambah saldo akun
  'ESCROW_LOCK',     -- Saldo dikunci saat buat task
  'ESCROW_RELEASE',  -- Saldo cair ke tasker saat task selesai
  'ESCROW_REFUND',   -- Saldo balik ke poster jika batal
  'WITHDRAWAL'       -- Penarikan saldo
);

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone_number TEXT,
  bio TEXT,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 100000.00, -- Default Rp 100.000 (saldo awal demo)
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  reward NUMERIC(12, 2) NOT NULL CHECK (reward > 0),
  status task_status NOT NULL DEFAULT 'OPEN',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_name TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index geospatial sederhana untuk pencarian radius cepat (Haversine formula support)
CREATE INDEX IF NOT EXISTS idx_tasks_location ON public.tasks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- 4. TABLE TASK APPLICATIONS
CREATE TABLE IF NOT EXISTS public.task_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pitch_message TEXT,
  status application_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, applicant_id) -- Prevent double apply
);

-- 5. TABLE TASK SUBMISSIONS (BUKTI PENGERJAAN)
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_description TEXT NOT NULL,
  proof_urls TEXT[] DEFAULT '{}', -- Array URL foto bukti di Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLE WALLET TRANSACTIONS (AUDIT TRAIL LOG ESCROW)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLE CHATS & MESSAGES (REALTIME CHAT)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, poster_id, tasker_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLE REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- ========================================================
-- STORED PROCEDURES / FUNCTIONS FOR ESCROW LOGIC
-- ========================================================

-- Function: Create Task & Lock Balance in Escrow
CREATE OR REPLACE FUNCTION public.create_task_with_escrow(
  p_poster_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_category TEXT,
  p_reward NUMERIC(12,2),
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_address_name TEXT,
  p_deadline TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_poster_balance NUMERIC(12,2);
  v_new_task_id UUID;
BEGIN
  -- Check poster balance
  SELECT balance INTO v_poster_balance FROM public.profiles WHERE id = p_poster_id FOR UPDATE;
  
  IF v_poster_balance IS NULL THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

  IF v_poster_balance < p_reward THEN
    RAISE EXCEPTION 'Saldo Anda tidak mencukupi untuk membuat tugas ini. Saldo: %, Butuh: %', v_poster_balance, p_reward;
  END IF;

  -- 1. Deduct balance from poster
  UPDATE public.profiles
  SET balance = balance - p_reward,
      updated_at = NOW()
  WHERE id = p_poster_id;

  -- 2. Insert new task
  INSERT INTO public.tasks (
    poster_id, title, description, category, reward, status, latitude, longitude, address_name, deadline
  ) VALUES (
    p_poster_id, p_title, p_description, p_category, p_reward, 'OPEN', p_latitude, p_longitude, p_address_name, p_deadline
  ) RETURNING id INTO v_new_task_id;

  -- 3. Log escrow lock transaction
  INSERT INTO public.wallet_transactions (user_id, task_id, amount, type, description)
  VALUES (p_poster_id, v_new_task_id, -p_reward, 'ESCROW_LOCK', 'Saldo dikunci untuk imbalan tugas: ' || p_title);

  RETURN v_new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Complete Task & Release Escrow to Tasker
CREATE OR REPLACE FUNCTION public.complete_task_and_release_escrow(
  p_task_id UUID,
  p_poster_id UUID
) RETURNS VOID AS $$
DECLARE
  v_task_reward NUMERIC(12,2);
  v_tasker_id UUID;
  v_task_status task_status;
  v_task_title TEXT;
BEGIN
  -- Select task details with row lock
  SELECT reward, tasker_id, status, title 
  INTO v_task_reward, v_tasker_id, v_task_status, v_task_title
  FROM public.tasks
  WHERE id = p_task_id AND poster_id = p_poster_id
  FOR UPDATE;

  IF v_tasker_id IS NULL THEN
    RAISE EXCEPTION 'Tugas ini belum memiliki pekerja yang ditunjuk.';
  END IF;

  IF v_task_status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Tugas ini sudah diselesaikan sebelumnya.';
  END IF;

  -- 1. Update task status to COMPLETED
  UPDATE public.tasks
  SET status = 'COMPLETED',
      updated_at = NOW()
  WHERE id = p_task_id;

  -- 2. Add reward to Tasker balance
  UPDATE public.profiles
  SET balance = balance + v_task_reward,
      updated_at = NOW()
  WHERE id = v_tasker_id;

  -- 3. Log escrow release transaction
  INSERT INTO public.wallet_transactions (user_id, task_id, amount, type, description)
  VALUES (v_tasker_id, p_task_id, v_task_reward, 'ESCROW_RELEASE', 'Penerimaan imbalan tugas selesai: ' || v_task_title);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Calculate Haversine Distance (in KM)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r DOUBLE PRECISION := 6371.0; -- Radius bumi dalam KM
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

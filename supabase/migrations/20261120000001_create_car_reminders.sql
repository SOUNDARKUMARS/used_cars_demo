-- ==========================================================================
-- Migration: Create Car Reminders Table
-- Tracks buyer vehicle alert requests (by brand, model, year range, price range, etc.)
-- Automatically matches incoming inventory and notifies potential buyers via email
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.car_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  make TEXT,
  model TEXT,
  min_year INTEGER,
  max_year INTEGER,
  min_price NUMERIC,
  max_price NUMERIC,
  fuel_type TEXT DEFAULT 'Any',
  transmission TEXT DEFAULT 'Any',
  body_type TEXT DEFAULT 'Any',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'notified', 'fulfilled', 'cancelled'
  user_id TEXT,
  notification_count INTEGER NOT NULL DEFAULT 0,
  last_notified_at TIMESTAMPTZ,
  matched_car_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================================
-- INDEXES FOR FAST MATCHING & QUERYING
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_car_reminders_status ON public.car_reminders(status);
CREATE INDEX IF NOT EXISTS idx_car_reminders_email ON public.car_reminders(email);
CREATE INDEX IF NOT EXISTS idx_car_reminders_make ON public.car_reminders(make);
CREATE INDEX IF NOT EXISTS idx_car_reminders_created_at ON public.car_reminders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_reminders_price ON public.car_reminders(min_price, max_price);
CREATE INDEX IF NOT EXISTS idx_car_reminders_year ON public.car_reminders(min_year, max_year);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================
ALTER TABLE public.car_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on car_reminders" ON public.car_reminders;
CREATE POLICY "Allow public select on car_reminders" ON public.car_reminders 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on car_reminders" ON public.car_reminders;
CREATE POLICY "Allow public insert on car_reminders" ON public.car_reminders 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on car_reminders" ON public.car_reminders;
CREATE POLICY "Allow public update on car_reminders" ON public.car_reminders 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on car_reminders" ON public.car_reminders;
CREATE POLICY "Allow public delete on car_reminders" ON public.car_reminders 
  FOR DELETE TO anon, authenticated USING (true);

-- ==========================================================================
-- EXPOSE TO DATA API
-- ==========================================================================
GRANT ALL ON public.car_reminders TO anon, authenticated;

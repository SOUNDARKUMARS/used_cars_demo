-- ==========================================================================
-- Migration: Create Analytics Events Table
-- Tracks user searches, filter range applications, sorting, and wishlist events
-- Provides structured data for AI behavioral analysis and market demand intelligence
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  session_id TEXT NOT NULL,
  search_query TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_by TEXT,
  car_id TEXT,
  car_details JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================================
-- INDEXES FOR FAST ANALYTICS QUERIES & AI AGGREGATIONS
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_car_id ON public.analytics_events(car_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_query ON public.analytics_events(search_query);
CREATE INDEX IF NOT EXISTS idx_analytics_events_filters ON public.analytics_events USING gin (filters);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON public.analytics_events USING gin (metadata);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public select on analytics_events" ON public.analytics_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert on analytics_events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public delete on analytics_events" ON public.analytics_events FOR DELETE TO anon, authenticated USING (true);

-- ==========================================================================
-- EXPOSE TO DATA API
-- ==========================================================================
GRANT ALL ON public.analytics_events TO anon, authenticated;

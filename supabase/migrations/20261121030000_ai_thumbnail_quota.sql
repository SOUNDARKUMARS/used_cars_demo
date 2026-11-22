-- Monthly allowance for AI studio thumbnails. One row, reset when the month changes.
CREATE TABLE IF NOT EXISTS public.ai_thumbnail_quota (
  id TEXT PRIMARY KEY DEFAULT 'site',
  period TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  monthly_limit INTEGER NOT NULL DEFAULT 200 CHECK (monthly_limit > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.ai_thumbnail_quota (id, period, used, monthly_limit)
VALUES ('site', to_char(timezone('utc'::text, now()), 'YYYY-MM'), 0, 200)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ai_thumbnail_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on ai thumbnail quota" ON public.ai_thumbnail_quota;
CREATE POLICY "Allow public select on ai thumbnail quota"
  ON public.ai_thumbnail_quota FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on ai thumbnail quota" ON public.ai_thumbnail_quota;
CREATE POLICY "Allow public insert on ai thumbnail quota"
  ON public.ai_thumbnail_quota FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on ai thumbnail quota" ON public.ai_thumbnail_quota;
CREATE POLICY "Allow public update on ai thumbnail quota"
  ON public.ai_thumbnail_quota FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

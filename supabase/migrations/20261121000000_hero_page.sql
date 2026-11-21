-- ==========================================================================
-- HERO PAGE
-- Run this once in the Supabase SQL editor.
-- 1. Lets an admin mark any car for the home hero carousel (show_in_hero).
-- 2. Stores the eyebrow, headline, description, and three stats.
-- ==========================================================================

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS show_in_hero BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS cars_show_in_hero_idx
  ON public.cars (show_in_hero)
  WHERE show_in_hero = true;

CREATE TABLE IF NOT EXISTS public.hero_content (
  id TEXT PRIMARY KEY DEFAULT 'site',
  eyebrow TEXT NOT NULL DEFAULT 'PRE-OWNED CARS IN TAMIL NADU',
  headline TEXT NOT NULL DEFAULT 'Quality Used Cars.',
  headline_accent TEXT NOT NULL DEFAULT 'Hassle-Free.',
  description TEXT NOT NULL DEFAULT 'Certified pre-owned cars, transparent pricing, and complete peace of mind for your next drive.',
  card_label TEXT NOT NULL DEFAULT 'NEW HIGH-VALUE LAUNCH',
  stat_1_value TEXT NOT NULL DEFAULT '2,500+',
  stat_1_label TEXT NOT NULL DEFAULT 'Happy Owners',
  stat_2_value TEXT NOT NULL DEFAULT '100%',
  stat_2_label TEXT NOT NULL DEFAULT 'Verified & Inspected',
  stat_3_value TEXT NOT NULL DEFAULT '1-Year',
  stat_3_label TEXT NOT NULL DEFAULT 'Engine Warranty',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.hero_content (id)
VALUES ('site')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_hero_content_updated_at ON public.hero_content;
CREATE TRIGGER set_hero_content_updated_at
  BEFORE UPDATE ON public.hero_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on hero_content" ON public.hero_content;
CREATE POLICY "Allow public select on hero_content"
  ON public.hero_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on hero_content" ON public.hero_content;
CREATE POLICY "Allow public insert on hero_content"
  ON public.hero_content FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on hero_content" ON public.hero_content;
CREATE POLICY "Allow public update on hero_content"
  ON public.hero_content FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

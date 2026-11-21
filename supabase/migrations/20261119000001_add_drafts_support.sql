-- Migration: Add Drafts Support to Cars Table
-- Allows saving incomplete/in-progress car listings as drafts before publishing to live store

-- 1. Update check constraint on listing_status to allow 'Draft' and 'Upcoming'
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_listing_status_check;
ALTER TABLE public.cars ADD CONSTRAINT cars_listing_status_check 
  CHECK (listing_status IN ('Available', 'Reserved', 'Sold', 'Draft', 'Upcoming'));

-- 2. Add is_draft boolean column
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;

-- 3. Add last_saved_at timestamp
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. Create index on is_draft and listing_status
CREATE INDEX IF NOT EXISTS idx_cars_is_draft ON public.cars(is_draft);
CREATE INDEX IF NOT EXISTS idx_cars_draft_status ON public.cars(listing_status) WHERE listing_status = 'Draft';

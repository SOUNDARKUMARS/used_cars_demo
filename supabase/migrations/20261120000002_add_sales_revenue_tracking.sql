-- ==========================================================================
-- Migration: Add Sales & Revenue Tracking to Cars Table
-- Tracks sold_at timestamp, sold_price (sales revenue), net revenue, and buyer notes
-- Powers dealership revenue graphs, monthly sales volume trends, and model metrics
-- ==========================================================================

-- 1. Add sales revenue and sold metadata columns to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS sold_price NUMERIC(12, 2);
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS revenue NUMERIC(12, 2);
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS sold_to TEXT;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS sold_notes TEXT;

-- 2. Indexes for fast sales analytics aggregations & time-series charting
CREATE INDEX IF NOT EXISTS idx_cars_sold_at ON public.cars(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_cars_listing_status ON public.cars(listing_status);
CREATE INDEX IF NOT EXISTS idx_cars_model ON public.cars(model);
CREATE INDEX IF NOT EXISTS idx_cars_body_type ON public.cars(body_type);
CREATE INDEX IF NOT EXISTS idx_cars_revenue ON public.cars(revenue);

-- 3. Backfill existing 'Sold' cars if any
UPDATE public.cars
SET 
  sold_at = COALESCE(sold_at, updated_at, created_at),
  sold_price = COALESCE(sold_price, price),
  revenue = COALESCE(revenue, price)
WHERE listing_status = 'Sold';

-- Per-car EMI terms set by the admin.
-- Existing listings stay EMI-available and keep their current emi text until an admin saves new terms.

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS emi_available BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS emi_down_payment NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS emi_interest_rate NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS emi_tenure_months INTEGER,
  ADD COLUMN IF NOT EXISTS emi_note TEXT;

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_emi_down_payment_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_emi_down_payment_check
  CHECK (emi_down_payment IS NULL OR emi_down_payment >= 0);

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_emi_interest_rate_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_emi_interest_rate_check
  CHECK (emi_interest_rate IS NULL OR (emi_interest_rate >= 0 AND emi_interest_rate <= 100));

ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_emi_tenure_months_check;
ALTER TABLE public.cars
  ADD CONSTRAINT cars_emi_tenure_months_check
  CHECK (emi_tenure_months IS NULL OR (emi_tenure_months >= 1 AND emi_tenure_months <= 120));

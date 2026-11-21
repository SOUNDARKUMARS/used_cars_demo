-- ==========================================================================
-- NOVA MOTORS - SUPABASE DATABASE SCHEMA & PRODUCTION MIGRATION
-- Supabase Project URL: https://qkriofsteqxccheavuot.supabase.co
-- Target Database: PostgreSQL 15+ (Supabase)
-- Generated: 2026-11-19T13:47:23.400Z
-- ==========================================================================

-- ==========================================================================
-- 1. EXTENSIONS
-- ==========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================================
-- 2. TABLE DEFINITIONS (DDL)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 2.1 DEALERS (Physical Dealership Showrooms / Hubs)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dealers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  hours TEXT,
  rating NUMERIC(3, 1) DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 0,
  badge TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.2 CARS (Used Car Inventory)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cars (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2100),
  variant TEXT,
  title TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  price_formatted TEXT,
  emi TEXT,
  emi_numeric NUMERIC(10, 2),
  emi_available BOOLEAN NOT NULL DEFAULT true,
  emi_down_payment NUMERIC(12, 2),
  emi_interest_rate NUMERIC(5, 2),
  emi_tenure_months INTEGER,
  emi_note TEXT,
  inspected BOOLEAN NOT NULL DEFAULT true,
  inspected_badge TEXT DEFAULT 'Inspected & Verified',
  home_inspected_badge TEXT DEFAULT 'Inspected',
  km TEXT NOT NULL,
  km_numeric INTEGER NOT NULL DEFAULT 0 CHECK (km_numeric >= 0),
  fuel TEXT NOT NULL CHECK (fuel IN ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid')),
  transmission TEXT NOT NULL CHECK (transmission IN ('Manual', 'Automatic', 'CVT', 'DCT', 'AMT', 'iMT')),
  ownership TEXT DEFAULT '1st Owner',
  location TEXT NOT NULL,
  body_type TEXT NOT NULL CHECK (body_type IN ('Sedan', 'Hatchback', 'SUV', 'MPV', 'Coupe', 'Convertible')),
  color TEXT,
  insurance TEXT,
  rto TEXT,
  image TEXT NOT NULL,
  cutout_image TEXT,
  detail_hero_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_photos INTEGER NOT NULL DEFAULT 0,
  about_summary TEXT,
  about_full TEXT,
  key_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  extended_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  condition_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  dealer_id TEXT REFERENCES public.dealers(id) ON DELETE SET NULL,
  dealer JSONB,
  listing_status TEXT NOT NULL DEFAULT 'Available' CHECK (listing_status IN ('Available', 'Reserved', 'Sold', 'Draft', 'Upcoming')),
  show_in_hero BOOLEAN NOT NULL DEFAULT false,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  last_saved_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.2b HERO PAGE COPY (single row, id = 'site')
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 2.3 TEST DRIVE BOOKINGS
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_drive_bookings (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  car_id TEXT REFERENCES public.cars(id) ON DELETE SET NULL,
  car_title TEXT NOT NULL,
  car_price TEXT,
  car_image TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  slot TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('home', 'hub')),
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  booked_at TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.4 SELL CAR REQUESTS (Trade-In / Valuation)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sell_requests (
  id TEXT PRIMARY KEY,
  reg_number TEXT NOT NULL,
  car_title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  km TEXT NOT NULL,
  fuel TEXT NOT NULL,
  transmission TEXT NOT NULL,
  estimated_range TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  inspection_scheduled TEXT DEFAULT 'Pending',
  status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Inspection Scheduled', 'Offer Accepted', 'Completed', 'Rejected')),
  photo_count INTEGER NOT NULL DEFAULT 0,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_at TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.5 LEADS (WhatsApp, Callback Requests, Finance)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  car_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT,
  status TEXT NOT NULL DEFAULT 'New Lead' CHECK (status IN ('New Lead', 'Contacted', 'Pending Callback', 'Application in Review', 'Closed')),
  timestamp BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.6 ACTIVITIES (Dealership Audit & Notification Feed)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'primary' CHECK (color IN ('primary', 'success', 'info', 'warning', 'danger')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2.7 SAVED CARS (User Wishlist)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  car_id TEXT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_car UNIQUE (user_identifier, car_id)
);

-- --------------------------------------------------------------------------
-- 2.8 ANALYTICS EVENTS (User Searches, Filters, Sorts, Wishlists & AI Analysis)
-- --------------------------------------------------------------------------
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
-- 3. INDEXES (Foreign Keys, Common Filters, and Searches)
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_cars_dealer_id ON public.cars(dealer_id);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_body_type ON public.cars(body_type);
CREATE INDEX IF NOT EXISTS idx_cars_fuel ON public.cars(fuel);
CREATE INDEX IF NOT EXISTS idx_cars_listing_status ON public.cars(listing_status);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_drive_car_id ON public.test_drive_bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_status ON public.test_drive_bookings(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_phone ON public.test_drive_bookings(phone);

CREATE INDEX IF NOT EXISTS idx_sell_requests_status ON public.sell_requests(status);
CREATE INDEX IF NOT EXISTS idx_sell_requests_phone ON public.sell_requests(phone);
CREATE INDEX IF NOT EXISTS idx_sell_requests_reg ON public.sell_requests(reg_number);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

CREATE INDEX IF NOT EXISTS idx_saved_cars_user ON public.saved_cars(user_identifier);
CREATE INDEX IF NOT EXISTS idx_saved_cars_car ON public.saved_cars(car_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_car_id ON public.analytics_events(car_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_query ON public.analytics_events(search_query);
CREATE INDEX IF NOT EXISTS idx_analytics_events_filters ON public.analytics_events USING gin (filters);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata ON public.analytics_events USING gin (metadata);

-- ==========================================================================
-- 4. AUTOMATIC updated_at TRIGGER FUNCTION
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cars_updated_at ON public.cars;
CREATE TRIGGER set_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_hero_content_updated_at ON public.hero_content;
CREATE TRIGGER set_hero_content_updated_at BEFORE UPDATE ON public.hero_content FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_test_drive_updated_at ON public.test_drive_bookings;
CREATE TRIGGER set_test_drive_updated_at BEFORE UPDATE ON public.test_drive_bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_sell_requests_updated_at ON public.sell_requests;
CREATE TRIGGER set_sell_requests_updated_at BEFORE UPDATE ON public.sell_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on dealers" ON public.dealers;
CREATE POLICY "Allow public select on dealers" ON public.dealers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on dealers" ON public.dealers;
CREATE POLICY "Allow public insert on dealers" ON public.dealers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on dealers" ON public.dealers;
CREATE POLICY "Allow public update on dealers" ON public.dealers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on dealers" ON public.dealers;
CREATE POLICY "Allow public delete on dealers" ON public.dealers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on cars" ON public.cars;
CREATE POLICY "Allow public select on cars" ON public.cars FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on cars" ON public.cars;
CREATE POLICY "Allow public insert on cars" ON public.cars FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on cars" ON public.cars;
CREATE POLICY "Allow public update on cars" ON public.cars FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on cars" ON public.cars;
CREATE POLICY "Allow public delete on cars" ON public.cars FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on hero_content" ON public.hero_content;
CREATE POLICY "Allow public select on hero_content" ON public.hero_content FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on hero_content" ON public.hero_content;
CREATE POLICY "Allow public insert on hero_content" ON public.hero_content FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on hero_content" ON public.hero_content;
CREATE POLICY "Allow public update on hero_content" ON public.hero_content FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on test_drive_bookings" ON public.test_drive_bookings;
CREATE POLICY "Allow public select on test_drive_bookings" ON public.test_drive_bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on test_drive_bookings" ON public.test_drive_bookings;
CREATE POLICY "Allow public insert on test_drive_bookings" ON public.test_drive_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on test_drive_bookings" ON public.test_drive_bookings;
CREATE POLICY "Allow public update on test_drive_bookings" ON public.test_drive_bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on test_drive_bookings" ON public.test_drive_bookings;
CREATE POLICY "Allow public delete on test_drive_bookings" ON public.test_drive_bookings FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on sell_requests" ON public.sell_requests;
CREATE POLICY "Allow public select on sell_requests" ON public.sell_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on sell_requests" ON public.sell_requests;
CREATE POLICY "Allow public insert on sell_requests" ON public.sell_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on sell_requests" ON public.sell_requests;
CREATE POLICY "Allow public update on sell_requests" ON public.sell_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on sell_requests" ON public.sell_requests;
CREATE POLICY "Allow public delete on sell_requests" ON public.sell_requests FOR DELETE TO anon, authenticated USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'sell_requests'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sell_requests;
  END IF;
END $$;

DROP POLICY IF EXISTS "Allow public select on leads" ON public.leads;
CREATE POLICY "Allow public select on leads" ON public.leads FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on leads" ON public.leads;
CREATE POLICY "Allow public insert on leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on leads" ON public.leads;
CREATE POLICY "Allow public update on leads" ON public.leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on leads" ON public.leads;
CREATE POLICY "Allow public delete on leads" ON public.leads FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on activities" ON public.activities;
CREATE POLICY "Allow public select on activities" ON public.activities FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on activities" ON public.activities;
CREATE POLICY "Allow public insert on activities" ON public.activities FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on activities" ON public.activities;
CREATE POLICY "Allow public update on activities" ON public.activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on activities" ON public.activities;
CREATE POLICY "Allow public delete on activities" ON public.activities FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on saved_cars" ON public.saved_cars;
CREATE POLICY "Allow public select on saved_cars" ON public.saved_cars FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on saved_cars" ON public.saved_cars;
CREATE POLICY "Allow public insert on saved_cars" ON public.saved_cars FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on saved_cars" ON public.saved_cars;
CREATE POLICY "Allow public update on saved_cars" ON public.saved_cars FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on saved_cars" ON public.saved_cars;
CREATE POLICY "Allow public delete on saved_cars" ON public.saved_cars FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public select on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public select on analytics_events" ON public.analytics_events FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public insert on analytics_events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on analytics_events" ON public.analytics_events;
CREATE POLICY "Allow public delete on analytics_events" ON public.analytics_events FOR DELETE TO anon, authenticated USING (true);

-- ==========================================================================
-- 6. GRANTS FOR REST DATA API ACCESS
-- ==========================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ==========================================================================
-- 7. PRE-POPULATED SEED DATA
-- ==========================================================================

-- 7.0 SEED HERO PAGE COPY
INSERT INTO public.hero_content (id)
VALUES ('site')
ON CONFLICT (id) DO NOTHING;

-- 7.1 SEED DEALERS
INSERT INTO public.dealers (id, name, address, city, phone, whatsapp, hours, rating, reviews_count, badge, image)
VALUES
  ('nova-coimbatore', 'Nova Motors Coimbatore Hub', 'Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004', 'Coimbatore', '+91 94882 12044', '+919488212044', 'Mon - Sun: 9:30 AM - 8:30 PM', 4.9, 382, 'Premier Certified Hub', '/nova/dealer-thumb.jpg'),
  ('nova-tiruppur', 'Nova Motors Tiruppur Hub', 'Kangeyam Road, Near Collectorate, Tiruppur - 641604', 'Tiruppur', '+91 94882 12044', '+919488212044', 'Mon - Sun: 9:30 AM - 8:30 PM', 4.8, 247, 'Certified Inspection Center', '/nova/dealer-thumb.jpg')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone;

-- 7.2 SEED CARS INVENTORY
INSERT INTO public.cars (
  id, make, model, year, variant, title, price, price_formatted, emi, emi_numeric,
  inspected, inspected_badge, home_inspected_badge, km, km_numeric, fuel, transmission,
  ownership, location, body_type, color, insurance, rto, image, cutout_image,
  detail_hero_image, gallery, total_photos, about_summary, about_full, key_features,
  extended_features, condition_history, dealer_id, dealer, listing_status
)
VALUES
  (
'honda-city-2023',
    'Honda',
    'City',
    2023,
    'ZX CVT',
    '2023 Honda City',
    1150000,
    '₹ 11,50,000',
    'EMI from ₹ 20,334/mo',
    20334,
    true,
    'Inspected & Verified',
    'Inspected',
    '28,000 km',
    28000,
    'Petrol',
    'Automatic',
    '1st Owner',
    'Tiruppur, Tamil Nadu',
    'Sedan',
    'Golden Brown Metallic / Carbon Grey',
    'Comprehensive valid till Oct 2025',
    'TN-39 (Tiruppur)',
    '/mock_cars/honda_city_front.jpg',
    '/mock_cars/honda_city_black.jpg',
    '/mock_cars/honda_city_front.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/honda_city_front.jpg","thumb":"/nova/thumb-1.jpg"},{"id":2,"label":"Exterior Rear","image":"/mock_cars/honda_city_rear.jpg","thumb":"/nova/thumb-2.jpg"},{"id":3,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"},{"id":4,"label":"Leather Seats & Sunroof","image":"/mock_cars/honda_city_leather_seats.jpg","thumb":"/nova/thumb-4.jpg"},{"id":5,"label":"Alloy Wheels & Tyres","image":"/mock_cars/honda_city_wheel.jpg","thumb":"/nova/thumb-5.jpg"}]'::jsonb,
    12,
    'Well maintained 2023 Honda City ZX CVT in excellent condition. Single owner, regularly serviced at authorized service center. Smooth drive, premium features, and great fuel efficiency.',
    'This top-spec Honda City ZX CVT comes loaded with Honda SENSING ADAS (Collision Mitigation Braking, Lane Keep Assist, Adaptive Cruise Control). Complete service records are up-to-date with 100% authorized Honda workshop history. Pristine dual-tone beige leather upholstery, zero flood damage, original paint, 85% tyre tread life on all four Michelin tyres, spare tyre unused, and both original smart keys available. Thoroughly vetted across our 200-point Nova Certification process.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '["Honda SENSING ADAS suite","LaneWatch Blind Spot Camera","8-inch Advanced Touchscreen with Wireless CarPlay","6 Airbags (Dual Front, Side & Full Curtain)","Full LED Headlamps with 9-Array Inline LEDs","LED DRLs & 3D LED Taillights","Auto-dimming Frameless IRVM","Tyre Pressure Monitoring System (TPMS)","CVT Paddle Shifters with Sport Mode","One-touch Electric Sunroof with Pinch Guard","Smart Keyless Entry with Walk-Away Auto Lock","Engine Start/Stop Button with Remote Engine Start"]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'maruti-swift-2022',
    'Maruti Suzuki',
    'Swift',
    2022,
    'ZXi 1.2 DualJet',
    '2022 Maruti Suzuki Swift',
    720000,
    '₹ 7,20,000',
    'EMI from ₹ 12,730/mo',
    12730,
    true,
    'Inspected & Verified',
    'Inspected',
    '22,000 km',
    22000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Coimbatore, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/maruti_swift_black.jpg',
    '/mock_cars/maruti_swift_black.jpg',
    '/mock_cars/maruti_swift_black.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/maruti_swift_black.jpg","thumb":"/mock_cars/maruti_swift_black.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"},{"id":3,"label":"Cabin Interior","image":"/mock_cars/honda_city_leather_seats.jpg","thumb":"/nova/thumb-4.jpg"}]'::jsonb,
    12,
    'Sporty and reliable Maruti Swift ZXi in Midnight Black. Excellent fuel efficiency of 23.2 kmpl, alloy wheels, push start button, and 7-inch SmartPlay infotainment.',
    'Single owner car meticulously maintained with full service history at ABT Maruti Coimbatore. Zero claims on comprehensive insurance. Dual front airbags, ABS with EBD, electronic stability program, and reverse parking sensors.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-coimbatore',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'vw-vento-2021',
    'Volkswagen',
    'Vento',
    2021,
    'Highline Plus 1.0 TSI AT',
    '2021 Volkswagen Vento',
    980000,
    '₹ 9,80,000',
    'EMI from ₹ 17,325/mo',
    17325,
    true,
    'Inspected & Verified',
    'Inspected',
    '36,000 km',
    36000,
    'Petrol',
    'Automatic',
    '1st Owner',
    'Coimbatore, Tamil Nadu',
    'Sedan',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/vw_vento_white.jpg',
    '/mock_cars/vw_vento_white.jpg',
    '/mock_cars/vw_vento_white.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/vw_vento_white.jpg","thumb":"/mock_cars/vw_vento_white.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"},{"id":3,"label":"Cabin Interior","image":"/mock_cars/honda_city_leather_seats.jpg","thumb":"/nova/thumb-4.jpg"}]'::jsonb,
    14,
    'Solid German engineering with 1.0L Turbocharged TSI engine delivering 110 PS. 6-speed torque converter automatic gearbox with paddle shifters.',
    'Immaculate Candy White Volkswagen Vento. Full leatherette upholstery, rain-sensing wipers, cruise control, auto-dimming IRVM, and LED headlights with DRLs. 100% authorized VW Ramani workshop records.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-coimbatore',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'hyundai-i10-2022',
    'Hyundai',
    'Grand i10',
    2022,
    'Nios Asta 1.2 Kappa',
    '2022 Hyundai Grand i10 Nios',
    640000,
    '₹ 6,40,000',
    'EMI from ₹ 11,315/mo',
    11315,
    true,
    'Inspected & Verified',
    'Inspected',
    '18,500 km',
    18500,
    'Petrol',
    'Manual',
    '1st Owner',
    'Erode, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/hyundai_grand_i10_white.jpg',
    '/mock_cars/hyundai_grand_i10_white.jpg',
    '/mock_cars/hyundai_grand_i10_white.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/hyundai_grand_i10_white.jpg","thumb":"/mock_cars/hyundai_grand_i10_white.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    10,
    'Top-spec Grand i10 Nios Asta in Polar White. Loaded with wireless phone charging, 8-inch touchscreen with Android Auto and Apple CarPlay, and diamond-cut alloys.',
    'Driven only 18,500 km by a single owner doctor. Pristine condition with complete Chandra Hyundai Erode service logs. Spare tyre never used, factory warranty active.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'ford-ecosport-2021',
    'Ford',
    'EcoSport',
    2021,
    'Titanium S 1.5 TDCi',
    '2021 Ford EcoSport',
    1025000,
    '₹ 10,25,000',
    'EMI from ₹ 18,120/mo',
    18120,
    true,
    'Inspected & Verified',
    'Inspected',
    '42,000 km',
    42000,
    'Diesel',
    'Manual',
    '1st Owner',
    'Salem, Tamil Nadu',
    'SUV',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/ford_ecosport_orange.jpg',
    '/mock_cars/ford_ecosport_orange.jpg',
    '/mock_cars/ford_ecosport_orange.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/ford_ecosport_orange.jpg","thumb":"/mock_cars/ford_ecosport_orange.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    15,
    'Legendary compact SUV with 1.5L TDCi turbo diesel engine. Canyon Ridge metallic with contrast black roof, electric sunroof, and 17-inch smoke alloy wheels.',
    'Unbeatable high-speed stability and build quality. 6 airbags, SYNC 3 touchscreen infotainment with voice control, tyre pressure monitoring, and cruise control. Full Rajshree Ford service history.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'maruti-scross-2021',
    'Maruti Suzuki',
    'S-Cross',
    2021,
    'Alpha 1.5 Smart Hybrid',
    '2021 Maruti Suzuki S-Cross',
    890000,
    '₹ 8,90,000',
    'EMI from ₹ 15,735/mo',
    15735,
    true,
    'Inspected & Verified',
    'Inspected',
    '31,000 km',
    31000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Tiruppur, Tamil Nadu',
    'SUV',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/maruti_scross_brown.jpg',
    '/mock_cars/maruti_scross_brown.jpg',
    '/mock_cars/maruti_scross_brown.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/maruti_scross_brown.jpg","thumb":"/mock_cars/maruti_scross_brown.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    12,
    'NEXA flagship crossover in Caffeine Brown. Smart Hybrid technology with lithium-ion dual battery system for smooth power assist and brake energy regeneration.',
    'Top Alpha variant with automatic LED projector headlamps, leather upholstery, cruise control, 60:40 split rear reclining seats, and 180 mm ground clearance. Verified genuine mileage.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'tata-tiago-2022',
    'Tata',
    'Tiago',
    2022,
    'XZ Plus Dual Tone',
    '2022 Tata Tiago',
    560000,
    '₹ 5,60,000',
    'EMI from ₹ 9,900/mo',
    9900,
    true,
    'Inspected & Verified',
    'Inspected',
    '19,000 km',
    19000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Coimbatore, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/tata_tiago_silver.jpg',
    '/mock_cars/tata_tiago_silver.jpg',
    '/mock_cars/tata_tiago_silver.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/tata_tiago_silver.jpg","thumb":"/mock_cars/tata_tiago_silver.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    10,
    '4-star Global NCAP safety rating. Harman 8-speaker surround sound system, 7-inch touchscreen, rear parking camera, and digital instrument cluster.',
    'Single owner car in Daytona Grey / Silver. Full comprehensive insurance valid, zero scratches, brand new condition inside out.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-coimbatore',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'renault-triber-2022',
    'Renault',
    'Triber',
    2022,
    'RXZ 7-Seater Modular',
    '2022 Renault Triber',
    695000,
    '₹ 6,95,000',
    'EMI from ₹ 12,285/mo',
    12285,
    true,
    'Inspected & Verified',
    'Inspected',
    '26,000 km',
    26000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Coimbatore, Tamil Nadu',
    'MPV',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/renault_triber_blue.jpg',
    '/mock_cars/renault_triber_blue.jpg',
    '/mock_cars/renault_triber_blue.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/renault_triber_blue.jpg","thumb":"/mock_cars/renault_triber_blue.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    14,
    'Ultra-versatile 7-seater MPV with removable 3rd row EasyFix seats expanding boot space up to 625 litres. 4 Airbags and dedicated AC vents for all 3 rows.',
    'Metal Mustard / Electric Blue with smart access card, push start, cooled central storage console, and LED instrument cluster. Exceptional family utility.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-coimbatore',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'skoda-rapid-2021',
    'Skoda',
    'Rapid',
    2021,
    'Rider Plus 1.0 TSI',
    '2021 Skoda Rapid',
    875000,
    '₹ 8,75,000',
    'EMI from ₹ 15,470/mo',
    15470,
    true,
    'Inspected & Verified',
    'Inspected',
    '29,000 km',
    29000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Madurai, Tamil Nadu',
    'Sedan',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/skoda_rapid_silver.jpg',
    '/mock_cars/skoda_rapid_silver.jpg',
    '/mock_cars/skoda_rapid_silver.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/skoda_rapid_silver.jpg","thumb":"/mock_cars/skoda_rapid_silver.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    12,
    'High-performance sedan powered by the acclaimed 1.0 TSI motor producing 175 Nm of torque. Brilliant highway stability and European road manners.',
    'Reflex Silver Skoda Rapid in pristine condition. Climatronic automatic AC, anti-pinch power windows on all doors, rear AC vents, and 6.5-inch touchscreen.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'maruti-baleno-2022',
    'Maruti Suzuki',
    'Baleno',
    2022,
    'Alpha 1.2 AMT',
    '2022 Maruti Suzuki Baleno',
    810000,
    '₹ 8,10,000',
    'EMI from ₹ 14,320/mo',
    14320,
    true,
    'Inspected & Verified',
    'Inspected',
    '21,000 km',
    21000,
    'Petrol',
    'Automatic',
    '1st Owner',
    'Tiruppur, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/maruti_baleno_blue.jpg',
    '/mock_cars/maruti_baleno_blue.jpg',
    '/mock_cars/maruti_baleno_blue.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/maruti_baleno_blue.jpg","thumb":"/mock_cars/maruti_baleno_blue.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    13,
    'Feature-loaded premium hatchback with Head-Up Display (HUD), 360-degree surround view camera, 9-inch SmartPlay Pro+ screen, and Arkamys surround sound.',
    'Celestial Blue NEXA Baleno Alpha. Full LED projector headlamps with NEXTre LED DRLs, auto-folding ORVMs, UV cut glass, and 6 airbags.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'maruti-alto-2020',
    'Maruti Suzuki',
    'Alto',
    2020,
    'K10 VXi',
    '2020 Maruti Suzuki Alto K10',
    360000,
    '₹ 3,60,000',
    'EMI from ₹ 6,365/mo',
    6365,
    true,
    'Inspected & Verified',
    'Inspected',
    '27,000 km',
    27000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Erode, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/maruti_alto_k10_silver.jpg',
    '/mock_cars/maruti_alto_k10_silver.jpg',
    '/mock_cars/maruti_alto_k10_silver.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/maruti_alto_k10_silver.jpg","thumb":"/mock_cars/maruti_alto_k10_silver.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    8,
    'The ideal budget city commuter. Peppy 1.0L K10B engine with 24 kmpl mileage, power steering, front power windows, and central locking.',
    'Silky Silver Alto K10 maintained in spotless showroom order. Single senior owner, company serviced, brand new battery, comprehensive insurance active.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'honda-amaze-2022',
    'Honda',
    'Amaze',
    2022,
    'VX CVT Diesel',
    '2022 Honda Amaze',
    840000,
    '₹ 8,40,000',
    'EMI from ₹ 14,850/mo',
    14850,
    true,
    'Inspected & Verified',
    'Inspected',
    '25,000 km',
    25000,
    'Diesel',
    'Automatic',
    '1st Owner',
    'Coimbatore, Tamil Nadu',
    'Sedan',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/honda_amaze_grey.jpg',
    '/mock_cars/honda_amaze_grey.jpg',
    '/mock_cars/honda_amaze_grey.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/honda_amaze_grey.jpg","thumb":"/mock_cars/honda_amaze_grey.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    11,
    'Extremely rare Diesel CVT automatic sedan delivering 23.8 kmpl. Paddle shifters, cruise control, auto LED projector headlights, and massive 420L boot.',
    'Modern Steel Metallic Honda Amaze VX. Single company executive owner, zero accident history, all periodic services performed at Sundaram Honda Coimbatore.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-coimbatore',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'renault-kwid-2022',
    'Renault',
    'Kwid',
    2022,
    'Climber 1.0 Easy-R AMT',
    '2022 Renault Kwid',
    480000,
    '₹ 4,80,000',
    'EMI from ₹ 8,485/mo',
    8485,
    true,
    'Inspected & Verified',
    'Inspected',
    '16,000 km',
    16000,
    'Petrol',
    'Automatic',
    '1st Owner',
    'Tiruppur, Tamil Nadu',
    'Hatchback',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/renault_kwid_blue.jpg',
    '/mock_cars/renault_kwid_blue.jpg',
    '/mock_cars/renault_kwid_blue.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/renault_kwid_blue.jpg","thumb":"/mock_cars/renault_kwid_blue.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    10,
    'Stylish micro-SUV styling with Zanskar Blue and orange accents. Easy-R dial shifter automatic, 8-inch MediaNAV touchscreen, and reverse camera.',
    'Driven only 16,000 km in Tiruppur. 184 mm class-leading ground clearance, roof rails, LED DRLs, and digital tachometer. 100% genuine.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  ),
  (
'tata-tigor-2021',
    'Tata',
    'Tigor',
    2021,
    'XZ Plus 1.2 Revotron',
    '2021 Tata Tigor',
    630000,
    '₹ 6,30,000',
    'EMI from ₹ 11,140/mo',
    11140,
    true,
    'Inspected & Verified',
    'Inspected',
    '30,000 km',
    30000,
    'Petrol',
    'Manual',
    '1st Owner',
    'Salem, Tamil Nadu',
    'Sedan',
    'Pearl White',
    'Valid Comprehensive',
    'TN-39 (Tiruppur)',
    '/mock_cars/tata_tigor_bronze.jpg',
    '/mock_cars/tata_tigor_bronze.jpg',
    '/mock_cars/tata_tigor_bronze.jpg',
    '[{"id":1,"label":"Exterior Front","image":"/mock_cars/tata_tigor_bronze.jpg","thumb":"/mock_cars/tata_tigor_bronze.jpg"},{"id":2,"label":"Cockpit Dashboard","image":"/mock_cars/honda_city_interior_dashboard.jpg","thumb":"/nova/thumb-3.jpg"}]'::jsonb,
    12,
    'The styleback sedan with 4-star safety rating. Deep Bronze metallic, automatic temperature control, 7-inch Harman infotainment, and 419L boot capacity.',
    'Single hand driven in Salem with verified service history at True Sai Tata. Dual airbags, corner stability control, and rear defogger.',
    '[{"id":"sunroof","name":"Sunroof","iconName":"Sun","iconUrl":"/icons/sunroof.png"},{"id":"leather-seats","name":"Leather Seats","iconName":"Armchair","iconUrl":"/icons/accessories.png"},{"id":"touchscreen","name":"Touchscreen","iconName":"Tv","iconUrl":"/icons/steering-audio.png"},{"id":"reverse-camera","name":"Reverse Camera","iconName":"Video","iconUrl":"/icons/safety-features.png"},{"id":"cruise-control","name":"Cruise Control","iconName":"Gauge","iconUrl":"/icons/cruise-control.png"},{"id":"airbags","name":"6 Airbags","iconName":"Shield","iconUrl":"/icons/airbags.png"},{"id":"abs-ebd","name":"ABS & EBD","iconName":"Disc","iconUrl":"/icons/abs.png"},{"id":"auto-climate","name":"Auto Climate AC","iconName":"Fan","iconUrl":"/icons/ac.png"}]'::jsonb,
    '[]'::jsonb,
    '[{"id":"inspected","title":"Inspected","subtitle":"200+ point check","iconName":"ShieldCheck","iconUrl":"/icons/quality-check-140.png","status":"Passed with A+ Grade"},{"id":"service","title":"Service History","subtitle":"Available","iconName":"Wrench","iconUrl":"/icons/service-icon.svg","status":"Fully Documented"},{"id":"accident","title":"No Major Accidents","subtitle":"Verified","iconName":"FileText","iconUrl":"/icons/verified-seller.png","status":"Clean Structure"},{"id":"rc","title":"RC Verified","subtitle":"TN RTO passing","iconName":"FileCheck","iconUrl":"/icons/rc-icon.svg","status":"Original RC Active"}]'::jsonb,
    'nova-tiruppur',
    '{"name":"Nova Motors Coimbatore Hub","address":"Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004","rating":4.9,"reviewsCount":382,"badge":"Premier Certified Hub","phone":"+91 94882 12044","whatsapp":"+919488212044","hours":"Mon - Sun: 9:30 AM - 8:30 PM","image":"/nova/dealer-thumb.jpg"}'::jsonb,
    'Available'
  )
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  listing_status = EXCLUDED.listing_status,
  updated_at = timezone('utc'::text, now());

-- 7.3 SEED TEST DRIVE BOOKINGS
INSERT INTO public.test_drive_bookings (
  id, ref, car_id, car_title, car_price, car_image, customer_name, phone, slot,
  location_type, address, status, booked_at, timestamp
)
VALUES
  (
'TD-9021',
    'NM-9021',
    'honda-city-2023',
    '2023 Honda City ZX CVT',
    '₹ 11,50,000',
    '/mock_cars/honda_city_front.jpg',
    'Karthik Subramanian',
    '98421 54321',
    'Tomorrow, 4:00 PM',
    'home',
    '14, Kangeyam Road, Tiruppur',
    'Pending',
    '25 mins ago',
    1795094543400
  ),
  (
'TD-8942',
    'NM-8942',
    'maruti-swift-2022',
    '2022 Maruti Suzuki Swift ZXi',
    '₹ 7,20,000',
    '/mock_cars/maruti_swift_black.jpg',
    'Ananya Ramesh',
    '94432 18902',
    'Today, 5:30 PM',
    'hub',
    'Nova Motors Hub, Avinashi Rd, Tiruppur',
    'Confirmed',
    '2 hours ago',
    1795088843400
  ),
  (
'TD-8710',
    'NM-8710',
    'vw-vento-2021',
    '2021 Volkswagen Vento Highline',
    '₹ 9,80,000',
    '/mock_cars/vw_vento_white.jpg',
    'Vijay Kumar',
    '97890 23411',
    'Yesterday, 11:00 AM',
    'home',
    'Race Course, Coimbatore',
    'Completed',
    '1 day ago',
    1795009643400
  ),
  (
'TD-8622',
    'NM-8622',
    'tata-tiago-2022',
    '2022 Tata Tiago XZ Plus',
    '₹ 5,90,000',
    '/mock_cars/tata_tiago_silver.jpg',
    'Divya Prakash',
    '98433 90812',
    'Yesterday, 3:00 PM',
    'hub',
    'Nova Motors Hub, Tiruppur',
    'Completed',
    '1 day ago',
    1795002443400
  )
ON CONFLICT (id) DO NOTHING;

-- 7.4 SEED SELL CAR REQUESTS
INSERT INTO public.sell_requests (
  id, reg_number, car_title, brand, model, year, km, fuel, transmission,
  estimated_range, customer_name, phone, city, inspection_scheduled, status,
  photo_count, submitted_at, timestamp
)
VALUES
  (
'SR-4102',
    'TN-38-BZ-1920',
    '2021 Hyundai Creta SX(O)',
    'Hyundai',
    'Creta',
    '2021',
    '38,000 km',
    'Diesel',
    'Automatic',
    '₹ 12,80,000 - ₹ 13,60,000',
    'Rajesh Murugan',
    '98411 77652',
    'Coimbatore',
    '18 Nov 2026, 11:00 AM',
    'Inspection Scheduled',
    4,
    '35 mins ago',
    1795093943400
  ),
  (
'SR-3980',
    'TN-39-CV-8821',
    '2020 Maruti Suzuki Dzire VXi',
    'Maruti Suzuki',
    'Dzire',
    '2020',
    '44,000 km',
    'Petrol',
    'Manual',
    '₹ 6,10,000 - ₹ 6,60,000',
    'Senthil Nathan',
    '94421 88390',
    'Tiruppur',
    'Pending',
    'Under Review',
    2,
    '3 hours ago',
    1795085243400
  ),
  (
'SR-3744',
    'TN-37-AK-4401',
    '2022 Kia Seltos GTX Plus',
    'Kia',
    'Seltos',
    '2022',
    '26,000 km',
    'Petrol',
    'DCT',
    '₹ 15,20,000 - ₹ 16,00,000',
    'Mohan Prasath',
    '99430 11200',
    'Erode',
    'Completed (Passed Grade A)',
    'Offer Accepted',
    6,
    '1 day ago',
    1794995243400
  )
ON CONFLICT (id) DO NOTHING;

-- 7.5 SEED CUSTOMER LEADS
INSERT INTO public.leads (
  id, type, car_title, customer_name, phone, date, status, timestamp
)
VALUES
  (
'LD-101',
    'WhatsApp Inquiry',
    '2023 Honda City ZX CVT',
    'Praveen Chandran',
    '98432 09876',
    '10 mins ago',
    'Contacted',
    1795096043402
  ),
  (
'LD-102',
    'Phone Call Request',
    '2021 Volkswagen Vento',
    'Meenakshi Sundaram',
    '94433 87654',
    '1 hour ago',
    'Pending Callback',
    1795096043402
  ),
  (
'LD-103',
    'EMI Finance Consultation',
    '2022 Maruti Baleno Alpha',
    'Gokul Kannan',
    '97881 23456',
    '4 hours ago',
    'Application in Review',
    1795096043402
  )
ON CONFLICT (id) DO NOTHING;

-- 7.6 SEED DEALERSHIP ACTIVITIES
INSERT INTO public.activities (id, icon, title, subtitle, color)
VALUES
  ('act-1', 'bi-calendar-check', 'Test drive booked', '2023 Honda City ZX CVT · Doorstep at Kangeyam Rd · 25m ago', 'primary'),
  ('act-2', 'bi-car-front', 'New vehicle trade-in enquiry', '2021 Hyundai Creta (TN-38-BZ-1920) · Coimbatore · 35m ago', 'success'),
  ('act-3', 'bi-patch-check', 'Inspection Grade A+ Issued', '2022 Maruti Suzuki Swift (200-pt certified) · 2h ago', 'info'),
  ('act-4', 'bi-currency-rupee', 'Token Advance Received', '₹ 25,000 token for 2021 VW Vento · Tiruppur Hub · 4h ago', 'warning'),
  ('act-5', 'bi-whatsapp', 'Customer WhatsApp lead', 'Inquiry on Honda Amaze CVT financing options · 5h ago', 'success')
ON CONFLICT (id) DO NOTHING;


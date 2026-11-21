import fs from 'fs'

let carsJs = fs.readFileSync('src/data/cars.js', 'utf8')
carsJs = carsJs
  .replace(/^import hatchbackImg.*/m, 'const hatchbackImg = "/assets/hatchback.png";')
  .replace(/^import sedanImg.*/m, 'const sedanImg = "/assets/sedan.png";')
  .replace(/^import suvImg.*/m, 'const suvImg = "/assets/suv.png";')
  .replace(/^import mpvImg.*/m, 'const mpvImg = "/assets/mpv.png";')
fs.writeFileSync('/tmp/cars_temp.mjs', carsJs)

let storageJs = fs.readFileSync('src/data/carStorage.js', 'utf8')
storageJs = storageJs.replace("import { allCarsData, featuredCarData } from './cars'", 'import { allCarsData, featuredCarData } from "/tmp/cars_temp.mjs"')
fs.writeFileSync('/tmp/storage_temp.mjs', storageJs)

const [carsModule, storageModule] = await Promise.all([
  import('/tmp/cars_temp.mjs'),
  import('/tmp/storage_temp.mjs')
])

const cars = carsModule.allCarsData
const testDrives = storageModule.INITIAL_TEST_DRIVES
const sellRequests = storageModule.INITIAL_SELL_REQUESTS
const leads = storageModule.INITIAL_LEADS
const activities = storageModule.INITIAL_ACTIVITIES

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL'
  return "'" + String(val).replace(/'/g, "''") + "'"
}

function sqlJson(obj) {
  if (obj === null || obj === undefined) return "'[]'::jsonb"
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb"
}

let out = ''
out += `-- ==========================================================================\n`
out += `-- NOVA MOTORS - SUPABASE DATABASE SCHEMA & PRODUCTION MIGRATION\n`
out += `-- Supabase Project URL: https://qkriofsteqxccheavuot.supabase.co\n`
out += `-- Target Database: PostgreSQL 15+ (Supabase)\n`
out += `-- Generated: ${new Date().toISOString()}\n`
out += `-- ==========================================================================\n\n`

out += `-- ==========================================================================\n`
out += `-- 1. EXTENSIONS\n`
out += `-- ==========================================================================\n`
out += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`
out += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`

out += `-- ==========================================================================\n`
out += `-- 2. TABLE DEFINITIONS (DDL)\n`
out += `-- ==========================================================================\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.1 DEALERS (Physical Dealership Showrooms / Hubs)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.dealers (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  name TEXT NOT NULL,\n`
out += `  address TEXT NOT NULL,\n`
out += `  city TEXT NOT NULL,\n`
out += `  phone TEXT NOT NULL,\n`
out += `  whatsapp TEXT,\n`
out += `  hours TEXT,\n`
out += `  rating NUMERIC(3, 1) DEFAULT 4.9,\n`
out += `  reviews_count INTEGER DEFAULT 0,\n`
out += `  badge TEXT,\n`
out += `  image TEXT,\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.2 CARS (Used Car Inventory)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.cars (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  make TEXT NOT NULL,\n`
out += `  model TEXT NOT NULL,\n`
out += `  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2100),\n`
out += `  variant TEXT,\n`
out += `  title TEXT NOT NULL,\n`
out += `  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),\n`
out += `  price_formatted TEXT,\n`
out += `  emi TEXT,\n`
out += `  emi_numeric NUMERIC(10, 2),\n`
out += `  inspected BOOLEAN NOT NULL DEFAULT true,\n`
out += `  inspected_badge TEXT DEFAULT 'Inspected & Verified',\n`
out += `  home_inspected_badge TEXT DEFAULT 'Inspected',\n`
out += `  km TEXT NOT NULL,\n`
out += `  km_numeric INTEGER NOT NULL DEFAULT 0 CHECK (km_numeric >= 0),\n`
out += `  fuel TEXT NOT NULL CHECK (fuel IN ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid')),\n`
out += `  transmission TEXT NOT NULL CHECK (transmission IN ('Manual', 'Automatic', 'CVT', 'DCT', 'AMT', 'iMT')),\n`
out += `  ownership TEXT DEFAULT '1st Owner',\n`
out += `  location TEXT NOT NULL,\n`
out += `  body_type TEXT NOT NULL CHECK (body_type IN ('Sedan', 'Hatchback', 'SUV', 'MPV', 'Coupe', 'Convertible')),\n`
out += `  color TEXT,\n`
out += `  insurance TEXT,\n`
out += `  rto TEXT,\n`
out += `  image TEXT NOT NULL,\n`
out += `  cutout_image TEXT,\n`
out += `  detail_hero_image TEXT,\n`
out += `  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,\n`
out += `  total_photos INTEGER NOT NULL DEFAULT 0,\n`
out += `  about_summary TEXT,\n`
out += `  about_full TEXT,\n`
out += `  key_features JSONB NOT NULL DEFAULT '[]'::jsonb,\n`
out += `  extended_features JSONB NOT NULL DEFAULT '[]'::jsonb,\n`
out += `  condition_history JSONB NOT NULL DEFAULT '[]'::jsonb,\n`
out += `  dealer_id TEXT REFERENCES public.dealers(id) ON DELETE SET NULL,\n`
out += `  dealer JSONB,\n`
out += `  listing_status TEXT NOT NULL DEFAULT 'Available' CHECK (listing_status IN ('Available', 'Reserved', 'Sold')),\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),\n`
out += `  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.3 TEST DRIVE BOOKINGS\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.test_drive_bookings (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  ref TEXT NOT NULL UNIQUE,\n`
out += `  car_id TEXT REFERENCES public.cars(id) ON DELETE SET NULL,\n`
out += `  car_title TEXT NOT NULL,\n`
out += `  car_price TEXT,\n`
out += `  car_image TEXT,\n`
out += `  customer_name TEXT NOT NULL,\n`
out += `  phone TEXT NOT NULL,\n`
out += `  slot TEXT NOT NULL,\n`
out += `  location_type TEXT NOT NULL CHECK (location_type IN ('home', 'hub')),\n`
out += `  address TEXT NOT NULL,\n`
out += `  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),\n`
out += `  booked_at TEXT,\n`
out += `  timestamp BIGINT,\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),\n`
out += `  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.4 SELL CAR REQUESTS (Trade-In / Valuation)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.sell_requests (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  reg_number TEXT NOT NULL,\n`
out += `  car_title TEXT NOT NULL,\n`
out += `  brand TEXT NOT NULL,\n`
out += `  model TEXT NOT NULL,\n`
out += `  year TEXT NOT NULL,\n`
out += `  km TEXT NOT NULL,\n`
out += `  fuel TEXT NOT NULL,\n`
out += `  transmission TEXT NOT NULL,\n`
out += `  estimated_range TEXT NOT NULL,\n`
out += `  customer_name TEXT NOT NULL,\n`
out += `  phone TEXT NOT NULL,\n`
out += `  city TEXT NOT NULL,\n`
out += `  inspection_scheduled TEXT DEFAULT 'Pending',\n`
out += `  status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Inspection Scheduled', 'Offer Accepted', 'Completed', 'Rejected')),\n`
out += `  photo_count INTEGER NOT NULL DEFAULT 0,\n`
out += `  photos JSONB NOT NULL DEFAULT '[]'::jsonb,\n`
out += `  submitted_at TEXT,\n`
out += `  timestamp BIGINT,\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),\n`
out += `  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.5 LEADS (WhatsApp, Callback Requests, Finance)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.leads (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  type TEXT NOT NULL,\n`
out += `  car_title TEXT NOT NULL,\n`
out += `  customer_name TEXT NOT NULL,\n`
out += `  phone TEXT NOT NULL,\n`
out += `  date TEXT,\n`
out += `  status TEXT NOT NULL DEFAULT 'New Lead' CHECK (status IN ('New Lead', 'Contacted', 'Pending Callback', 'Application in Review', 'Closed')),\n`
out += `  timestamp BIGINT,\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),\n`
out += `  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.6 ACTIVITIES (Dealership Audit & Notification Feed)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.activities (\n`
out += `  id TEXT PRIMARY KEY,\n`
out += `  icon TEXT NOT NULL,\n`
out += `  title TEXT NOT NULL,\n`
out += `  subtitle TEXT NOT NULL,\n`
out += `  color TEXT NOT NULL DEFAULT 'primary' CHECK (color IN ('primary', 'success', 'info', 'warning', 'danger')),\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())\n`
out += `);\n\n`

out += `-- --------------------------------------------------------------------------\n`
out += `-- 2.7 SAVED CARS (User Wishlist)\n`
out += `-- --------------------------------------------------------------------------\n`
out += `CREATE TABLE IF NOT EXISTS public.saved_cars (\n`
out += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`
out += `  user_identifier TEXT NOT NULL,\n`
out += `  car_id TEXT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,\n`
out += `  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),\n`
out += `  CONSTRAINT unique_user_car UNIQUE (user_identifier, car_id)\n`
out += `);\n\n`

out += `-- ==========================================================================\n`
out += `-- 3. INDEXES (Foreign Keys, Common Filters, and Searches)\n`
out += `-- ==========================================================================\n\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_dealer_id ON public.cars(dealer_id);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_make_model ON public.cars(make, model);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars(price);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_body_type ON public.cars(body_type);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_fuel ON public.cars(fuel);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_listing_status ON public.cars(listing_status);\n`
out += `CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at DESC);\n\n`

out += `CREATE INDEX IF NOT EXISTS idx_test_drive_car_id ON public.test_drive_bookings(car_id);\n`
out += `CREATE INDEX IF NOT EXISTS idx_test_drive_status ON public.test_drive_bookings(status);\n`
out += `CREATE INDEX IF NOT EXISTS idx_test_drive_phone ON public.test_drive_bookings(phone);\n\n`

out += `CREATE INDEX IF NOT EXISTS idx_sell_requests_status ON public.sell_requests(status);\n`
out += `CREATE INDEX IF NOT EXISTS idx_sell_requests_phone ON public.sell_requests(phone);\n`
out += `CREATE INDEX IF NOT EXISTS idx_sell_requests_reg ON public.sell_requests(reg_number);\n\n`

out += `CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);\n`
out += `CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);\n\n`

out += `CREATE INDEX IF NOT EXISTS idx_saved_cars_user ON public.saved_cars(user_identifier);\n`
out += `CREATE INDEX IF NOT EXISTS idx_saved_cars_car ON public.saved_cars(car_id);\n\n`

out += `-- ==========================================================================\n`
out += `-- 4. AUTOMATIC updated_at TRIGGER FUNCTION\n`
out += `-- ==========================================================================\n\n`
out += `CREATE OR REPLACE FUNCTION public.handle_updated_at()\n`
out += `RETURNS TRIGGER AS $$\n`
out += `BEGIN\n`
out += `  NEW.updated_at = timezone('utc'::text, now());\n`
out += `  RETURN NEW;\n`
out += `END;\n`
out += `$$ LANGUAGE plpgsql;\n\n`

out += `DROP TRIGGER IF EXISTS set_cars_updated_at ON public.cars;\n`
out += `CREATE TRIGGER set_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n\n`

out += `DROP TRIGGER IF EXISTS set_test_drive_updated_at ON public.test_drive_bookings;\n`
out += `CREATE TRIGGER set_test_drive_updated_at BEFORE UPDATE ON public.test_drive_bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n\n`

out += `DROP TRIGGER IF EXISTS set_sell_requests_updated_at ON public.sell_requests;\n`
out += `CREATE TRIGGER set_sell_requests_updated_at BEFORE UPDATE ON public.sell_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n\n`

out += `DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;\n`
out += `CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n\n`

out += `-- ==========================================================================\n`
out += `-- 5. ROW LEVEL SECURITY (RLS) POLICIES\n`
out += `-- ==========================================================================\n\n`

const allTables = ['dealers', 'cars', 'test_drive_bookings', 'sell_requests', 'leads', 'activities', 'saved_cars']
allTables.forEach((t) => {
  out += `ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\n`
})
out += `\n`

allTables.forEach((t) => {
  out += `DROP POLICY IF EXISTS "Allow public select on ${t}" ON public.${t};\n`
  out += `CREATE POLICY "Allow public select on ${t}" ON public.${t} FOR SELECT TO anon, authenticated USING (true);\n\n`
  out += `DROP POLICY IF EXISTS "Allow public insert on ${t}" ON public.${t};\n`
  out += `CREATE POLICY "Allow public insert on ${t}" ON public.${t} FOR INSERT TO anon, authenticated WITH CHECK (true);\n\n`
  out += `DROP POLICY IF EXISTS "Allow public update on ${t}" ON public.${t};\n`
  out += `CREATE POLICY "Allow public update on ${t}" ON public.${t} FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);\n\n`
  out += `DROP POLICY IF EXISTS "Allow public delete on ${t}" ON public.${t};\n`
  out += `CREATE POLICY "Allow public delete on ${t}" ON public.${t} FOR DELETE TO anon, authenticated USING (true);\n\n`
})

out += `-- ==========================================================================\n`
out += `-- 6. GRANTS FOR REST DATA API ACCESS\n`
out += `-- ==========================================================================\n\n`
out += `GRANT USAGE ON SCHEMA public TO anon, authenticated;\n`
out += `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;\n`
out += `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;\n`
out += `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;\n`
out += `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;\n\n`

out += `-- ==========================================================================\n`
out += `-- 7. PRE-POPULATED SEED DATA\n`
out += `-- ==========================================================================\n\n`

out += `-- 7.1 SEED DEALERS\n`
out += `INSERT INTO public.dealers (id, name, address, city, phone, whatsapp, hours, rating, reviews_count, badge, image)\n`
out += `VALUES\n`
out += `  ('nova-coimbatore', 'Nova Motors Coimbatore Hub', 'Avinashi Road, Near Hope College, Peelamedu, Coimbatore - 641004', 'Coimbatore', '+91 94882 12044', '+919488212044', 'Mon - Sun: 9:30 AM - 8:30 PM', 4.9, 382, 'Premier Certified Hub', '/nova/dealer-thumb.jpg'),\n`
out += `  ('nova-tiruppur', 'Nova Motors Tiruppur Hub', 'Kangeyam Road, Near Collectorate, Tiruppur - 641604', 'Tiruppur', '+91 94882 12044', '+919488212044', 'Mon - Sun: 9:30 AM - 8:30 PM', 4.8, 247, 'Certified Inspection Center', '/nova/dealer-thumb.jpg')\n`
out += `ON CONFLICT (id) DO UPDATE SET\n`
out += `  name = EXCLUDED.name,\n`
out += `  address = EXCLUDED.address,\n`
out += `  phone = EXCLUDED.phone;\n\n`

out += `-- 7.2 SEED CARS INVENTORY\n`
out += `INSERT INTO public.cars (\n`
out += `  id, make, model, year, variant, title, price, price_formatted, emi, emi_numeric,\n`
out += `  inspected, inspected_badge, home_inspected_badge, km, km_numeric, fuel, transmission,\n`
out += `  ownership, location, body_type, color, insurance, rto, image, cutout_image,\n`
out += `  detail_hero_image, gallery, total_photos, about_summary, about_full, key_features,\n`
out += `  extended_features, condition_history, dealer_id, dealer, listing_status\n`
out += `)\nVALUES\n`

const carValues = cars.map((c) => {
  return (
    `  (\n` +
    [
      sqlStr(c.id),
      sqlStr(c.make),
      sqlStr(c.model),
      c.year,
      sqlStr(c.variant),
      sqlStr(c.title),
      c.price,
      sqlStr(c.priceFormatted),
      sqlStr(c.emi),
      c.emiNumeric || 0,
      c.inspected ? 'true' : 'false',
      sqlStr(c.inspectedBadge || 'Inspected & Verified'),
      sqlStr(c.homeInspectedBadge || 'Inspected'),
      sqlStr(c.km),
      c.kmNumeric || 0,
      sqlStr(c.fuel),
      sqlStr(c.transmission),
      sqlStr(c.ownership || '1st Owner'),
      sqlStr(c.location),
      sqlStr(c.bodyType),
      sqlStr(c.color || 'Pearl White'),
      sqlStr(c.insurance || 'Valid Comprehensive'),
      sqlStr(c.rto || 'TN-39 (Tiruppur)'),
      sqlStr(c.image),
      sqlStr(c.cutoutImage || c.image),
      sqlStr(c.detailHeroImage || c.image),
      sqlJson(c.gallery || []),
      c.totalPhotos || 10,
      sqlStr(c.aboutSummary || ''),
      sqlStr(c.aboutFull || ''),
      sqlJson(c.keyFeatures || []),
      sqlJson(c.extendedFeatures || []),
      sqlJson(c.conditionHistory || []),
      sqlStr(c.location && c.location.toLowerCase().includes('coimbatore') ? 'nova-coimbatore' : 'nova-tiruppur'),
      sqlJson(c.dealer || null),
      sqlStr(c.listingStatus || 'Available'),
    ].join(',\n    ') +
    `\n  )`
  )
})

out += carValues.join(',\n') + `\n`
out += `ON CONFLICT (id) DO UPDATE SET\n`
out += `  price = EXCLUDED.price,\n`
out += `  listing_status = EXCLUDED.listing_status,\n`
out += `  updated_at = timezone('utc'::text, now());\n\n`

out += `-- 7.3 SEED TEST DRIVE BOOKINGS\n`
out += `INSERT INTO public.test_drive_bookings (\n`
out += `  id, ref, car_id, car_title, car_price, car_image, customer_name, phone, slot,\n`
out += `  location_type, address, status, booked_at, timestamp\n`
out += `)\nVALUES\n`
const tdValues = testDrives.map((td) => {
  return (
    `  (\n` +
    [
      sqlStr(td.id),
      sqlStr(td.ref),
      sqlStr(td.carId),
      sqlStr(td.carTitle),
      sqlStr(td.carPrice),
      sqlStr(td.carImage),
      sqlStr(td.customerName),
      sqlStr(td.phone),
      sqlStr(td.slot),
      sqlStr(td.locationType),
      sqlStr(td.address),
      sqlStr(td.status),
      sqlStr(td.bookedAt),
      td.timestamp || Date.now(),
    ].join(',\n    ') +
    `\n  )`
  )
})
out += tdValues.join(',\n') + `\n`
out += `ON CONFLICT (id) DO NOTHING;\n\n`

out += `-- 7.4 SEED SELL CAR REQUESTS\n`
out += `INSERT INTO public.sell_requests (\n`
out += `  id, reg_number, car_title, brand, model, year, km, fuel, transmission,\n`
out += `  estimated_range, customer_name, phone, city, inspection_scheduled, status,\n`
out += `  photo_count, submitted_at, timestamp\n`
out += `)\nVALUES\n`
const srValues = sellRequests.map((sr) => {
  return (
    `  (\n` +
    [
      sqlStr(sr.id),
      sqlStr(sr.regNumber),
      sqlStr(sr.carTitle),
      sqlStr(sr.brand),
      sqlStr(sr.model),
      sqlStr(sr.year),
      sqlStr(sr.km),
      sqlStr(sr.fuel),
      sqlStr(sr.transmission),
      sqlStr(sr.estimatedRange),
      sqlStr(sr.customerName),
      sqlStr(sr.phone),
      sqlStr(sr.city),
      sqlStr(sr.inspectionScheduled),
      sqlStr(sr.status),
      sr.photoCount || 0,
      sqlStr(sr.submittedAt),
      sr.timestamp || Date.now(),
    ].join(',\n    ') +
    `\n  )`
  )
})
out += srValues.join(',\n') + `\n`
out += `ON CONFLICT (id) DO NOTHING;\n\n`

out += `-- 7.5 SEED CUSTOMER LEADS\n`
out += `INSERT INTO public.leads (\n`
out += `  id, type, car_title, customer_name, phone, date, status, timestamp\n`
out += `)\nVALUES\n`
const ldValues = leads.map((ld) => {
  return (
    `  (\n` +
    [
      sqlStr(ld.id),
      sqlStr(ld.type),
      sqlStr(ld.carTitle),
      sqlStr(ld.customerName),
      sqlStr(ld.phone),
      sqlStr(ld.date),
      sqlStr(ld.status),
      ld.timestamp || Date.now(),
    ].join(',\n    ') +
    `\n  )`
  )
})
out += ldValues.join(',\n') + `\n`
out += `ON CONFLICT (id) DO NOTHING;\n\n`

out += `-- 7.6 SEED DEALERSHIP ACTIVITIES\n`
out += `INSERT INTO public.activities (id, icon, title, subtitle, color)\nVALUES\n`
const actValues = activities.map((act) => {
  return `  (${sqlStr(act.id)}, ${sqlStr(act.icon)}, ${sqlStr(act.title)}, ${sqlStr(act.subtitle)}, ${sqlStr(act.color)})`
})
out += actValues.join(',\n') + `\n`
out += `ON CONFLICT (id) DO NOTHING;\n\n`

fs.mkdirSync('supabase/migrations', { recursive: true })
fs.writeFileSync('supabase/schema.sql', out)
fs.writeFileSync('supabase/migrations/20261119000000_initial_schema.sql', out)
console.log('Successfully generated supabase/schema.sql and migration file!')
console.log('Total characters generated:', out.length)

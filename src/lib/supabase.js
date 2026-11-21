import { createClient } from '@supabase/supabase-js'
import { rebrandValue } from '../config/brand'
import { updateStoredReminder } from '../data/carStorage.js'

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://qkriofsteqxccheavuot.supabase.co'
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcmlvZnN0ZXF4Y2NoZWF2dW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwOTQ3MjAsImV4cCI6MjExMDY3MDcyMH0.7fcsAwqZlWz3XAmeKkdvrIvB-xhrOOOM0szwwrcCH_0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ==========================================
// DATA MAPPING HELPERS (Postgres snake_case <-> App camelCase)
// ==========================================

export function mapCarFromDb(row) {
  if (!row) return null
  const isDraft = Boolean(
    (row.is_draft === true ||
      row.listing_status === 'Draft' ||
      (row.dealer && typeof row.dealer === 'object' && row.dealer.isDraft === true)) &&
    row.listing_status !== 'Available' &&
    row.listing_status !== 'Sold' &&
    row.listing_status !== 'Reserved'
  )

  const effectiveStatus = isDraft ? 'Draft' : (row.listing_status || 'Available')

  return rebrandValue({
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    variant: row.variant,
    title: row.title,
    price: Number(row.price),
    priceFormatted: row.price_formatted,
    emi: row.emi,
    emiNumeric: Number(row.emi_numeric),
    emiAvailable: row.emi_available === undefined || row.emi_available === null ? undefined : row.emi_available === true,
    emiDownPayment: row.emi_down_payment === undefined || row.emi_down_payment === null ? null : Number(row.emi_down_payment),
    emiInterestRate: row.emi_interest_rate === undefined || row.emi_interest_rate === null ? null : Number(row.emi_interest_rate),
    emiTenureMonths: row.emi_tenure_months === undefined || row.emi_tenure_months === null ? null : Number(row.emi_tenure_months),
    emiNote: row.emi_note || '',
    inspected: row.inspected,
    inspectedBadge: row.inspected_badge,
    homeInspectedBadge: row.home_inspected_badge,
    km: row.km,
    kmNumeric: row.km_numeric,
    fuel: row.fuel,
    transmission: row.transmission,
    ownership: row.ownership,
    location: row.location,
    bodyType: row.body_type,
    color: row.color,
    insurance: row.insurance,
    rto: row.rto,
    image: row.image,
    cutoutImage: row.cutout_image,
    detailHeroImage: row.detail_hero_image,
    gallery: row.gallery || [],
    totalPhotos: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery.length : (row.total_photos || 0),
    aboutSummary: row.about_summary,
    aboutFull: row.about_full,
    keyFeatures: row.key_features || [],
    extendedFeatures: row.extended_features || [],
    conditionHistory: row.condition_history || [],
    dealerId: row.dealer_id,
    dealer: row.dealer,
    listingStatus: effectiveStatus,
    isDraft: isDraft,
    showInHero: row.show_in_hero === true,
    soldAt: row.sold_at || row.dealer?.soldAt || null,
    soldPrice: row.sold_price !== null && row.sold_price !== undefined
      ? Number(row.sold_price)
      : (row.dealer?.soldPrice !== undefined && row.dealer?.soldPrice !== null ? Number(row.dealer.soldPrice) : null),
    revenue: row.revenue !== null && row.revenue !== undefined
      ? Number(row.revenue)
      : (row.dealer?.revenue !== undefined && row.dealer?.revenue !== null ? Number(row.dealer.revenue) : null),
    soldTo: row.sold_to || row.dealer?.soldTo || null,
    soldNotes: row.sold_notes || row.dealer?.soldNotes || null,
    lastSavedAt: row.dealer?.lastSavedAt || row.last_saved_at || row.updated_at || row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function cleanPayloadForSupabase(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const clean = { ...payload }
  delete clean.sold_at
  delete clean.sold_price
  delete clean.revenue
  delete clean.sold_to
  delete clean.sold_notes
  return clean
}

export function mapCarToDb(car) {
  const isDraft = Boolean(
    (car.isDraft === true ||
      car.listingStatus === 'Draft' ||
      (car.dealer && typeof car.dealer === 'object' && car.dealer.isDraft === true)) &&
    car.listingStatus !== 'Available' &&
    car.listingStatus !== 'Sold' &&
    car.listingStatus !== 'Reserved'
  )

  const isSold = car.listingStatus === 'Sold'
  const soldAt = car.soldAt || (isSold ? new Date().toISOString() : null)
  const soldPrice = car.soldPrice !== undefined && car.soldPrice !== null
    ? Number(car.soldPrice)
    : (isSold ? Number(car.price || 0) : null)
  const revenue = car.revenue !== undefined && car.revenue !== null
    ? Number(car.revenue)
    : (isSold ? soldPrice : null)
  const soldTo = car.soldTo || null
  const soldNotes = car.soldNotes || null

  const baseDealer = typeof car.dealer === 'object' && car.dealer !== null ? car.dealer : {}
  const dealerObj = {
    ...baseDealer,
    ...(isDraft
      ? {
          isDraft: true,
          draftStatus: 'Draft',
          lastSavedAt: car.lastSavedAt || new Date().toISOString(),
        }
      : {
          isDraft: false,
          draftStatus: 'Published',
        }),
    ...(isSold
      ? {
          soldAt,
          soldPrice,
          revenue,
          soldTo,
          soldNotes,
        }
      : {
          soldAt: null,
          soldPrice: null,
          revenue: null,
          soldTo: null,
          soldNotes: null,
        }),
  }

  return {
    id: car.id,
    make: car.make || 'Draft Make',
    model: car.model || 'Draft Model',
    year: Number(car.year) || 2023,
    variant: car.variant || '',
    title: car.title || `${car.year || 2023} ${car.make || 'Vehicle'} ${car.model || 'Draft'}`,
    price: Number(car.price) || 0,
    price_formatted: car.priceFormatted || '₹ 0',
    emi: car.emiAvailable === false ? 'EMI not available' : (car.emi || 'EMI from ₹ 0/mo'),
    emi_numeric: car.emiAvailable === false ? 0 : (Number(car.emiNumeric) || 0),
    emi_available: car.emiAvailable !== false,
    emi_down_payment: car.emiAvailable === false || car.emiDownPayment === null || car.emiDownPayment === undefined || car.emiDownPayment === ''
      ? null
      : Number(car.emiDownPayment),
    emi_interest_rate: car.emiAvailable === false || car.emiInterestRate === null || car.emiInterestRate === undefined || car.emiInterestRate === ''
      ? null
      : Number(car.emiInterestRate),
    emi_tenure_months: car.emiAvailable === false || car.emiTenureMonths === null || car.emiTenureMonths === undefined || car.emiTenureMonths === ''
      ? null
      : Number(car.emiTenureMonths),
    emi_note: car.emiNote ? String(car.emiNote) : null,
    inspected: car.inspected !== undefined ? car.inspected : true,
    inspected_badge: car.inspectedBadge || 'Inspected & Verified',
    home_inspected_badge: car.homeInspectedBadge || 'Inspected',
    km: car.km || '0 km',
    km_numeric: Number(car.kmNumeric) || 0,
    fuel: car.fuel || 'Petrol',
    transmission: car.transmission || 'Manual',
    ownership: car.ownership || '1st Owner',
    location: car.location || 'Harsha cars Hub, Avinashi Rd, Tiruppur',
    body_type: car.bodyType || 'Sedan',
    color: car.color || 'Pearl White',
    insurance: car.insurance || 'Valid Comprehensive',
    rto: car.rto || 'TN-39 (Tiruppur)',
    image: car.image || '/mock_cars/honda_city_front.jpg',
    cutout_image: car.cutoutImage || car.image || '/mock_cars/honda_city_front.jpg',
    detail_hero_image: car.detailHeroImage || car.image || '/mock_cars/honda_city_front.jpg',
    gallery: car.gallery || [],
    total_photos: Array.isArray(car.gallery) && car.gallery.length > 0 ? car.gallery.length : (car.totalPhotos || 0),
    about_summary: car.aboutSummary || '',
    about_full: car.aboutFull || '',
    key_features: car.keyFeatures || [],
    extended_features: car.extendedFeatures || [],
    condition_history: car.conditionHistory || [],
    dealer_id: car.dealerId || (car.location?.toLowerCase().includes('coimbatore') ? 'nova-coimbatore' : 'nova-tiruppur'),
    dealer: dealerObj,
    listing_status: isDraft ? 'Draft' : (car.listingStatus || 'Available'),
    is_draft: isDraft,
  }
}

export function mapTestDriveFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    ref: row.ref,
    carId: row.car_id,
    carTitle: row.car_title,
    carPrice: row.car_price,
    carImage: row.car_image,
    customerName: row.customer_name,
    phone: row.phone,
    slot: row.slot,
    locationType: row.location_type,
    address: row.address,
    status: row.status,
    bookedAt: row.booked_at,
    timestamp: row.timestamp || new Date(row.created_at).getTime(),
    createdAt: row.created_at,
  }
}

export function mapTestDriveToDb(td) {
  return {
    id: td.id,
    ref: td.ref,
    car_id: td.carId,
    car_title: td.carTitle,
    car_price: td.carPrice,
    car_image: td.carImage,
    customer_name: td.customerName,
    phone: td.phone,
    slot: td.slot,
    location_type: td.locationType || 'home',
    address: td.address,
    status: td.status || 'Pending',
    booked_at: td.bookedAt || 'Just now',
    timestamp: td.timestamp || Date.now(),
  }
}

export function mapSellRequestFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    regNumber: row.reg_number,
    carTitle: row.car_title,
    brand: row.brand,
    model: row.model,
    year: row.year,
    km: row.km,
    fuel: row.fuel,
    transmission: row.transmission,
    estimatedRange: row.estimated_range,
    quoteMessage: row.estimated_range,
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    inspectionScheduled: row.inspection_scheduled,
    status: row.status,
    photoCount: row.photo_count,
    photos: row.photos || [],
    submittedAt: row.submitted_at,
    timestamp: row.timestamp || new Date(row.created_at).getTime(),
    createdAt: row.created_at,
  }
}

export function mapSellRequestToDb(sr) {
  return {
    id: sr.id,
    reg_number: sr.regNumber,
    car_title: sr.carTitle,
    brand: sr.brand,
    model: sr.model,
    year: String(sr.year),
    km: sr.km,
    fuel: sr.fuel,
    transmission: sr.transmission,
    estimated_range: sr.quoteMessage || sr.estimatedRange,
    customer_name: sr.customerName,
    phone: sr.phone,
    city: sr.city,
    inspection_scheduled: sr.inspectionScheduled || 'Pending',
    status: sr.status || 'Under Review',
    photo_count: sr.photoCount || 0,
    photos: sr.photos || [],
    submitted_at: sr.submittedAt || 'Just now',
    timestamp: sr.timestamp || Date.now(),
  }
}

export function mapLeadFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    carTitle: row.car_title,
    customerName: row.customer_name,
    phone: row.phone,
    date: row.date,
    status: row.status,
    timestamp: row.timestamp || new Date(row.created_at).getTime(),
    createdAt: row.created_at,
  }
}

export function mapLeadToDb(ld) {
  if (!ld) return null
  return {
    id: ld.id || `LD-${Math.floor(100 + Math.random() * 900)}`,
    type: ld.type || 'WhatsApp Inquiry',
    car_title: ld.carTitle || 'General Inquiry',
    customer_name: ld.customerName || 'Site Visitor',
    phone: ld.phone || '+91 94882 12044',
    date: ld.date || 'Just now',
    status: ld.status || 'New Lead',
    timestamp: ld.timestamp || Date.now(),
  }
}

export function mapReminderFromDb(row) {
  if (!row) return null
  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    make: row.make,
    model: row.model,
    minYear: row.min_year ? Number(row.min_year) : null,
    maxYear: row.max_year ? Number(row.max_year) : null,
    minPrice: row.min_price ? Number(row.min_price) : null,
    maxPrice: row.max_price ? Number(row.max_price) : null,
    fuelType: row.fuel_type || 'Any',
    transmission: row.transmission || 'Any',
    bodyType: row.body_type || 'Any',
    notes: row.notes || '',
    status: row.status || 'active',
    userId: row.user_id,
    notificationCount: Number(row.notification_count) || 0,
    lastNotifiedAt: row.last_notified_at,
    matchedCarIds: row.matched_car_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapReminderToDb(rem) {
  return {
    id: rem.id,
    customer_name: rem.customerName || rem.name || 'Valued Customer',
    email: rem.email,
    phone: rem.phone || null,
    make: rem.make || 'Any',
    model: rem.model || 'Any',
    min_year: rem.minYear ? Number(rem.minYear) : null,
    max_year: rem.maxYear ? Number(rem.maxYear) : null,
    min_price: rem.minPrice ? Number(rem.minPrice) : null,
    max_price: rem.maxPrice ? Number(rem.maxPrice) : null,
    fuel_type: rem.fuelType || rem.fuel || 'Any',
    transmission: rem.transmission || 'Any',
    body_type: rem.bodyType || 'Any',
    notes: rem.notes || null,
    status: rem.status || 'active',
    user_id: rem.userId || null,
    notification_count: Number(rem.notificationCount) || 0,
    last_notified_at: rem.lastNotifiedAt || null,
  }
}

// ==========================================
// SUPABASE ASYNC API SERVICES
// ==========================================

export async function checkSupabaseHealth() {
  try {
    const { count, error } = await supabase.from('cars').select('id', { count: 'exact', head: true })
    if (error) {
      return {
        ok: false,
        connected: false,
        code: error.code,
        message: error.message || 'Supabase schema not deployed yet',
      }
    }
    return {
      ok: true,
      connected: true,
      carsCount: count ?? 0,
      message: 'Supabase Database Connected & Live',
    }
  } catch (err) {
    return {
      ok: false,
      connected: false,
      message: err.message,
    }
  }
}

export async function fetchCarsFromSupabase() {
  const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapCarFromDb)
}

export const DEFAULT_HERO_CONTENT = {
  eyebrow: 'PRE-OWNED CARS IN TAMIL NADU',
  headline: 'Quality Used Cars.',
  headlineAccent: 'Hassle-Free.',
  description: 'Certified pre-owned cars, transparent pricing, and complete peace of mind for your next drive.',
  cardLabel: 'NEW HIGH-VALUE LAUNCH',
  stat1Value: '2,500+',
  stat1Label: 'Happy Owners',
  stat2Value: '100%',
  stat2Label: 'Verified & Inspected',
  stat3Value: '1-Year',
  stat3Label: 'Engine Warranty',
}

export function mapHeroContentFromDb(row) {
  if (!row) return { ...DEFAULT_HERO_CONTENT }
  return {
    eyebrow: row.eyebrow ?? DEFAULT_HERO_CONTENT.eyebrow,
    headline: row.headline ?? DEFAULT_HERO_CONTENT.headline,
    headlineAccent: row.headline_accent ?? DEFAULT_HERO_CONTENT.headlineAccent,
    description: row.description ?? DEFAULT_HERO_CONTENT.description,
    cardLabel: row.card_label ?? DEFAULT_HERO_CONTENT.cardLabel,
    stat1Value: row.stat_1_value ?? DEFAULT_HERO_CONTENT.stat1Value,
    stat1Label: row.stat_1_label ?? DEFAULT_HERO_CONTENT.stat1Label,
    stat2Value: row.stat_2_value ?? DEFAULT_HERO_CONTENT.stat2Value,
    stat2Label: row.stat_2_label ?? DEFAULT_HERO_CONTENT.stat2Label,
    stat3Value: row.stat_3_value ?? DEFAULT_HERO_CONTENT.stat3Value,
    stat3Label: row.stat_3_label ?? DEFAULT_HERO_CONTENT.stat3Label,
  }
}

export function mapHeroContentToDb(content) {
  return {
    id: 'site',
    eyebrow: content.eyebrow ?? '',
    headline: content.headline ?? '',
    headline_accent: content.headlineAccent ?? '',
    description: content.description ?? '',
    card_label: content.cardLabel ?? '',
    stat_1_value: content.stat1Value ?? '',
    stat_1_label: content.stat1Label ?? '',
    stat_2_value: content.stat2Value ?? '',
    stat_2_label: content.stat2Label ?? '',
    stat_3_value: content.stat3Value ?? '',
    stat_3_label: content.stat3Label ?? '',
    updated_at: new Date().toISOString(),
  }
}

export async function fetchHeroContentFromSupabase() {
  const { data, error } = await supabase.from('hero_content').select('*').eq('id', 'site').maybeSingle()
  if (error) throw error
  return mapHeroContentFromDb(data)
}

export async function saveHeroContentToSupabase(content) {
  const payload = mapHeroContentToDb(content)
  const { data, error } = await supabase.from('hero_content').upsert([payload], { onConflict: 'id' }).select().single()
  if (error) throw error
  return mapHeroContentFromDb(data)
}

export async function fetchCarByIdFromSupabase(id) {
  if (!id) return null
  const { data, error } = await supabase.from('cars').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapCarFromDb(data)
}

export async function addCarToSupabase(car) {
  const payload = cleanPayloadForSupabase(mapCarToDb(car))
  const { data, error } = await supabase.from('cars').upsert([payload], { onConflict: 'id' }).select().single()
  if (error) throw error
  return mapCarFromDb(data)
}

export async function updateCarInSupabase(id, updates) {
  const dbUpdates = {}
  if (updates.price !== undefined) {
    dbUpdates.price = Number(updates.price)
    dbUpdates.price_formatted = updates.priceFormatted
    if (updates.emi) dbUpdates.emi = updates.emi
    if (updates.emiNumeric !== undefined) dbUpdates.emi_numeric = updates.emiNumeric
  }
  if (updates.emi !== undefined) dbUpdates.emi = updates.emi
  if (updates.emiNumeric !== undefined) dbUpdates.emi_numeric = updates.emiNumeric
  if (updates.emiAvailable !== undefined) dbUpdates.emi_available = updates.emiAvailable !== false
  if (updates.emiDownPayment !== undefined) {
    dbUpdates.emi_down_payment = updates.emiDownPayment === null || updates.emiDownPayment === '' ? null : Number(updates.emiDownPayment)
  }
  if (updates.emiInterestRate !== undefined) {
    dbUpdates.emi_interest_rate = updates.emiInterestRate === null || updates.emiInterestRate === '' ? null : Number(updates.emiInterestRate)
  }
  if (updates.emiTenureMonths !== undefined) {
    dbUpdates.emi_tenure_months = updates.emiTenureMonths === null || updates.emiTenureMonths === '' ? null : Number(updates.emiTenureMonths)
  }
  if (updates.emiNote !== undefined) dbUpdates.emi_note = updates.emiNote || null
  if (updates.kmNumeric !== undefined) {
    dbUpdates.km_numeric = Number(updates.kmNumeric)
    dbUpdates.km = updates.km
  }
  if (updates.listingStatus !== undefined) dbUpdates.listing_status = updates.listingStatus
  if (updates.inspected !== undefined) {
    dbUpdates.inspected = updates.inspected
    dbUpdates.inspected_badge = updates.inspected ? 'Inspected & Verified' : 'Standard Check'
    dbUpdates.home_inspected_badge = updates.inspected ? 'Inspected' : 'Standard'
  }
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.make !== undefined) dbUpdates.make = updates.make
  if (updates.model !== undefined) dbUpdates.model = updates.model
  if (updates.year !== undefined) dbUpdates.year = Number(updates.year)
  if (updates.variant !== undefined) dbUpdates.variant = updates.variant
  if (updates.fuel !== undefined) dbUpdates.fuel = updates.fuel
  if (updates.transmission !== undefined) dbUpdates.transmission = updates.transmission
  if (updates.bodyType !== undefined) dbUpdates.body_type = updates.bodyType
  if (updates.image !== undefined) dbUpdates.image = updates.image
  if (updates.location !== undefined) dbUpdates.location = updates.location
  if (updates.color !== undefined) dbUpdates.color = updates.color
  if (updates.keyFeatures !== undefined) dbUpdates.key_features = updates.keyFeatures
  if (updates.extendedFeatures !== undefined) dbUpdates.extended_features = updates.extendedFeatures
  if (updates.gallery !== undefined) dbUpdates.gallery = updates.gallery
  if (updates.isDraft !== undefined) dbUpdates.is_draft = updates.isDraft
  if (updates.lastSavedAt !== undefined) dbUpdates.last_saved_at = updates.lastSavedAt
  if (updates.showInHero !== undefined) dbUpdates.show_in_hero = Boolean(updates.showInHero)

  // Sales revenue & sold metadata stored in dealer JSONB
  const isSold = updates.listingStatus === 'Sold'
  const isReverted = updates.listingStatus && updates.listingStatus !== 'Sold' && updates.listingStatus !== 'Draft'

  let soldAt = updates.soldAt
  let soldPrice = updates.soldPrice !== undefined && updates.soldPrice !== null ? Number(updates.soldPrice) : undefined
  let revenue = updates.revenue !== undefined && updates.revenue !== null ? Number(updates.revenue) : (soldPrice !== undefined ? soldPrice : undefined)
  let soldTo = updates.soldTo
  let soldNotes = updates.soldNotes

  if (isSold) {
    if (!soldAt) soldAt = new Date().toISOString()
    if (soldPrice === undefined && updates.price !== undefined) soldPrice = Number(updates.price)
    if (revenue === undefined) revenue = soldPrice
  }

  // Preserve sales metadata in dealer JSONB so it ALWAYS persists across devices
  let currentDealer = {}
  try {
    const existingCar = await supabase.from('cars').select('dealer').eq('id', id).maybeSingle()
    if (existingCar?.data?.dealer && typeof existingCar.data.dealer === 'object') {
      currentDealer = existingCar.data.dealer
    }
  } catch {
    // Continue
  }

  const dealerSalesUpdate = isSold
    ? { soldAt, soldPrice, revenue, soldTo: soldTo || currentDealer.soldTo || null, soldNotes: soldNotes || currentDealer.soldNotes || null }
    : isReverted
      ? { soldAt: null, soldPrice: null, revenue: null, soldTo: null, soldNotes: null }
      : {}

  dbUpdates.dealer = {
    ...currentDealer,
    ...dealerSalesUpdate,
    ...(updates.dealer && typeof updates.dealer === 'object' ? updates.dealer : {}),
  }

  const safeUpdates = cleanPayloadForSupabase(dbUpdates)
  const { data, error } = await supabase.from('cars').update(safeUpdates).eq('id', id).select().single()
  if (error) throw error
  return mapCarFromDb(data)
}

/**
 * Save / Update a vehicle draft in Supabase
 * Resilient cross-device cloud persistence:
 * Stores complete draft payload in Supabase with dealer.isDraft: true so drafts
 * are safely isolated from public store, immediately synchronized across all devices
 * (desktop, phone, tablet), and fully compliant with database constraints.
 */
export async function saveDraftToSupabase(draftCar) {
  const draftId = draftCar.id || `draft-${Date.now()}`
  const carWithId = {
    ...draftCar,
    id: draftId,
    listingStatus: 'Draft',
    isDraft: true,
    lastSavedAt: new Date().toISOString(),
  }
  const payload = cleanPayloadForSupabase(mapCarToDb(carWithId))

  // 1. First attempt: try saving with listing_status = 'Draft'
  try {
    const draftPayload = { ...payload, listing_status: 'Draft', is_draft: true }
    const { data, error } = await supabase
      .from('cars')
      .upsert([draftPayload], { onConflict: 'id' })
      .select()
      .single()

    if (!error && data) {
      return mapCarFromDb(data)
    }
  } catch {
    // Fall through to resilient fallback
  }

  // 2. Safe Fallback: save with listing_status = 'Reserved' + dealer.isDraft: true
  const safePayload = {
    ...payload,
    listing_status: 'Reserved',
    dealer: {
      ...(typeof payload.dealer === 'object' && payload.dealer !== null ? payload.dealer : {}),
      isDraft: true,
      draftStatus: 'Draft',
      lastSavedAt: new Date().toISOString(),
    },
  }

  const { data, error } = await supabase
    .from('cars')
    .upsert([safePayload], { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return mapCarFromDb(data)
}

/**
 * Fetch all unpublished drafts from Supabase
 */
export async function fetchDraftsFromSupabase() {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .or('is_draft.eq.true,listing_status.eq.Draft')
    .order('created_at', { ascending: false })

  if (error) {
    const fallback = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false })
    if (fallback.error) throw fallback.error
    return (fallback.data || []).map(mapCarFromDb).filter((c) => c && c.isDraft && c.listingStatus !== 'Available')
  }
  return (data || []).map(mapCarFromDb).filter((c) => c && c.isDraft && c.listingStatus !== 'Available')
}

/**
 * Publish an existing draft to live store in Supabase
 */
export async function publishDraftInSupabase(id, overrides = {}) {
  const targetStatus =
    overrides.listingStatus && overrides.listingStatus !== 'Draft'
      ? overrides.listingStatus
      : 'Available'

  const existingRes = await supabase.from('cars').select('*').eq('id', id).maybeSingle()
  const existingCar = existingRes?.data
  const existingDealer = (existingCar?.dealer && typeof existingCar.dealer === 'object') ? existingCar.dealer : {}

  const fullCarObj = {
    ...(existingCar ? mapCarFromDb(existingCar) : {}),
    ...overrides,
    id,
    listingStatus: targetStatus,
    isDraft: false,
    dealer: {
      ...existingDealer,
      ...(overrides.dealer && typeof overrides.dealer === 'object' ? overrides.dealer : {}),
      isDraft: false,
      draftStatus: 'Published',
      publishedAt: new Date().toISOString(),
    },
  }

  const payload = cleanPayloadForSupabase(mapCarToDb(fullCarObj))

  const { data, error } = await supabase
    .from('cars')
    .upsert([payload], { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return mapCarFromDb(data)
}

/**
 * Discard / Delete draft from Supabase
 */
export async function discardDraftFromSupabase(id) {
  return deleteCarFromSupabase(id)
}

export async function deleteCarFromSupabase(id) {
  const { error } = await supabase.from('cars').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function fetchTestDrivesFromSupabase() {
  const { data, error } = await supabase.from('test_drive_bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapTestDriveFromDb)
}

export async function addTestDriveToSupabase(booking) {
  const payload = mapTestDriveToDb(booking)
  const { data, error } = await supabase.from('test_drive_bookings').insert([payload]).select().single()
  if (error) throw error
  return mapTestDriveFromDb(data)
}

export async function updateTestDriveStatusInSupabase(id, status) {
  const { data, error } = await supabase.from('test_drive_bookings').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return mapTestDriveFromDb(data)
}

export async function deleteTestDriveFromSupabase(id) {
  const { error } = await supabase.from('test_drive_bookings').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function fetchSellRequestsFromSupabase() {
  const { data, error } = await supabase.from('sell_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapSellRequestFromDb)
}

export async function addSellRequestToSupabase(request) {
  const payload = mapSellRequestToDb(request)
  const { data, error } = await supabase.from('sell_requests').insert([payload]).select().single()
  if (error) throw error
  return mapSellRequestFromDb(data)
}

export async function updateSellRequestStatusInSupabase(id, status) {
  const { data, error } = await supabase.from('sell_requests').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return mapSellRequestFromDb(data)
}

export async function deleteSellRequestFromSupabase(id) {
  const { error } = await supabase.from('sell_requests').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function fetchLeadsFromSupabase() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapLeadFromDb)
}

export async function addLeadToSupabase(lead) {
  const payload = mapLeadToDb(lead)
  if (!payload?.id) throw new Error('Lead id is required')
  const { data, error } = await supabase.from('leads').insert([payload]).select().single()
  if (error) throw error
  return mapLeadFromDb(data)
}

export async function fetchActivitiesFromSupabase() {
  const { data, error } = await supabase.from('activities').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ==========================================
// SAVED CARS / WISHLIST DATABASE METHODS
// ==========================================

export async function fetchSavedCarsFromSupabase(userIdentifier) {
  if (!userIdentifier) return []
  try {
    const { data, error } = await supabase
      .from('saved_cars')
      .select('car_id')
      .eq('user_identifier', userIdentifier)

    if (error) throw error
    return (data || []).map((row) => row.car_id)
  } catch (err) {
    console.warn('Notice loading saved cars from Supabase:', err.message)
    return []
  }
}

export async function addSavedCarToSupabase(userIdentifier, carId) {
  if (!userIdentifier || !carId) return false
  try {
    const { error } = await supabase.from('saved_cars').upsert(
      [{ user_identifier: userIdentifier, car_id: carId }],
      { onConflict: 'user_identifier,car_id' }
    )
    if (error) throw error
    return true
  } catch (err) {
    console.warn('Notice saving car to wishlist in Supabase:', err.message)
    return false
  }
}

export async function removeSavedCarFromSupabase(userIdentifier, carId) {
  if (!userIdentifier || !carId) return false
  try {
    const { error } = await supabase
      .from('saved_cars')
      .delete()
      .match({ user_identifier: userIdentifier, car_id: carId })

    if (error) throw error
    return true
  } catch (err) {
    console.warn('Notice removing car from wishlist in Supabase:', err.message)
    return false
  }
}

// ==========================================
// 8. CAR REMINDERS & BUYER ALERTS SERVICES
// ==========================================

export async function fetchRemindersFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('car_reminders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapReminderFromDb)
  } catch (err) {
    console.warn('Notice fetching car reminders from Supabase (using local):', err.message)
    return null
  }
}

export async function addReminderToSupabase(reminder) {
  try {
    const payload = mapReminderToDb(reminder)
    const { data, error } = await supabase.from('car_reminders').insert([payload]).select().single()
    if (error) throw error
    return mapReminderFromDb(data)
  } catch (err) {
    console.warn('Notice adding car reminder to Supabase (saved local):', err.message)
    return null
  }
}

export async function updateReminderInSupabase(id, updates) {
  try {
    const dbUpdates = {
      updated_at: new Date().toISOString(),
    }
    if (updates.customerName || updates.customer_name) {
      dbUpdates.customer_name = updates.customerName || updates.customer_name
    }
    if (updates.email) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.make !== undefined) dbUpdates.make = updates.make
    if (updates.model !== undefined) dbUpdates.model = updates.model
    if (updates.minYear !== undefined || updates.min_year !== undefined) {
      dbUpdates.min_year = updates.minYear ?? updates.min_year
    }
    if (updates.maxYear !== undefined || updates.max_year !== undefined) {
      dbUpdates.max_year = updates.maxYear ?? updates.max_year
    }
    if (updates.minPrice !== undefined || updates.min_price !== undefined) {
      dbUpdates.min_price = updates.minPrice ?? updates.min_price
    }
    if (updates.maxPrice !== undefined || updates.max_price !== undefined) {
      dbUpdates.max_price = updates.maxPrice ?? updates.max_price
    }
    if (updates.fuelType || updates.fuel_type) {
      dbUpdates.fuel_type = updates.fuelType || updates.fuel_type
    }
    if (updates.transmission) dbUpdates.transmission = updates.transmission
    if (updates.bodyType || updates.body_type) {
      dbUpdates.body_type = updates.bodyType || updates.body_type
    }
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.status) dbUpdates.status = updates.status
    if (updates.notificationCount !== undefined || updates.notification_count !== undefined) {
      dbUpdates.notification_count = updates.notificationCount ?? updates.notification_count
    }
    if (updates.lastNotifiedAt || updates.last_notified_at) {
      dbUpdates.last_notified_at = updates.lastNotifiedAt || updates.last_notified_at
    }

    const { data, error } = await supabase
      .from('car_reminders')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapReminderFromDb(data)
  } catch (err) {
    console.warn('Notice updating car reminder in Supabase:', err.message)
    return null
  }
}

export async function deleteReminderFromSupabase(id) {
  try {
    const { error } = await supabase.from('car_reminders').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    console.warn('Notice deleting car reminder from Supabase:', err.message)
    return false
  }
}

// ==========================================
// 9. SUPABASE EDGE FUNCTION: send-email
// ==========================================

export async function sendEmailViaSupabase({ to, subject, html }) {
  if (!to || !subject || !html) {
    throw new Error('Email recipient (to), subject, and HTML body are required')
  }

  const endpoint = `${supabaseUrl}/functions/v1/send-email`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ to, subject, html }),
  })

  const raw = await response.text()
  let data = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = null
  }

  if (!response.ok || data?.success === false || data?.error) {
    throw new Error(data?.error || raw || `send-email failed (${response.status})`)
  }

  return { success: true, method: 'send-email', data }
}

export function generateCarAlertEmailHtml({ reminder, car, siteUrl }) {
  const effectiveUrl =
    siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://novapreowned.com')
  const carLink = `${effectiveUrl}/#detail`
  const formattedPrice = Number(car.price || 0).toLocaleString('en-IN')
  const coverImage =
    car.image ||
    (car.gallery && car.gallery[0]?.image) ||
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vehicle Match Alert - ${car.year} ${car.make} ${car.model}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 0; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    
    <!-- Top Brand Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; padding: 5px 12px; border-radius: 9999px; margin-bottom: 10px;">
        Vehicle Alert Match
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Harsha cars Certified Pre-Owned</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">A matching vehicle has just arrived in our inventory!</p>
    </div>

    <!-- Hero Vehicle Image -->
    <div style="position: relative; width: 100%; height: 260px; background-color: #0f172a; text-align: center; overflow: hidden;">
      <img src="${coverImage}" alt="${car.title || car.model}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
    </div>

    <!-- Main Content Area -->
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
        Hi <strong>${reminder.customerName || reminder.name || 'Valued Buyer'}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">
        Great news! We just added a certified vehicle to our showroom that matches the car requirement reminder you saved with us:
      </p>

      <!-- Vehicle Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
          ${car.year} ${car.make} ${car.model} ${car.variant || ''}
        </div>
        <div style="font-size: 24px; font-weight: 900; color: #2563eb; margin-bottom: 14px;">
          ₹ ${formattedPrice}
          <span style="font-size: 12px; font-weight: 500; color: #64748b; margin-left: 8px;">
            ${car.emiAvailable === false ? 'EMI not available' : (car.emi || 'EMI available')}
          </span>
        </div>

        <!-- Specs Grid -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
          <tr>
            <td style="padding: 6px 0;"><strong>⚡ Mileage:</strong> ${car.kmNumeric ? Number(car.kmNumeric).toLocaleString('en-IN') + ' km' : car.km || 'Low km'}</td>
            <td style="padding: 6px 0;"><strong>⛽ Fuel:</strong> ${car.fuel || 'Petrol'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>🕹 Transmission:</strong> ${car.transmission || 'Automatic'}</td>
            <td style="padding: 6px 0;"><strong>📍 Location:</strong> ${car.location || 'Hub Store'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>🛡 Certification:</strong> 200-Point Inspected</td>
            <td style="padding: 6px 0;"><strong>👤 Ownership:</strong> ${car.ownership || 'Single Owner'}</td>
          </tr>
        </table>
      </div>

      <!-- Matched Reminder Preferences -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.5;">
        <strong>Your Saved Requirement:</strong><br/>
        • Make / Model: <strong>${reminder.make || 'Any'} ${reminder.model || ''}</strong><br/>
        • Year Range: <strong>${reminder.minYear || 'Any'} - ${reminder.maxYear || 'Any'}</strong><br/>
        • Budget: <strong>₹ ${Number(reminder.minPrice || 0).toLocaleString('en-IN')} - ₹ ${Number(reminder.maxPrice || 0).toLocaleString('en-IN')}</strong>
        ${reminder.notes ? `<br/>• Note: <em>"${reminder.notes}"</em>` : ''}
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${carLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
          View Vehicle & Book Doorstep Test Drive →
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        Harsha cars certified vehicles sell quickly. Schedule a free home test drive or reserve online before it's taken.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; font-size: 11px; color: #64748b; text-align: center;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">Harsha cars Certified Pre-Owned Dealership</p>
      <p style="margin: 0 0 6px 0;">Concierge Hotline: +91 94882 12044 • Mon - Sun, 9:00 AM - 8:00 PM</p>
      <p style="margin: 0; color: #94a3b8;">You received this email because you set a vehicle alert on our platform. Manage or unsubscribe anytime.</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendMatchingCarEmails({ reminders = [], car, siteUrl }) {
  if (!reminders || reminders.length === 0 || !car) {
    return { sent: 0, failed: 0, results: [] }
  }

  const results = []
  let sent = 0
  let failed = 0

  for (const reminder of reminders) {
    try {
      if (!reminder.email) continue

      const subject = `🎉 Vehicle Match Found: ${car.year} ${car.make} ${car.model} is now available!`
      const html = generateCarAlertEmailHtml({ reminder, car, siteUrl })

      const res = await sendEmailViaSupabase({
        to: reminder.email,
        subject,
        html,
      })
      if (!res?.success) {
        throw new Error(res?.message || 'Email was not accepted by send-email')
      }

      const nowIso = new Date().toISOString()
      const newCount = (Number(reminder.notificationCount) || 0) + 1

      // Update Supabase and localStorage asynchronously
      updateReminderInSupabase(reminder.id, {
        notificationCount: newCount,
        lastNotifiedAt: nowIso,
        status: 'notified',
      }).catch((e) => console.warn('Notice updating reminder in Supabase:', e.message))

      updateStoredReminder(reminder.id, {
        notificationCount: newCount,
        lastNotifiedAt: nowIso,
        status: 'notified',
      })

      results.push({ email: reminder.email, status: 'success', res })
      sent++
    } catch (err) {
      console.error(`Failed sending reminder to ${reminder.email}:`, err)
      results.push({ email: reminder.email, status: 'error', error: err.message })
      failed++
    }
  }

  return { sent, failed, results }
}

// Re-export analytics helpers
export * from './analytics.js'



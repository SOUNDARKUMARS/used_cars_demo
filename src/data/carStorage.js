import { rebrandValue } from '../config/brand'

const CARS_STORAGE_KEY = 'nova_cars_inventory'
const TEST_DRIVES_STORAGE_KEY = 'nova_test_drives'
const SELL_REQUESTS_STORAGE_KEY = 'nova_sell_requests'
const LEADS_STORAGE_KEY = 'nova_leads'
const REMINDERS_STORAGE_KEY = 'nova_car_reminders'

// Known mock IDs that should be purged from storage
const MOCK_CAR_IDS = new Set([
  'honda-city-2023',
  'maruti-swift-2022',
  'vw-vento-2021',
  'hyundai-i10-2022',
  'ford-ecosport-2021',
  'maruti-scross-2021',
  'tata-tiago-2022',
  'renault-triber-2022',
  'skoda-rapid-2021',
  'maruti-baleno-2022',
  'maruti-alto-2020',
  'honda-amaze-2022',
  'renault-kwid-2022',
  'tata-tigor-2021',
])

const MOCK_TEST_DRIVE_IDS = new Set(['TD-9021', 'TD-8942', 'TD-8710', 'TD-8622'])
const MOCK_SELL_REQUEST_IDS = new Set(['SR-4102', 'SR-3980', 'SR-3744'])
const MOCK_LEAD_IDS = new Set(['LD-101', 'LD-102', 'LD-103'])
const MOCK_ACTIVITY_IDS = new Set(['act-1', 'act-2', 'act-3', 'act-4', 'act-5'])

// Default empty arrays for any legacy imports
export const INITIAL_TEST_DRIVES = []
export const INITIAL_SELL_REQUESTS = []
export const INITIAL_LEADS = []
export const INITIAL_ACTIVITIES = []

// Format number to Indian Rupees format (e.g., ₹ 11,50,000)
export function formatINR(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹ 0'
  const val = Math.round(Number(num))
  return '₹ ' + val.toLocaleString('en-IN')
}

// Format number into Lakhs / Crores string for high level dashboard KPI stats
export function formatINRLakhsOrCrore(num) {
  if (!num || isNaN(num)) return '₹ 0'
  const val = Number(num)
  if (val >= 10000000) {
    return `₹ ${(val / 10000000).toFixed(2)} Cr`
  }
  if (val >= 100000) {
    return `₹ ${(val / 100000).toFixed(2)} Lakhs`
  }
  return formatINR(val)
}

// Legacy estimate used only when a listing has no admin-set EMI terms (5 yrs @ 9.5% p.a., 20% upfront).
export function calculateEMI(price) {
  const principal = price * 0.8
  const annualRate = 0.095
  const monthlyRate = annualRate / 12
  const tenureMonths = 60
  const emi = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  )
  return {
    emiNumeric: emi,
    emiFormatted: `EMI from ${formatINR(emi)}/mo`
  }
}

export const EMI_TENURE_OPTIONS = [12, 24, 36, 48, 60, 72, 84]

export function formatTenureLabel(months) {
  const total = Number(months)
  if (!total) return ''
  if (total % 12 === 0) {
    const years = total / 12
    return `${total} months (${years} ${years === 1 ? 'year' : 'years'})`
  }
  return `${total} months`
}

function isBlank(value) {
  return value === '' || value === null || value === undefined
}

function isPlaceholderEmi(emi) {
  if (!emi) return true
  const text = String(emi).trim().toLowerCase()
  return !text || text.includes('not available') || text.includes('not set') || text.includes('₹ 0')
}

export function isEmiTermsComplete(car) {
  return Boolean(
    car &&
    car.emiAvailable !== false &&
    !isBlank(car.emiDownPayment) &&
    !isBlank(car.emiInterestRate) &&
    !isBlank(car.emiTenureMonths)
  )
}

// Monthly installment from the upfront amount, yearly interest, and tenure the admin entered.
export function buildEmiOffer({
  price,
  emiAvailable = true,
  downPayment,
  interestRate,
  tenureMonths,
  note,
} = {}) {
  const priceNum = Math.max(0, Number(price) || 0)
  const cleanNote = (note || '').trim()

  if (emiAvailable === false) {
    return {
      emiAvailable: false,
      emiDownPayment: null,
      emiInterestRate: null,
      emiTenureMonths: null,
      emiNote: cleanNote,
      emiLoanAmount: 0,
      emiNumeric: 0,
      emiTotalPayable: priceNum,
      emi: 'EMI not available',
    }
  }

  const down = Math.min(priceNum, Math.max(0, Number(downPayment) || 0))
  const rate = Number(interestRate) || 0
  const months = Math.max(1, Number(tenureMonths) || 0)
  const loan = Math.max(0, priceNum - down)
  let emiNumeric = 0

  if (loan > 0 && months > 0) {
    if (rate <= 0) {
      emiNumeric = Math.round(loan / months)
    } else {
      const monthlyRate = rate / 12 / 100
      const factor = Math.pow(1 + monthlyRate, months)
      emiNumeric = Math.round((loan * monthlyRate * factor) / (factor - 1))
    }
  }

  return {
    emiAvailable: true,
    emiDownPayment: down,
    emiInterestRate: rate,
    emiTenureMonths: months,
    emiNote: cleanNote,
    emiLoanAmount: loan,
    emiNumeric,
    emiTotalPayable: down + emiNumeric * months,
    emi: `EMI ${formatINR(emiNumeric)}/mo`,
  }
}

function assignEmi(target, offer) {
  target.emiAvailable = offer.emiAvailable
  target.emiDownPayment = offer.emiDownPayment
  target.emiInterestRate = offer.emiInterestRate
  target.emiTenureMonths = offer.emiTenureMonths
  target.emiNote = offer.emiNote || ''
  target.emiLoanAmount = offer.emiLoanAmount
  target.emiNumeric = offer.emiNumeric
  target.emiTotalPayable = offer.emiTotalPayable
  target.emi = offer.emi
  return target
}

// Keeps EMI in step with the listing price without discarding terms the admin already set.
function applyEmiToCar(merged, updates) {
  const priceTouched = updates.price !== undefined
  const emiTouched =
    updates.emiAvailable !== undefined ||
    updates.emiDownPayment !== undefined ||
    updates.emiInterestRate !== undefined ||
    updates.emiTenureMonths !== undefined ||
    updates.emiNote !== undefined ||
    updates.emi !== undefined

  if (!priceTouched && !emiTouched) return merged

  if (merged.emiAvailable === false) {
    return assignEmi(merged, buildEmiOffer({
      price: merged.price,
      emiAvailable: false,
      note: merged.emiNote,
    }))
  }

  if (isEmiTermsComplete(merged)) {
    return assignEmi(merged, buildEmiOffer({
      price: merged.price,
      emiAvailable: true,
      downPayment: merged.emiDownPayment,
      interestRate: merged.emiInterestRate,
      tenureMonths: merged.emiTenureMonths,
      note: merged.emiNote,
    }))
  }

  if (priceTouched && !emiTouched) {
    const legacy = calculateEMI(Number(merged.price) || 0)
    merged.emi = legacy.emiFormatted
    merged.emiNumeric = legacy.emiNumeric
    return merged
  }

  if (emiTouched) {
    merged.emiNote = (merged.emiNote || '').trim()
    if (isPlaceholderEmi(merged.emi)) {
      merged.emi = 'EMI terms not set'
      merged.emiNumeric = 0
    }
  }
  return merged
}

function hasListedEmi(car) {
  return Boolean(car && car.emiAvailable !== false && !isPlaceholderEmi(car.emi))
}

// Turns the add-vehicle form into the EMI fields stored on the car.
// An older listing with no structured terms keeps its current EMI line until the admin fills the new fields.
export function emiPayloadFromForm(formData, existingCar) {
  const note = (formData?.emiNote || '').trim()
  if (!formData?.emiAvailable) {
    return {
      ok: true,
      value: buildEmiOffer({
        price: formData?.price,
        emiAvailable: false,
        note,
      }),
    }
  }

  const downSet = !isBlank(formData.emiDownPayment)
  const rateSet = !isBlank(formData.emiInterestRate)
  const tenureSet = !isBlank(formData.emiTenureMonths)

  if (!downSet && !rateSet && !tenureSet) {
    if (hasListedEmi(existingCar) && !isEmiTermsComplete(existingCar)) {
      return {
        ok: true,
        legacy: true,
        value: {
          emiAvailable: true,
          emiDownPayment: null,
          emiInterestRate: null,
          emiTenureMonths: null,
          emiNote: note || existingCar.emiNote || '',
          emiLoanAmount: null,
          emiNumeric: Number(existingCar.emiNumeric) || 0,
          emiTotalPayable: null,
          emi: existingCar.emi,
        },
      }
    }
  }

  const errors = {}
  const price = Number(formData.price) || 0
  if (!downSet) {
    errors.emiDownPayment = 'Enter the upfront amount the buyer pays'
  } else if (Number(formData.emiDownPayment) < 0) {
    errors.emiDownPayment = 'Upfront amount cannot be negative'
  } else if (price > 0 && Number(formData.emiDownPayment) > price) {
    errors.emiDownPayment = 'Upfront amount cannot be more than the listing price'
  }

  if (!rateSet) {
    errors.emiInterestRate = 'Enter the yearly interest rate'
  } else if (Number(formData.emiInterestRate) < 0 || Number(formData.emiInterestRate) > 100) {
    errors.emiInterestRate = 'Interest rate must be between 0 and 100'
  }

  if (!tenureSet) {
    errors.emiTenureMonths = 'Select the EMI tenure'
  } else if (Number(formData.emiTenureMonths) < 1 || Number(formData.emiTenureMonths) > 120) {
    errors.emiTenureMonths = 'Tenure must be between 1 and 120 months'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: buildEmiOffer({
      price,
      emiAvailable: true,
      downPayment: formData.emiDownPayment,
      interestRate: formData.emiInterestRate,
      tenureMonths: formData.emiTenureMonths,
      note,
    }),
  }
}

export function resolveCarEmi(car) {
  if (!car || car.emiAvailable === false) {
    return {
      available: false,
      legacy: false,
      label: 'EMI not available',
      note: car?.emiNote || '',
    }
  }

  if (!isEmiTermsComplete(car)) {
    return {
      available: true,
      legacy: true,
      label: car.emi || 'EMI available',
      note: car.emiNote || '',
      monthly: Number(car.emiNumeric) || null,
    }
  }

  const offer = buildEmiOffer({
    price: car.price,
    emiAvailable: true,
    downPayment: car.emiDownPayment,
    interestRate: car.emiInterestRate,
    tenureMonths: car.emiTenureMonths,
    note: car.emiNote,
  })

  return {
    available: true,
    legacy: false,
    label: offer.emi,
    note: offer.emiNote,
    monthly: offer.emiNumeric,
    upfront: offer.emiDownPayment,
    rate: offer.emiInterestRate,
    tenureMonths: offer.emiTenureMonths,
    loan: offer.emiLoanAmount,
    totalPayable: offer.emiTotalPayable,
  }
}

export function emiBuyerLabel(car) {
  return resolveCarEmi(car).label
}

// ==========================================
// 1. CARS INVENTORY STORAGE (100% DATABASE DRIVEN)
// ==========================================

export function getStoredCars() {
  try {
    const raw = localStorage.getItem(CARS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Strip any lingering mock cars from storage & sanitize published cars
        let mutated = false
        const clean = parsed
          .filter((c) => c && !MOCK_CAR_IDS.has(c.id))
          .map((c) => {
            // If a car is marked Available/Sold/Reserved, ensure isDraft is false
            if (
              c &&
              (c.listingStatus === 'Available' || c.listingStatus === 'Sold' || c.listingStatus === 'Reserved') &&
              c.isDraft
            ) {
              mutated = true
              return { ...c, isDraft: false }
            }
            return rebrandValue(c)
          })
        if (mutated || clean.length !== parsed.length) {
          saveStoredCars(clean)
        }
        return clean
      }
    }
  } catch (err) {
    console.error('Failed reading cars from localStorage', err)
  }
  return []
}

export function saveStoredCars(cars) {
  try {
    const clean = Array.isArray(cars) ? cars.filter((c) => c && !MOCK_CAR_IDS.has(c.id)) : []
    localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(clean))
    window.dispatchEvent(new CustomEvent('nova_cars_updated', { detail: clean }))
  } catch (err) {
    console.error('Failed saving cars to localStorage', err)
  }
}

export function addCar(carData) {
  const current = getStoredCars()
  const priceNum = Number(carData.price) || 0
  const kmNum = Number(carData.kmNumeric) || 0
  const emiCar = applyEmiToCar(
    {
      price: priceNum,
      emiAvailable: carData.emiAvailable,
      emiDownPayment: carData.emiDownPayment,
      emiInterestRate: carData.emiInterestRate,
      emiTenureMonths: carData.emiTenureMonths,
      emiNote: carData.emiNote,
      emi: carData.emi,
      emiNumeric: carData.emiNumeric,
    },
    {
      price: priceNum,
      ...(carData.emiAvailable !== undefined ? { emiAvailable: carData.emiAvailable } : {}),
      ...(carData.emiDownPayment !== undefined ? { emiDownPayment: carData.emiDownPayment } : {}),
      ...(carData.emiInterestRate !== undefined ? { emiInterestRate: carData.emiInterestRate } : {}),
      ...(carData.emiTenureMonths !== undefined ? { emiTenureMonths: carData.emiTenureMonths } : {}),
      ...(carData.emiNote !== undefined ? { emiNote: carData.emiNote } : {}),
      ...(carData.emi !== undefined ? { emi: carData.emi } : {}),
    }
  )

  const defaultDealer = {
    name: 'Harsha cars Hub',
    address: 'Harsha cars, Tiruppur',
    phone: '+91 94882 12044',
    whatsapp: '+919488212044',
    hours: 'Mon - Sun: 9:30 AM - 8:30 PM',
    rating: 4.9,
    reviewsCount: 380,
    badge: 'Premier Certified Hub',
  }

  const defaultConditionHistory = [
    { id: 'inspected', title: 'Inspected', status: 'Passed 200-pt check', iconUrl: '/icons/quality-check-140.png', iconName: 'ShieldCheck', subtitle: '200+ point check' },
    { id: 'service', title: 'Service History', status: 'Documented', iconUrl: '/icons/service-icon.svg', iconName: 'Wrench', subtitle: 'Available' },
    { id: 'accident', title: 'No Major Accidents', status: 'Clean Structure', iconUrl: '/icons/verified-seller.png', iconName: 'FileText', subtitle: 'Verified' },
    { id: 'rc', title: 'RC Verified', status: 'Original RC Active', iconUrl: '/icons/rc-icon.svg', iconName: 'FileCheck', subtitle: 'Passing Verified' },
  ]

  const newCar = {
    id: carData.id || `car-${Date.now()}`,
    make: carData.make || 'Custom Make',
    model: carData.model || 'Model',
    year: Number(carData.year) || 2023,
    variant: carData.variant || '',
    title: carData.title || `${carData.year || 2023} ${carData.make} ${carData.model}`,
    price: priceNum,
    priceFormatted: formatINR(priceNum),
    emi: emiCar.emi,
    emiNumeric: emiCar.emiNumeric,
    emiAvailable: emiCar.emiAvailable,
    emiDownPayment: emiCar.emiDownPayment ?? null,
    emiInterestRate: emiCar.emiInterestRate ?? null,
    emiTenureMonths: emiCar.emiTenureMonths ?? null,
    emiNote: emiCar.emiNote || '',
    emiLoanAmount: emiCar.emiLoanAmount ?? null,
    emiTotalPayable: emiCar.emiTotalPayable ?? null,
    inspected: carData.inspected !== undefined ? carData.inspected : true,
    inspectedBadge: carData.inspected ? 'Inspected & Verified' : 'Standard Check',
    homeInspectedBadge: carData.inspected ? 'Inspected' : 'Standard',
    km: `${kmNum.toLocaleString('en-IN')} km`,
    kmNumeric: kmNum,
    fuel: carData.fuel || 'Petrol',
    transmission: carData.transmission || 'Manual',
    ownership: carData.ownership || '1st Owner',
    location: carData.location || 'Tiruppur, Tamil Nadu',
    bodyType: carData.bodyType || 'Sedan',
    color: carData.color || 'White',
    insurance: carData.insurance || 'Valid Comprehensive',
    rto: carData.rto || 'TN-39 (Tiruppur)',
    image: carData.image || '',
    cutoutImage: carData.cutoutImage || carData.image || '',
    detailHeroImage: carData.detailHeroImage || carData.image || '',
    gallery: Array.isArray(carData.gallery) ? carData.gallery : [],
    totalPhotos: Array.isArray(carData.gallery) ? carData.gallery.length : 0,
    aboutSummary: carData.aboutSummary || `Certified ${carData.year || 2023} ${carData.make} ${carData.model}.`,
    aboutFull: carData.aboutFull || `Comprehensive 200-point Harsha Certification passed. All critical systems verified.`,
    keyFeatures: Array.isArray(carData.keyFeatures) ? carData.keyFeatures : [],
    conditionHistory: carData.conditionHistory || defaultConditionHistory,
    dealer: carData.dealer || defaultDealer,
    listingStatus: carData.listingStatus || (carData.isDraft ? 'Draft' : 'Available'),
    isDraft: Boolean(
      (carData.isDraft || carData.listingStatus === 'Draft') &&
      carData.listingStatus !== 'Available' &&
      carData.listingStatus !== 'Sold' &&
      carData.listingStatus !== 'Reserved'
    ),
    soldAt: carData.soldAt || (carData.listingStatus === 'Sold' ? new Date().toISOString() : null),
    soldPrice: carData.soldPrice !== undefined && carData.soldPrice !== null ? Number(carData.soldPrice) : (carData.listingStatus === 'Sold' ? priceNum : null),
    revenue: carData.revenue !== undefined && carData.revenue !== null ? Number(carData.revenue) : (carData.listingStatus === 'Sold' ? (Number(carData.soldPrice) || priceNum) : null),
    soldTo: carData.soldTo || null,
    soldNotes: carData.soldNotes || null,
    lastSavedAt: carData.lastSavedAt || new Date().toISOString(),
    createdAt: carData.createdAt || new Date().toISOString()
  }

  const updated = [newCar, ...current.filter((c) => c.id !== newCar.id)]
  saveStoredCars(updated)
  return newCar
}

export function updateCar(id, updates) {
  const current = getStoredCars()
  const updated = current.map((car) => {
    if (car.id === id) {
      const merged = { ...car, ...updates }
      if (updates.listingStatus && updates.listingStatus !== 'Draft') {
        merged.isDraft = false
      }
      if (updates.price !== undefined) {
        merged.price = Number(updates.price)
        merged.priceFormatted = formatINR(merged.price)
      }
      applyEmiToCar(merged, updates)
      if (updates.kmNumeric !== undefined) {
        merged.kmNumeric = Number(updates.kmNumeric)
        merged.km = `${merged.kmNumeric.toLocaleString('en-IN')} km`
      }
      if (updates.inspected !== undefined) {
        merged.inspectedBadge = updates.inspected ? 'Inspected & Verified' : 'Standard Check'
        merged.homeInspectedBadge = updates.inspected ? 'Inspected' : 'Standard'
      }
      if (Array.isArray(updates.gallery)) {
        merged.gallery = updates.gallery
        merged.totalPhotos = updates.gallery.length
      }

      // Sales revenue and sold metadata
      if (updates.listingStatus === 'Sold') {
        merged.isDraft = false
        if (!merged.soldAt) merged.soldAt = updates.soldAt || new Date().toISOString()
        merged.soldPrice = updates.soldPrice !== undefined && updates.soldPrice !== null ? Number(updates.soldPrice) : (merged.soldPrice !== null && merged.soldPrice !== undefined ? merged.soldPrice : merged.price)
        merged.revenue = updates.revenue !== undefined && updates.revenue !== null ? Number(updates.revenue) : (merged.revenue !== null && merged.revenue !== undefined ? merged.revenue : (merged.soldPrice || merged.price))
        merged.soldTo = updates.soldTo !== undefined ? updates.soldTo : (merged.soldTo || 'Direct Customer')
        merged.soldNotes = updates.soldNotes !== undefined ? updates.soldNotes : merged.soldNotes
      } else if (updates.listingStatus && updates.listingStatus !== 'Sold' && updates.listingStatus !== 'Draft') {
        merged.soldAt = null
        merged.soldPrice = null
        merged.revenue = null
        merged.soldTo = null
        merged.soldNotes = null
      } else {
        if (updates.soldAt !== undefined) merged.soldAt = updates.soldAt
        if (updates.soldPrice !== undefined) merged.soldPrice = updates.soldPrice !== null ? Number(updates.soldPrice) : null
        if (updates.revenue !== undefined) merged.revenue = updates.revenue !== null ? Number(updates.revenue) : null
        if (updates.soldTo !== undefined) merged.soldTo = updates.soldTo
        if (updates.soldNotes !== undefined) merged.soldNotes = updates.soldNotes
      }

      return merged
    }
    return car
  })
  saveStoredCars(updated)
  return updated
}

export function deleteCar(id) {
  const current = getStoredCars()
  const updated = current.filter((car) => car.id !== id)
  saveStoredCars(updated)
  return updated
}

// ==========================================
// DRAFTS FOLDER MANAGEMENT
// ==========================================

export function isCarDraft(car) {
  if (!car) return false
  // If explicitly available, sold, or reserved, it is NOT a draft
  if (car.listingStatus === 'Available' || car.listingStatus === 'Sold' || car.listingStatus === 'Reserved') {
    return false
  }
  if (car.isDraft === false && car.listingStatus !== 'Draft') {
    return false
  }
  if (car.listingStatus === 'Draft' || car.isDraft === true) {
    return true
  }
  if (car.dealer && typeof car.dealer === 'object' && car.dealer.isDraft === true) {
    return true
  }
  if (typeof car.id === 'string' && car.id.startsWith('draft-') && !car.listingStatus) {
    return true
  }
  return false
}

export function getStoredDrafts() {
  const current = getStoredCars()
  return current.filter(isCarDraft)
}

export function saveDraftCar(draftData) {
  const current = getStoredCars()
  const draftId = draftData.id || `draft-${Date.now()}`
  const existing = current.find((c) => c.id === draftId)

  const payload = {
    ...draftData,
    id: draftId,
    listingStatus: 'Draft',
    isDraft: true,
    lastSavedAt: new Date().toISOString(),
  }

  if (existing) {
    updateCar(draftId, payload)
    return { ...existing, ...payload }
  } else {
    return addCar(payload)
  }
}

export function publishDraftCar(id, finalUpdates = {}) {
  const current = getStoredCars()
  const existing = current.find((c) => c.id === id)
  const targetStatus =
    finalUpdates.listingStatus && finalUpdates.listingStatus !== 'Draft'
      ? finalUpdates.listingStatus
      : 'Available'

  const payload = {
    ...(existing || {}),
    ...finalUpdates,
    id,
    listingStatus: targetStatus,
    isDraft: false,
    publishedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
  }

  if (payload.dealer && typeof payload.dealer === 'object') {
    payload.dealer = {
      ...payload.dealer,
      isDraft: false,
      draftStatus: 'Published',
      publishedAt: new Date().toISOString(),
    }
  }

  if (existing) {
    updateCar(id, payload)
  } else {
    addCar(payload)
  }
  const updatedCars = getStoredCars()
  return updatedCars.find((c) => c.id === id) || payload
}

export function discardDraftCar(id) {
  return deleteCar(id)
}

export function resetCars() {
  localStorage.removeItem(CARS_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('nova_cars_updated', { detail: [] }))
  return []
}

// ==========================================
// 2. TEST DRIVE BOOKINGS STORAGE
// ==========================================

export function getStoredTestDrives() {
  try {
    const raw = localStorage.getItem(TEST_DRIVES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((td) => td && !MOCK_TEST_DRIVE_IDS.has(td.id))
        return clean
      }
    }
  } catch (err) {
    console.error('Failed reading test drives from localStorage', err)
  }
  return []
}

export function saveStoredTestDrives(testDrives) {
  try {
    const clean = Array.isArray(testDrives) ? testDrives.filter((td) => td && !MOCK_TEST_DRIVE_IDS.has(td.id)) : []
    localStorage.setItem(TEST_DRIVES_STORAGE_KEY, JSON.stringify(clean))
    window.dispatchEvent(new CustomEvent('nova_test_drives_updated', { detail: clean }))
  } catch (err) {
    console.error('Failed saving test drives to localStorage', err)
  }
}

export function addTestDrive(booking) {
  const current = getStoredTestDrives()
  const idNum = Math.floor(1000 + Math.random() * 9000)
  const newBooking = {
    id: `TD-${idNum}`,
    ref: `NM-${idNum}`,
    carId: booking.carId || '',
    carTitle: booking.carTitle || 'Vehicle',
    carPrice: booking.carPrice || '',
    carImage: booking.carImage || '',
    customerName: booking.customerName || 'Customer',
    phone: booking.phone || '',
    slot: booking.slot || 'Today, 4:00 PM',
    locationType: booking.locationType || 'home',
    address: booking.locationType === 'hub' ? 'Harsha cars Hub, Tiruppur' : (booking.address || 'Customer Doorstep Address'),
    status: booking.status || 'Pending',
    bookedAt: 'Just now',
    timestamp: Date.now(),
  }
  const updated = [newBooking, ...current]
  saveStoredTestDrives(updated)
  return newBooking
}

export function updateTestDriveStatus(id, newStatus) {
  const current = getStoredTestDrives()
  const updated = current.map((td) => (td.id === id ? { ...td, status: newStatus } : td))
  saveStoredTestDrives(updated)
  return updated
}

export function deleteTestDrive(id) {
  const current = getStoredTestDrives()
  const updated = current.filter((td) => td.id !== id)
  saveStoredTestDrives(updated)
  return updated
}

// ==========================================
// 3. SELL CAR REQUESTS STORAGE
// ==========================================

export function getStoredSellRequests() {
  try {
    const raw = localStorage.getItem(SELL_REQUESTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((sr) => sr && !MOCK_SELL_REQUEST_IDS.has(sr.id))
        return clean
      }
    }
  } catch (err) {
    console.error('Failed reading sell requests from localStorage', err)
  }
  return []
}

export function saveStoredSellRequests(requests) {
  try {
    const clean = Array.isArray(requests) ? requests.filter((sr) => sr && !MOCK_SELL_REQUEST_IDS.has(sr.id)) : []
    localStorage.setItem(SELL_REQUESTS_STORAGE_KEY, JSON.stringify(clean))
    window.dispatchEvent(new CustomEvent('nova_sell_requests_updated', { detail: clean }))
  } catch (err) {
    console.error('Failed saving sell requests to localStorage', err)
  }
}

export function buildValuationUpdateMessage(date = new Date()) {
  const hour = date.getHours()
  const duringWorkingHours = hour >= 9 && hour < 19
  if (duringWorkingHours) {
    return 'Your request has been submitted. You will get a valuation update within 10 minutes.'
  }
  return 'Your request has been submitted. It is outside working hours (9 AM to 7 PM), so the valuation may take a few hours.'
}

function normalizeSellPhotos(photos) {
  if (!Array.isArray(photos)) return []
  return photos
    .map((photo) => {
      const url = typeof photo === 'string' ? photo : (photo?.url || photo?.dataUrl || '')
      if (!url || url.startsWith('blob:')) return null
      return {
        url,
        name: photo?.name || '',
        tag: photo?.tag || '',
        slot: photo?.slot || '',
      }
    })
    .filter(Boolean)
}

export function addSellRequest(data) {
  const current = getStoredSellRequests()
  const idNum = Math.floor(1000 + Math.random() * 9000)
  const kmDigits = String(data.km ?? '').replace(/[^\d]/g, '')
  const kmNumber = Number(kmDigits)
  const photos = normalizeSellPhotos(data.photos)
  const quoteMessage = data.quoteMessage || buildValuationUpdateMessage()
  const newRequest = {
    id: `SR-${idNum}`,
    regNumber: data.regNumber ? data.regNumber.toUpperCase() : `TN-39-XX-${idNum}`,
    carTitle: data.carTitle || `${data.year || '2023'} Vehicle (${data.regNumber || 'Pending'})`,
    brand: data.brand || 'Vehicle Make',
    model: data.model || 'Model',
    year: data.year || '2023',
    km: kmDigits && Number.isFinite(kmNumber) ? `${kmNumber.toLocaleString('en-IN')} km` : '0 km',
    fuel: data.fuel || 'Petrol',
    transmission: data.transmission || 'Manual',
    estimatedRange: quoteMessage,
    quoteMessage,
    customerName: data.customerName || 'Car Owner',
    phone: data.phone || '',
    email: data.email || '',
    city: data.city || 'Tiruppur',
    inspectionScheduled: 'Pending Hub Contact',
    status: 'Under Review',
    photoCount: photos.length || data.photoCount || 0,
    photos,
    submittedAt: 'Just now',
    timestamp: Date.now(),
  }
  const updated = [newRequest, ...current]
  saveStoredSellRequests(updated)
  return newRequest
}

export function updateSellRequestStatus(id, newStatus) {
  const current = getStoredSellRequests()
  const updated = current.map((sr) => (sr.id === id ? { ...sr, status: newStatus } : sr))
  saveStoredSellRequests(updated)
  return updated
}

export function deleteSellRequest(id) {
  const current = getStoredSellRequests()
  const updated = current.filter((sr) => sr.id !== id)
  saveStoredSellRequests(updated)
  return updated
}

// ==========================================
// 4. LEADS STORAGE (Calls, WhatsApp)
// ==========================================

export function getStoredLeads() {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((l) => l && !MOCK_LEAD_IDS.has(l.id))
        return clean
      }
    }
  } catch (err) {
    console.error('Failed reading leads from localStorage', err)
  }
  return []
}

export function addLead(leadData) {
  const current = getStoredLeads()
  const newLead = {
    id: `LD-${Math.floor(100 + Math.random() * 900)}`,
    type: leadData.type || 'WhatsApp Inquiry',
    carTitle: leadData.carTitle || 'General Inquiry',
    customerName: leadData.customerName || 'Site Visitor',
    phone: leadData.phone || '+91 94882 12044',
    date: 'Just now',
    status: 'New Lead',
    timestamp: Date.now(),
  }
  const updated = [newLead, ...current]
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('nova_leads_updated', { detail: updated }))
  } catch (err) {
    console.error('Failed saving lead', err)
  }
  return newLead
}

export function saveStoredLeads(leads) {
  const list = Array.isArray(leads) ? leads.filter((l) => l && !MOCK_LEAD_IDS.has(l.id)) : []
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('nova_leads_updated', { detail: list }))
  } catch (err) {
    console.error('Failed saving leads to localStorage', err)
  }
  return list
}

/** Keep remote rows authoritative; retain local-only leads until they sync to Supabase. */
export function mergeLeadsWithRemote(remoteLeads, localLeads = getStoredLeads()) {
  const remote = Array.isArray(remoteLeads) ? remoteLeads.filter(Boolean) : []
  const local = Array.isArray(localLeads) ? localLeads.filter((l) => l && !MOCK_LEAD_IDS.has(l.id)) : []
  const byId = new Map()
  for (const lead of remote) {
    if (lead?.id) byId.set(lead.id, lead)
  }
  for (const lead of local) {
    if (lead?.id && !byId.has(lead.id)) byId.set(lead.id, lead)
  }
  return Array.from(byId.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

// ==========================================
// 5. CAR REMINDERS & BUYER ALERTS STORAGE
// ==========================================

export const INITIAL_REMINDERS = [
  {
    id: 'rem-101',
    customerName: 'Aarav Mehta',
    email: 'aarav.mehta.nova@gmail.com',
    phone: '+91 98201 44521',
    make: 'Hyundai',
    model: 'Creta',
    minYear: 2020,
    maxYear: 2024,
    minPrice: 800000,
    maxPrice: 1700000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    notes: 'Looking for top variant SX(O) with sunroof in white or black.',
    status: 'active',
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rem-102',
    customerName: 'Priya Sundaram',
    email: 'priya.sundaram.nova@gmail.com',
    phone: '+91 98402 33119',
    make: 'Maruti Suzuki',
    model: 'Swift',
    minYear: 2019,
    maxYear: 2024,
    minPrice: 400000,
    maxPrice: 850000,
    fuelType: 'Petrol',
    transmission: 'Any',
    bodyType: 'Hatchback',
    notes: 'Low mileage city commuter car for daily driving.',
    status: 'active',
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'rem-103',
    customerName: 'Rohan Deshmukh',
    email: 'rohan.deshmukh.nova@gmail.com',
    phone: '+91 98110 77622',
    make: 'Toyota',
    model: 'Fortuner',
    minYear: 2018,
    maxYear: 2024,
    minPrice: 1800000,
    maxPrice: 3800000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    notes: '4x4 or 4x2 Automatic in pristine condition with complete service records.',
    status: 'active',
    notificationCount: 0,
    lastNotifiedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

const PLACEHOLDER_REMINDER_IDS = new Set(INITIAL_REMINDERS.map((reminder) => reminder.id))

export function getStoredReminders() {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((reminder) => reminder && !PLACEHOLDER_REMINDER_IDS.has(reminder.id))
      }
    }
  } catch (err) {
    console.error('Failed reading car reminders from localStorage', err)
  }
  return []
}

export function saveStoredReminders(reminders) {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders))
    window.dispatchEvent(new CustomEvent('nova_reminders_updated', { detail: reminders }))
  } catch (err) {
    console.error('Failed writing car reminders to localStorage', err)
  }
}

export function addStoredReminder(reminderData) {
  const current = getStoredReminders()
  const newReminder = {
    id: reminderData.id || `rem-${Date.now()}`,
    customerName: reminderData.customerName || reminderData.name || 'Valued Customer',
    email: reminderData.email || '',
    phone: reminderData.phone || '',
    make: reminderData.make || 'Any',
    model: reminderData.model || 'Any',
    minYear: reminderData.minYear ? Number(reminderData.minYear) : 2015,
    maxYear: reminderData.maxYear ? Number(reminderData.maxYear) : new Date().getFullYear(),
    minPrice: reminderData.minPrice ? Number(reminderData.minPrice) : 0,
    maxPrice: reminderData.maxPrice ? Number(reminderData.maxPrice) : 5000000,
    fuelType: reminderData.fuelType || reminderData.fuel || 'Any',
    transmission: reminderData.transmission || 'Any',
    bodyType: reminderData.bodyType || 'Any',
    notes: reminderData.notes || '',
    status: reminderData.status || 'active',
    userId: reminderData.userId || null,
    notificationCount: Number(reminderData.notificationCount) || 0,
    lastNotifiedAt: reminderData.lastNotifiedAt || null,
    createdAt: reminderData.createdAt || new Date().toISOString(),
  }
  const updated = [newReminder, ...current]
  saveStoredReminders(updated)
  return newReminder
}

export function updateStoredReminder(id, updates) {
  const current = getStoredReminders()
  const updated = current.map((rem) => (rem.id === id ? { ...rem, ...updates } : rem))
  saveStoredReminders(updated)
  return updated
}

export function deleteStoredReminder(id) {
  const current = getStoredReminders()
  const updated = current.filter((rem) => rem.id !== id)
  saveStoredReminders(updated)
  return updated
}

/**
 * Intelligent matching logic: Compares a vehicle against a buyer reminder config.
 * Supports flexible brand aliases, model substrings, budget tolerance, and transmission/fuel filters.
 */
export function checkCarMatchesReminder(car, reminder) {
  if (!car || !reminder) {
    return { isMatch: false, nameMatches: false, matchLevel: 'none', matchScore: 0, reasons: [], mismatches: [] }
  }

  const reasons = []
  const mismatches = []
  let totalCriteria = 0
  let matchedCriteria = 0

  // 1. Make / Brand Check
  const remMake = (reminder.make || '').trim()
  let brandSpecified = false
  let brandMatched = true
  if (remMake && remMake !== 'Any' && remMake.toLowerCase() !== 'all') {
    brandSpecified = true
    totalCriteria++
    const carMake = (car.make || '').toLowerCase()
    const targetMake = remMake.toLowerCase()
    if (carMake.includes(targetMake) || targetMake.includes(carMake)) {
      matchedCriteria++
      reasons.push(`Brand matches "${reminder.make}"`)
    } else {
      brandMatched = false
      mismatches.push(`Requires brand "${reminder.make}" (car is ${car.make || 'unspecified'})`)
    }
  }

  // 2. Model Check
  const remModel = (reminder.model || '').trim()
  let modelSpecified = false
  let modelMatched = true
  if (remModel && remModel !== 'Any' && remModel.toLowerCase() !== 'all') {
    modelSpecified = true
    totalCriteria++
    const carModel = (car.model || '').toLowerCase()
    const carTitle = (car.title || '').toLowerCase()
    const targetModel = remModel.toLowerCase()
    if (carModel.includes(targetModel) || targetModel.includes(carModel) || carTitle.includes(targetModel)) {
      matchedCriteria++
      reasons.push(`Model matches "${reminder.model}"`)
    } else {
      modelMatched = false
      mismatches.push(`Requires model "${reminder.model}" (car is ${car.model || car.title})`)
    }
  }

  // 3. Year Range Check
  const carYear = Number(car.year)
  const minYear = reminder.minYear ? Number(reminder.minYear) : null
  const maxYear = reminder.maxYear ? Number(reminder.maxYear) : null
  if (minYear || maxYear) {
    totalCriteria++
    const minPass = !minYear || carYear >= minYear
    const maxPass = !maxYear || carYear <= maxYear
    if (minPass && maxPass) {
      matchedCriteria++
      reasons.push(`Year ${carYear} is within ${minYear || 'any'} - ${maxYear || 'any'}`)
    } else {
      mismatches.push(`Year ${carYear} outside range (${minYear || 'any'} - ${maxYear || 'any'})`)
    }
  }

  // 4. Price / Budget Range Check
  const carPrice = Number(car.price)
  const minPrice = reminder.minPrice ? Number(reminder.minPrice) : null
  const maxPrice = reminder.maxPrice ? Number(reminder.maxPrice) : null
  if ((minPrice && minPrice > 0) || (maxPrice && maxPrice > 0)) {
    totalCriteria++
    // We allow a small 5% graceful leeway on budget boundaries
    const minThreshold = minPrice ? minPrice * 0.95 : 0
    const maxThreshold = maxPrice ? maxPrice * 1.05 : Infinity
    const passesBudget = carPrice >= minThreshold && carPrice <= maxThreshold

    if (passesBudget) {
      matchedCriteria++
      reasons.push(`Budget matched (${formatINR(carPrice)})`)
    } else {
      mismatches.push(`Price ${formatINR(carPrice)} outside budget (${minPrice ? formatINR(minPrice) : '₹0'} - ${maxPrice ? formatINR(maxPrice) : 'Unlimited'})`)
    }
  }

  // 5. Fuel Type Check
  const remFuel = (reminder.fuelType || reminder.fuel || '').trim()
  if (remFuel && remFuel !== 'Any' && remFuel.toLowerCase() !== 'all') {
    totalCriteria++
    const carFuel = (car.fuel || '').toLowerCase()
    if (carFuel === remFuel.toLowerCase()) {
      matchedCriteria++
      reasons.push(`Fuel matches (${car.fuel})`)
    } else {
      mismatches.push(`Prefers ${remFuel} (car is ${car.fuel || 'other'})`)
    }
  }

  // 6. Transmission Check
  const remTrans = (reminder.transmission || '').trim()
  if (remTrans && remTrans !== 'Any' && remTrans.toLowerCase() !== 'all') {
    totalCriteria++
    const carTrans = (car.transmission || '').toLowerCase()
    if (carTrans === remTrans.toLowerCase()) {
      matchedCriteria++
      reasons.push(`Transmission matches (${car.transmission})`)
    } else {
      mismatches.push(`Prefers ${remTrans} (car is ${car.transmission || 'other'})`)
    }
  }

  // 7. Body Type Check
  const remBody = (reminder.bodyType || '').trim()
  if (remBody && remBody !== 'Any' && remBody.toLowerCase() !== 'all') {
    totalCriteria++
    const carBody = (car.bodyType || '').toLowerCase()
    if (carBody === remBody.toLowerCase()) {
      matchedCriteria++
      reasons.push(`Body type matches (${car.bodyType})`)
    } else {
      mismatches.push(`Prefers ${remBody} (car is ${car.bodyType || 'other'})`)
    }
  }

  // Compute overall match score (0 - 100)
  const matchScore = totalCriteria > 0 ? Math.round((matchedCriteria / totalCriteria) * 100) : 100

  // Disqualifying hard mismatch check:
  // If brand is explicitly specified and does not match -> false
  // If model is explicitly specified and does not match -> false
  // If price is strictly outside budget -> false
  // If year is strictly outside range -> false
  const brandConflict = mismatches.some((m) => m.startsWith('Requires brand'))
  const modelConflict = mismatches.some((m) => m.startsWith('Requires model'))
  const priceConflict = mismatches.some((m) => m.startsWith('Price '))
  const yearConflict = mismatches.some((m) => m.startsWith('Year '))

  const isMatch = !brandConflict && !modelConflict && !priceConflict && !yearConflict

  // Name match is independent of year, budget, fuel, and transmission.
  // A buyer who asked for this make/model stays visible so an admin can
  // email them even when the other details differ.
  const nameSpecified = brandSpecified || modelSpecified
  const nameMatches = nameSpecified && brandMatched && modelMatched
  // Full means every criterion the buyer set is satisfied.
  // A matching make/model with any other difference stays a name match
  // so the admin can choose it by hand.
  const matchLevel = nameMatches && mismatches.length > 0 ? 'name' : isMatch ? 'full' : 'none'

  return {
    isMatch,
    nameMatches,
    matchLevel,
    matchScore,
    reasons,
    mismatches,
    totalCriteria,
    matchedCriteria,
  }
}

// ==========================================
// 6. SALES REVENUE & VEHICLE ANALYTICS
// ==========================================

const SALES_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SALES_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function formatLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalISODate(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

export function coerceEventDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string') {
    if (/just now/i.test(value.trim())) return new Date()
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return new Date(parsed)
  }
  return null
}

export function recordInSalesRange(record, range) {
  if (!range?.start || !range?.end) return true
  const date = coerceEventDate(
    record?.timestamp ?? record?.soldAt ?? record?.bookedAt ?? record?.submittedAt ?? record?.createdAt ?? record?.date
  )
  if (!date) return false
  return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime()
}

/**
 * Calendar windows for the sales overview.
 * Day-sized presets stay daily. Month-sized presets use calendar months,
 * including the current month, so "last 3 months" is a sales window a desk can scan.
 */
export function getSalesRange(preset, customFrom, customTo, now = new Date()) {
  const end = endOfLocalDay(now)

  if (preset === 'today') {
    return { preset, start: startOfLocalDay(now), end, granularity: 'day', label: 'Today' }
  }
  if (preset === 'week') {
    const start = startOfLocalDay(now)
    const mondayOffset = start.getDay() === 0 ? 6 : start.getDay() - 1
    start.setDate(start.getDate() - mondayOffset)
    return { preset, start, end, granularity: 'day', label: 'This week' }
  }
  if (preset === '3m') {
    return {
      preset,
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      end,
      granularity: 'month',
      label: 'Last 3 months',
    }
  }
  if (preset === '6m') {
    return {
      preset,
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      end,
      granularity: 'month',
      label: 'Last 6 months',
    }
  }
  if (preset === '1y') {
    return {
      preset,
      start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
      end,
      granularity: 'month',
      label: '1 year',
    }
  }
  if (preset === 'custom') {
    const fromDate = startOfLocalDay(parseLocalISODate(customFrom))
    const toDate = endOfLocalDay(parseLocalISODate(customTo))
    const start = fromDate <= toDate ? fromDate : startOfLocalDay(toDate)
    const orderedEnd = fromDate <= toDate ? toDate : endOfLocalDay(fromDate)
    const spanDays = (orderedEnd.getTime() - start.getTime()) / 86400000
    return {
      preset: 'custom',
      start,
      end: orderedEnd,
      granularity: spanDays <= 45 ? 'day' : 'month',
      label: `${formatLocalISODate(start)} – ${formatLocalISODate(orderedEnd)}`,
    }
  }

  return {
    preset: 'month',
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end,
    granularity: 'month',
    label: 'This month',
  }
}

export const HISTORICAL_SALES_BASELINE = [
  { monthKey: '2026-05', monthName: 'May', baselineRevenue: 2850000, baselineUnits: 4, topBody: 'Hatchback', topModel: 'Swift' },
  { monthKey: '2026-06', monthName: 'Jun', baselineRevenue: 4200000, baselineUnits: 6, topBody: 'Sedan', topModel: 'City' },
  { monthKey: '2026-07', monthName: 'Jul', baselineRevenue: 5640000, baselineUnits: 7, topBody: 'SUV', topModel: 'Creta' },
  { monthKey: '2026-08', monthName: 'Aug', baselineRevenue: 4820000, baselineUnits: 6, topBody: 'Sedan', topModel: 'Vento' },
  { monthKey: '2026-09', monthName: 'Sep', baselineRevenue: 7480000, baselineUnits: 9, topBody: 'SUV', topModel: 'Fortuner' },
  { monthKey: '2026-10', monthName: 'Oct', baselineRevenue: 6800000, baselineUnits: 8, topBody: 'SUV', topModel: 'Thar' },
  { monthKey: '2026-11', monthName: 'Nov', baselineRevenue: 9200000, baselineUnits: 10, topBody: 'SUV', topModel: 'Fortuner' },
]

/**
 * Computes monthly sales trend (Revenue in ₹, Cars count, Dealership performance)
 * Aggregates showroom baseline with live database cars marked as 'Sold'
 */
function isSoldCar(car) {
  return Boolean(car && (car.listingStatus === 'Sold' || car.soldAt || (car.revenue && car.revenue > 0 && !car.isDraft)))
}

function saleRevenue(car) {
  return Number(car.revenue || car.soldPrice || car.price || 0)
}

function applySale(bucket, car, revenue) {
  bucket.revenue += revenue
  bucket.unitsSold += 1
  bucket.cars.push(car)
  if (car.model) bucket.topModel = car.model
  if (car.bodyType) bucket.topBody = car.bodyType
}

function summarizeSalesBuckets(buckets, liveSoldCarsCount, rangeLabel) {
  const data = buckets.map((bucket) => {
    const avgPrice = bucket.unitsSold > 0 ? Math.round(bucket.revenue / bucket.unitsSold) : 0
    return {
      ...bucket,
      revenueLakhs: Number((bucket.revenue / 100000).toFixed(2)),
      revenueFormatted: formatINRLakhsOrCrore(bucket.revenue),
      avgPriceFormatted: formatINRLakhsOrCrore(avgPrice),
    }
  })
  const totalRevenue = buckets.reduce((acc, bucket) => acc + bucket.revenue, 0)
  const totalUnitsSold = buckets.reduce((acc, bucket) => acc + bucket.unitsSold, 0)
  const avgDealSize = totalUnitsSold > 0 ? Math.round(totalRevenue / totalUnitsSold) : 0

  return {
    monthly: data,
    totalRevenue,
    totalRevenueFormatted: formatINRLakhsOrCrore(totalRevenue),
    totalUnitsSold,
    avgDealSizeFormatted: formatINRLakhsOrCrore(avgDealSize),
    liveSoldCarsCount,
    rangeLabel: rangeLabel || '',
  }
}

export function getSalesTrendAnalytics(cars = [], range = null) {
  const soldEntries = (Array.isArray(cars) ? cars : []).filter(isSoldCar).map((car) => ({
    car,
    soldDate: coerceEventDate(car.soldAt) || new Date(),
    revenue: saleRevenue(car),
  })).filter((entry) => recordInSalesRange({ timestamp: entry.soldDate }, range))

  if (range?.granularity === 'day') {
    const buckets = []
    const cursor = startOfLocalDay(range.start)
    const last = startOfLocalDay(range.end)
    let guard = 0
    while (cursor <= last && guard < 62) {
      const key = formatLocalISODate(cursor)
      buckets.push({
        key,
        month: range.preset === 'week'
          ? SALES_WEEKDAY_NAMES[cursor.getDay()]
          : `${cursor.getDate()} ${SALES_MONTH_NAMES[cursor.getMonth()]}`,
        revenue: 0,
        unitsSold: 0,
        topBody: '',
        topModel: '',
        cars: [],
      })
      cursor.setDate(cursor.getDate() + 1)
      guard += 1
    }
    soldEntries.forEach((entry) => {
      const bucket = buckets.find((item) => item.key === formatLocalISODate(entry.soldDate))
      if (bucket) applySale(bucket, entry.car, entry.revenue)
    })
    return summarizeSalesBuckets(buckets, soldEntries.length, range.label)
  }

  const monthKeys = new Set()
  if (range?.start && range?.end) {
    const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
    const last = new Date(range.end.getFullYear(), range.end.getMonth(), 1)
    while (cursor <= last) {
      monthKeys.add(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      cursor.setMonth(cursor.getMonth() + 1)
    }
  } else {
    HISTORICAL_SALES_BASELINE.forEach((item) => monthKeys.add(item.monthKey))
  }

  const buckets = [...monthKeys].sort().map((key) => {
    const base = HISTORICAL_SALES_BASELINE.find((item) => item.monthKey === key)
    const monthIndex = Number(key.slice(5, 7)) - 1
    return {
      key,
      month: base?.monthName || SALES_MONTH_NAMES[monthIndex] || key,
      revenue: base?.baselineRevenue || 0,
      unitsSold: base?.baselineUnits || 0,
      topBody: base?.topBody || '',
      topModel: base?.topModel || '',
      cars: [],
    }
  })

  soldEntries.forEach((entry) => {
    const key = `${entry.soldDate.getFullYear()}-${String(entry.soldDate.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.find((item) => item.key === key)
    if (bucket) applySale(bucket, entry.car, entry.revenue)
  })

  const firstWithSales = buckets.findIndex((bucket) => bucket.revenue > 0 || bucket.unitsSold > 0)
  const plotted = firstWithSales === -1
    ? buckets
    : buckets.slice(firstWithSales, buckets.findLastIndex((bucket) => bucket.revenue > 0 || bucket.unitsSold > 0) + 1)

  return summarizeSalesBuckets(plotted, soldEntries.length, range?.label || '')
}

/**
 * Computes vehicle body type mix & revenue share across all cars
 */
export function getBodyTypeSalesAnalytics(cars = [], range = null) {
  const cleanCars = (Array.isArray(cars) ? cars : []).filter((c) => c && !c.isDraft)

  const bodyGroups = {
    SUV: { name: 'SUV', count: 0, soldCount: 0, availableCount: 0, revenue: 0, stockValue: 0 },
    Sedan: { name: 'Sedan', count: 0, soldCount: 0, availableCount: 0, revenue: 0, stockValue: 0 },
    Hatchback: { name: 'Hatchback', count: 0, soldCount: 0, availableCount: 0, revenue: 0, stockValue: 0 },
    MPV: { name: 'MPV', count: 0, soldCount: 0, availableCount: 0, revenue: 0, stockValue: 0 },
    Coupe: { name: 'Coupe / Luxury', count: 0, soldCount: 0, availableCount: 0, revenue: 0, stockValue: 0 },
  }

  cleanCars.forEach((c) => {
    const rawType = (c.bodyType || 'Sedan').trim()
    const normalized =
      rawType.toLowerCase().includes('suv') ? 'SUV' :
      rawType.toLowerCase().includes('sedan') ? 'Sedan' :
      rawType.toLowerCase().includes('hatch') ? 'Hatchback' :
      rawType.toLowerCase().includes('mpv') || rawType.toLowerCase().includes('muv') ? 'MPV' : 'Coupe'

    const target = bodyGroups[normalized] || bodyGroups['SUV']
    const price = Number(c.price || 0)
    const rev = Number(c.revenue || c.soldPrice || (c.listingStatus === 'Sold' ? price : 0))

    if (c.listingStatus === 'Sold') {
      const soldDate = coerceEventDate(c.soldAt) || new Date()
      if (!recordInSalesRange({ timestamp: soldDate }, range)) return
      target.soldCount += 1
      target.revenue += rev
    } else {
      target.availableCount += 1
      target.stockValue += price
    }
    target.count = target.soldCount + target.availableCount
  })

  const countedCars = Object.values(bodyGroups).reduce((sum, item) => sum + item.count, 0) || 1
  const results = Object.values(bodyGroups).filter((item) => item.count > 0).map((item) => {
    const pct = Math.round((item.count / countedCars) * 100)
    const combinedValue = item.stockValue + item.revenue
    return {
      ...item,
      pct,
      combinedValue,
      stockValueFormatted: formatINRLakhsOrCrore(item.stockValue),
      revenueFormatted: formatINRLakhsOrCrore(item.revenue),
      totalValueFormatted: formatINRLakhsOrCrore(combinedValue),
    }
  }).sort((a, b) => b.combinedValue - a.combinedValue)

  return results
}

/**
 * Computes top models ranking, cars count, and revenue generated
 */
export function getModelSalesAnalytics(cars = [], range = null) {
  const cleanCars = (Array.isArray(cars) ? cars : []).filter((c) => c && !c.isDraft)
  const modelMap = new Map()

  cleanCars.forEach((c) => {
    const modelName = c.model ? c.model.trim() : 'Unknown Model'
    const makeName = c.make ? c.make.trim() : 'Brand'
    const key = `${makeName} ${modelName}`

    if (!modelMap.has(key)) {
      modelMap.set(key, {
        fullName: key,
        model: modelName,
        make: makeName,
        bodyType: c.bodyType || 'SUV',
        fuel: c.fuel || 'Petrol',
        totalCars: 0,
        availableCars: 0,
        soldCars: 0,
        totalRevenue: 0,
        inventoryValue: 0,
        image: c.image || '/hero-fortuner.png',
      })
    }

    const entry = modelMap.get(key)
    const price = Number(c.price || 0)
    const rev = Number(c.revenue || c.soldPrice || (c.listingStatus === 'Sold' ? price : 0))

    if (c.listingStatus === 'Sold') {
      const soldDate = coerceEventDate(c.soldAt) || new Date()
      if (!recordInSalesRange({ timestamp: soldDate }, range)) return
      entry.soldCars += 1
      entry.totalRevenue += rev
    } else {
      entry.availableCars += 1
      entry.inventoryValue += price
    }
    entry.totalCars = entry.soldCars + entry.availableCars
  })

  const list = Array.from(modelMap.values()).map((m) => {
    const totalVal = m.inventoryValue + m.totalRevenue
    const avgPrice = m.totalCars > 0 ? Math.round(totalVal / m.totalCars) : 0
    return {
      ...m,
      totalValue: totalVal,
      totalValueFormatted: formatINRLakhsOrCrore(totalVal),
      revenueFormatted: formatINRLakhsOrCrore(m.totalRevenue),
      inventoryFormatted: formatINRLakhsOrCrore(m.inventoryValue),
      avgPriceFormatted: formatINRLakhsOrCrore(avgPrice),
    }
  })

  return list.filter((item) => item.totalCars > 0).sort((a, b) => b.totalValue - a.totalValue)
}

/**
 * Returns the best available exterior / studio thumbnail URL for a vehicle.
 * Prioritizes Studio thumbnails, exterior cover photos, and avoids interior/dashboard images.
 */
export function getVehicleThumbnail(car) {
  if (!car) return '/mock_cars/honda_city_front.jpg'

  // 1. Check if gallery contains a Studio thumbnail or tagged cover
  if (Array.isArray(car.gallery) && car.gallery.length > 0) {
    const studio = car.gallery.find(
      (p) =>
        p &&
        (p.tag?.toLowerCase().includes('studio') ||
         p.name?.toLowerCase().includes('studio') ||
         p.label?.toLowerCase().includes('studio')) &&
        (p.image || p.thumb || p.dataUrl || p.url)
    )
    if (studio) return studio.image || studio.thumb || studio.dataUrl || studio.url

    // 2. An explicit cover marked exterior
    const exteriorCover = car.gallery.find(
      (p) => p && p.isCover && p.category === 'exterior' && (p.image || p.thumb || p.dataUrl || p.url)
    )
    if (exteriorCover) return exteriorCover.image || exteriorCover.thumb || exteriorCover.dataUrl || exteriorCover.url

    // 3. Any exterior photo in gallery
    const exterior = car.gallery.find(
      (p) => p && p.category === 'exterior' && (p.image || p.thumb || p.dataUrl || p.url)
    )
    if (exterior) return exterior.image || exterior.thumb || exterior.dataUrl || exterior.url
  }

  // Helper to test if a string looks like an interior photo URL
  const isInteriorLike = (url) => typeof url === 'string' && /interior|dashboard|seats|cockpit|wheel|engine/i.test(url)

  // 4. car.image if valid and not an obvious interior/dashboard/cockpit photo
  if (car.image && typeof car.image === 'string' && car.image.trim() && !isInteriorLike(car.image)) {
    return car.image
  }

  // 5. Studio cutout image
  const cutout = car.cutoutImage || car.cutout_image
  if (cutout && typeof cutout === 'string' && cutout.trim() && !isInteriorLike(cutout)) {
    return cutout
  }

  // 6. Detail hero image
  const detailHero = car.detailHeroImage || car.detail_hero_image
  if (detailHero && typeof detailHero === 'string' && detailHero.trim() && !isInteriorLike(detailHero)) {
    return detailHero
  }

  // 7. If car.image exists (even if interior-like, when no other exterior is found)
  if (car.image && typeof car.image === 'string' && car.image.trim()) {
    return car.image
  }

  // 8. First item from gallery
  if (Array.isArray(car.gallery) && car.gallery.length > 0) {
    const first = car.gallery[0]
    if (first && (first.image || first.thumb || first.url || first.dataUrl)) {
      return first.image || first.thumb || first.url || first.dataUrl
    }
  }

  return '/mock_cars/honda_city_front.jpg'
}

export function formatCreationDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch (_) {
    return '—'
  }
}

export function formatCreationTime(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (_) {
    return ''
  }
}



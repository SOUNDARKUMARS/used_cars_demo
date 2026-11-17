import { allCarsData, featuredCarData } from './cars'

const CARS_STORAGE_KEY = 'nova_cars_inventory'
const TEST_DRIVES_STORAGE_KEY = 'nova_test_drives'
const SELL_REQUESTS_STORAGE_KEY = 'nova_sell_requests'
const LEADS_STORAGE_KEY = 'nova_leads'

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

// Calculate approximate monthly EMI (for 5 yrs @ 9.5% p.a., 80% loan amount)
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

// Initial seed test drives submitted by users
export const INITIAL_TEST_DRIVES = [
  {
    id: 'TD-9021',
    ref: 'NM-9021',
    carId: 'honda-city-2023',
    carTitle: '2023 Honda City ZX CVT',
    carPrice: '₹ 11,50,000',
    carImage: '/mock_cars/honda_city_front.jpg',
    customerName: 'Karthik Subramanian',
    phone: '98421 54321',
    slot: 'Tomorrow, 4:00 PM',
    locationType: 'home',
    address: '14, Kangeyam Road, Tiruppur',
    status: 'Pending',
    bookedAt: '25 mins ago',
    timestamp: Date.now() - 25 * 60 * 1000,
  },
  {
    id: 'TD-8942',
    ref: 'NM-8942',
    carId: 'maruti-swift-2022',
    carTitle: '2022 Maruti Suzuki Swift ZXi',
    carPrice: '₹ 7,20,000',
    carImage: '/mock_cars/maruti_swift_black.jpg',
    customerName: 'Ananya Ramesh',
    phone: '94432 18902',
    slot: 'Today, 5:30 PM',
    locationType: 'hub',
    address: 'Nova Motors Hub, Avinashi Rd, Tiruppur',
    status: 'Confirmed',
    bookedAt: '2 hours ago',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'TD-8710',
    ref: 'NM-8710',
    carId: 'vw-vento-2021',
    carTitle: '2021 Volkswagen Vento Highline',
    carPrice: '₹ 9,80,000',
    carImage: '/mock_cars/vw_vento_white.jpg',
    customerName: 'Vijay Kumar',
    phone: '97890 23411',
    slot: 'Yesterday, 11:00 AM',
    locationType: 'home',
    address: 'Race Course, Coimbatore',
    status: 'Completed',
    bookedAt: '1 day ago',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: 'TD-8622',
    ref: 'NM-8622',
    carId: 'tata-tiago-2022',
    carTitle: '2022 Tata Tiago XZ Plus',
    carPrice: '₹ 5,90,000',
    carImage: '/mock_cars/tata_tiago_silver.jpg',
    customerName: 'Divya Prakash',
    phone: '98433 90812',
    slot: 'Yesterday, 3:00 PM',
    locationType: 'hub',
    address: 'Nova Motors Hub, Tiruppur',
    status: 'Completed',
    bookedAt: '1 day ago',
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
  }
]

// Initial seed customer sell car evaluations
export const INITIAL_SELL_REQUESTS = [
  {
    id: 'SR-4102',
    regNumber: 'TN-38-BZ-1920',
    carTitle: '2021 Hyundai Creta SX(O)',
    brand: 'Hyundai',
    model: 'Creta',
    year: '2021',
    km: '38,000 km',
    fuel: 'Diesel',
    transmission: 'Automatic',
    estimatedRange: '₹ 12,80,000 - ₹ 13,60,000',
    customerName: 'Rajesh Murugan',
    phone: '98411 77652',
    city: 'Coimbatore',
    inspectionScheduled: '18 Nov 2026, 11:00 AM',
    status: 'Inspection Scheduled',
    photoCount: 4,
    submittedAt: '35 mins ago',
    timestamp: Date.now() - 35 * 60 * 1000,
  },
  {
    id: 'SR-3980',
    regNumber: 'TN-39-CV-8821',
    carTitle: '2020 Maruti Suzuki Dzire VXi',
    brand: 'Maruti Suzuki',
    model: 'Dzire',
    year: '2020',
    km: '44,000 km',
    fuel: 'Petrol',
    transmission: 'Manual',
    estimatedRange: '₹ 6,10,000 - ₹ 6,60,000',
    customerName: 'Senthil Nathan',
    phone: '94421 88390',
    city: 'Tiruppur',
    inspectionScheduled: 'Pending',
    status: 'Under Review',
    photoCount: 2,
    submittedAt: '3 hours ago',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 'SR-3744',
    regNumber: 'TN-37-AK-4401',
    carTitle: '2022 Kia Seltos GTX Plus',
    brand: 'Kia',
    model: 'Seltos',
    year: '2022',
    km: '26,000 km',
    fuel: 'Petrol',
    transmission: 'DCT',
    estimatedRange: '₹ 15,20,000 - ₹ 16,00,000',
    customerName: 'Mohan Prasath',
    phone: '99430 11200',
    city: 'Erode',
    inspectionScheduled: 'Completed (Passed Grade A)',
    status: 'Offer Accepted',
    photoCount: 6,
    submittedAt: '1 day ago',
    timestamp: Date.now() - 28 * 60 * 60 * 1000,
  }
]

// Initial seed customer leads (WhatsApp / Call / Finance)
export const INITIAL_LEADS = [
  {
    id: 'LD-101',
    type: 'WhatsApp Inquiry',
    carTitle: '2023 Honda City ZX CVT',
    customerName: 'Praveen Chandran',
    phone: '98432 09876',
    date: '10 mins ago',
    status: 'Contacted',
  },
  {
    id: 'LD-102',
    type: 'Phone Call Request',
    carTitle: '2021 Volkswagen Vento',
    customerName: 'Meenakshi Sundaram',
    phone: '94433 87654',
    date: '1 hour ago',
    status: 'Pending Callback',
  },
  {
    id: 'LD-103',
    type: 'EMI Finance Consultation',
    carTitle: '2022 Maruti Baleno Alpha',
    customerName: 'Gokul Kannan',
    phone: '97881 23456',
    date: '4 hours ago',
    status: 'Application in Review',
  }
]

// Initial seed activity feed for car dealership
export const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    icon: 'bi-calendar-check',
    title: 'Test drive booked',
    subtitle: '2023 Honda City ZX CVT · Doorstep at Kangeyam Rd · 25m ago',
    color: 'primary'
  },
  {
    id: 'act-2',
    icon: 'bi-car-front',
    title: 'New vehicle trade-in enquiry',
    subtitle: '2021 Hyundai Creta (TN-38-BZ-1920) · Coimbatore · 35m ago',
    color: 'success'
  },
  {
    id: 'act-3',
    icon: 'bi-patch-check',
    title: 'Inspection Grade A+ Issued',
    subtitle: '2022 Maruti Suzuki Swift (200-pt certified) · 2h ago',
    color: 'info'
  },
  {
    id: 'act-4',
    icon: 'bi-currency-rupee',
    title: 'Token Advance Received',
    subtitle: '₹ 25,000 token for 2021 VW Vento · Tiruppur Hub · 4h ago',
    color: 'warning'
  },
  {
    id: 'act-5',
    icon: 'bi-whatsapp',
    title: 'Customer WhatsApp lead',
    subtitle: 'Inquiry on Honda Amaze CVT financing options · 5h ago',
    color: 'success'
  }
]

// ==========================================
// 1. CARS INVENTORY STORAGE
// ==========================================

export function getStoredCars() {
  try {
    const raw = localStorage.getItem(CARS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading cars from localStorage', err)
  }
  // Initialize with allCarsData from cars.js, adding listingStatus if missing
  const initialized = allCarsData.map((c) => ({
    ...c,
    listingStatus: c.listingStatus || 'Available', // 'Available' | 'Reserved' | 'Sold'
  }))
  saveStoredCars(initialized)
  return initialized
}

export function saveStoredCars(cars) {
  try {
    localStorage.setItem(CARS_STORAGE_KEY, JSON.stringify(cars))
    window.dispatchEvent(new CustomEvent('nova_cars_updated', { detail: cars }))
  } catch (err) {
    console.error('Failed saving cars to localStorage', err)
  }
}

export function addCar(carData) {
  const current = getStoredCars()
  const priceNum = Number(carData.price) || 500000
  const kmNum = Number(carData.kmNumeric) || 20000
  const emiInfo = calculateEMI(priceNum)

  const newCar = {
    id: carData.id || `car-${Date.now()}`,
    make: carData.make || 'Custom Make',
    model: carData.model || 'Model',
    year: Number(carData.year) || 2023,
    variant: carData.variant || 'Standard',
    title: carData.title || `${carData.year || 2023} ${carData.make} ${carData.model}`,
    price: priceNum,
    priceFormatted: formatINR(priceNum),
    emi: emiInfo.emiFormatted,
    emiNumeric: emiInfo.emiNumeric,
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
    color: carData.color || 'Pearl White',
    insurance: carData.insurance || 'Valid Comprehensive',
    rto: carData.rto || 'TN-39 (Tiruppur)',
    image: carData.image || '/mock_cars/honda_city_front.jpg',
    cutoutImage: carData.cutoutImage || carData.image || '/mock_cars/honda_city_front.jpg',
    detailHeroImage: carData.detailHeroImage || carData.image || '/mock_cars/honda_city_front.jpg',
    gallery: [
      { id: 1, label: 'Exterior Front', image: carData.image || '/mock_cars/honda_city_front.jpg', thumb: carData.image || '/mock_cars/honda_city_front.jpg' },
      { id: 2, label: 'Cockpit Dashboard', image: '/mock_cars/honda_city_interior_dashboard.jpg', thumb: '/mock_cars/honda_city_interior_dashboard.jpg' },
      { id: 3, label: 'Cabin Interior', image: '/mock_cars/honda_city_leather_seats.jpg', thumb: '/mock_cars/honda_city_leather_seats.jpg' },
    ],
    totalPhotos: 10,
    aboutSummary: carData.aboutSummary || `Certified ${carData.year || 2023} ${carData.make} ${carData.model} in pristine condition. Single owner with complete authorized dealer history.`,
    aboutFull: carData.aboutFull || `Comprehensive 200-point Nova Certification passed. All critical systems verified with zero accidental claims. Available for doorstep test drive.`,
    keyFeatures: featuredCarData.keyFeatures,
    conditionHistory: featuredCarData.conditionHistory,
    dealer: featuredCarData.dealer,
    listingStatus: carData.listingStatus || 'Available',
    createdAt: new Date().toISOString()
  }

  const updated = [newCar, ...current]
  saveStoredCars(updated)
  return newCar
}

export function updateCar(id, updates) {
  const current = getStoredCars()
  const updated = current.map((car) => {
    if (car.id === id) {
      const merged = { ...car, ...updates }
      if (updates.price !== undefined) {
        merged.price = Number(updates.price)
        merged.priceFormatted = formatINR(merged.price)
        const emi = calculateEMI(merged.price)
        merged.emi = emi.emiFormatted
        merged.emiNumeric = emi.emiNumeric
      }
      if (updates.kmNumeric !== undefined) {
        merged.kmNumeric = Number(updates.kmNumeric)
        merged.km = `${merged.kmNumeric.toLocaleString('en-IN')} km`
      }
      if (updates.inspected !== undefined) {
        merged.inspectedBadge = updates.inspected ? 'Inspected & Verified' : 'Standard Check'
        merged.homeInspectedBadge = updates.inspected ? 'Inspected' : 'Standard'
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

export function resetCars() {
  const defaultList = allCarsData.map((c) => ({
    ...c,
    listingStatus: 'Available'
  }))
  saveStoredCars(defaultList)
  return defaultList
}

// ==========================================
// 2. TEST DRIVE BOOKINGS STORAGE
// ==========================================

export function getStoredTestDrives() {
  try {
    const raw = localStorage.getItem(TEST_DRIVES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading test drives from localStorage', err)
  }
  localStorage.setItem(TEST_DRIVES_STORAGE_KEY, JSON.stringify(INITIAL_TEST_DRIVES))
  return INITIAL_TEST_DRIVES
}

export function saveStoredTestDrives(testDrives) {
  try {
    localStorage.setItem(TEST_DRIVES_STORAGE_KEY, JSON.stringify(testDrives))
    window.dispatchEvent(new CustomEvent('nova_test_drives_updated', { detail: testDrives }))
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
    carId: booking.carId || 'featured',
    carTitle: booking.carTitle || 'Featured Vehicle',
    carPrice: booking.carPrice || '₹ 11,50,000',
    carImage: booking.carImage || '/mock_cars/honda_city_front.jpg',
    customerName: booking.customerName || 'Customer',
    phone: booking.phone || '',
    slot: booking.slot || 'Today, 4:00 PM',
    locationType: booking.locationType || 'home',
    address: booking.locationType === 'hub' ? 'Nova Motors Hub, Tiruppur' : (booking.address || 'Customer Doorstep Address'),
    status: booking.status || 'Confirmed',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading sell requests from localStorage', err)
  }
  localStorage.setItem(SELL_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_SELL_REQUESTS))
  return INITIAL_SELL_REQUESTS
}

export function saveStoredSellRequests(requests) {
  try {
    localStorage.setItem(SELL_REQUESTS_STORAGE_KEY, JSON.stringify(requests))
    window.dispatchEvent(new CustomEvent('nova_sell_requests_updated', { detail: requests }))
  } catch (err) {
    console.error('Failed saving sell requests to localStorage', err)
  }
}

export function addSellRequest(data) {
  const current = getStoredSellRequests()
  const idNum = Math.floor(1000 + Math.random() * 9000)
  const newRequest = {
    id: `SR-${idNum}`,
    regNumber: data.regNumber ? data.regNumber.toUpperCase() : `TN-39-XX-${idNum}`,
    carTitle: data.carTitle || `${data.year || '2022'} Vehicle (${data.regNumber || 'Pending'})`,
    brand: data.brand || 'Vehicle Make',
    model: data.model || 'Model',
    year: data.year || '2022',
    km: data.km ? `${Number(data.km).toLocaleString('en-IN')} km` : '30,000 km',
    fuel: data.fuel || 'Petrol',
    transmission: data.transmission || 'Manual',
    estimatedRange: data.estimatedRange || '₹ 8,40,000 - ₹ 9,20,000',
    customerName: data.customerName || 'Car Owner',
    phone: data.phone || '98765 43210',
    city: data.city || 'Tiruppur',
    inspectionScheduled: 'Pending Hub Contact',
    status: 'Under Review',
    photoCount: data.photoCount || 0,
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading leads from localStorage', err)
  }
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS))
  return INITIAL_LEADS
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


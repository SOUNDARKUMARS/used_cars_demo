import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  getStoredCars,
  addCar,
  updateCar,
  deleteCar,
  resetCars,
  getStoredTestDrives,
  saveStoredTestDrives,
  updateTestDriveStatus,
  deleteTestDrive,
  addTestDrive,
  getStoredSellRequests,
  saveStoredSellRequests,
  updateSellRequestStatus,
  deleteSellRequest,
  getStoredLeads,
  saveStoredLeads,
  mergeLeadsWithRemote,
  saveStoredCars,
  formatINR,
  formatINRLakhsOrCrore,
  publishDraftCar,
  discardDraftCar,
  getStoredDrafts,
  isCarDraft,
  getStoredReminders,
  getSalesTrendAnalytics,
  getBodyTypeSalesAnalytics,
  getModelSalesAnalytics,
  getSalesRange,
  recordInSalesRange,
  formatLocalISODate,
} from '../data/carStorage'
import HeroPageEditor from './HeroPageEditor'
import {
  checkSupabaseHealth,
  fetchCarsFromSupabase,
  fetchCarByIdFromSupabase,
  addCarToSupabase,
  updateCarInSupabase,
  deleteCarFromSupabase,
  publishDraftInSupabase,
  discardDraftFromSupabase,
  fetchTestDrivesFromSupabase,
  addTestDriveToSupabase,
  updateTestDriveStatusInSupabase,
  deleteTestDriveFromSupabase,
  fetchSellRequestsFromSupabase,
  addSellRequestToSupabase,
  updateSellRequestStatusInSupabase,
  deleteSellRequestFromSupabase,
  fetchLeadsFromSupabase,
  addLeadToSupabase,
  fetchActivitiesFromSupabase,
  supabase,
  mapSellRequestFromDb,
} from '../lib/supabase'

function playSellRequestChime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  const ctx = playSellRequestChime.ctx || new AudioCtx()
  playSellRequestChime.ctx = ctx
  const start = () => {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(740, now)
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.16)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.52)
  }
  if (ctx.state === 'suspended') {
    ctx.resume().then(start).catch(() => {})
  } else {
    start()
  }
}
import {
  fetchAnalyticsEvents,
  getAnalyticsSummary,
  trackSearch,
  trackFilter,
  trackWishlist,
} from '../lib/analytics'
import FeaturesSelector from './FeaturesSelector'
import AddVehicleScreen from './AddVehicleScreen'
import AdminRemindersView from './AdminRemindersView'
import CustomSelect from './CustomSelect'
import RecordSaleModal from './RecordSaleModal'
import SalesRevenueChart from './SalesRevenueChart'
import ModelsPerformanceCard from './ModelsPerformanceCard'
import BodyTypeMixCard from './BodyTypeMixCard'
import SalesRangeBar from './SalesRangeBar'
import BrandLogo from './BrandLogo'
import { BRAND_NAME } from '../config/brand'
import {
  renderFeatureIcon,
  BODY_TYPE_DEFAULT_FEATURES,
  getFeaturesByIds,
} from '../data/featuresBank'

const LISTING_STATUS_OPTIONS = [
  {
    value: 'Available',
    label: 'Available',
    dotColor: '#198754',
    badgeText: 'Live',
    badgeClass: 'bg-success-subtle text-success border-success-subtle',
  },
  {
    value: 'Reserved',
    label: 'Reserved',
    dotColor: '#ffc107',
    badgeText: 'Hold',
    badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
  },
  {
    value: 'Sold',
    label: 'Sold',
    dotColor: '#6c757d',
    badgeText: 'Sold',
    badgeClass: 'bg-secondary-subtle text-secondary border-secondary-subtle',
  },
  {
    value: 'Draft',
    label: 'Draft',
    dotColor: '#fd7e14',
    badgeText: 'Draft',
    badgeClass: 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
  },
]

export default function AdminDashboard({ onLogout, onReturnToStore }) {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('theme') || localStorage.getItem('metis_theme') || 'light'
  })

  // Navigation tab: 'dashboard' | 'inventory' | 'add-car' | 'bookings' | 'sell-requests' | 'leads' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam) return tabParam
    const hash = window.location.hash.replace('#', '')
    if (hash === 'admin-add-car' || hash === 'add-car') return 'add-car'
    return 'dashboard'
  })

  // Hash listener for direct sub-route navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'admin-add-car' || hash === 'add-car') {
        setEditingDraft(null)
        setActiveTab('add-car')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Sidebar responsive state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Top header dropdowns
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResultsOpen, setSearchResultsOpen] = useState(false)

  // Live Dealership State (Synced via localStorage & CustomEvents)
  const [cars, setCars] = useState(getStoredCars)
  const [testDrives, setTestDrives] = useState(getStoredTestDrives)
  const [sellRequests, setSellRequests] = useState(getStoredSellRequests)
  const [sellPhotoPreview, setSellPhotoPreview] = useState(null)
  const [sellPhotoLightbox, setSellPhotoLightbox] = useState(null)
  const [leads, setLeads] = useState(getStoredLeads)
  const [reminders, setReminders] = useState(getStoredReminders)
  const [activities, setActivities] = useState([])

  // Inventory Table filters & state
  const [carSearch, setCarSearch] = useState('')
  const [bodyFilter, setBodyFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCarIds, setSelectedCarIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [inventoryViewMode, setInventoryViewMode] = useState('table')
  const [openStatusDropdownCarId, setOpenStatusDropdownCarId] = useState(null)
  const itemsPerPage = 8

  // Supabase Database Connection & Sync State
  const [dbStatus, setDbStatus] = useState({
    checking: true,
    connected: false,
    message: 'Checking Supabase connection...',
    carsCount: 0,
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)

  // Customer Behavior & Search Analytics State
  const [analyticsSummary, setAnalyticsSummary] = useState(null)
  const [analyticsEvents, setAnalyticsEvents] = useState([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsFilterType, setAnalyticsFilterType] = useState('all')
  const [aiSummaryCopied, setAiSummaryCopied] = useState(false)

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true)
    try {
      const [summary, events] = await Promise.all([
        getAnalyticsSummary(),
        fetchAnalyticsEvents({ limit: 100 }),
      ])
      setAnalyticsSummary(summary)
      setAnalyticsEvents(events || [])
    } catch (err) {
      console.warn('Error loading analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load analytics when switching to analytics tab or on real-time event
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData()
    }
  }, [activeTab])

  useEffect(() => {
    const handleNewEvent = (e) => {
      if (e.detail) {
        setAnalyticsEvents((prev) => [e.detail, ...prev].slice(0, 100))
        if (activeTab === 'analytics') {
          getAnalyticsSummary().then((sum) => setAnalyticsSummary(sum))
        }
      }
    }
    window.addEventListener('nova_analytics_event', handleNewEvent)
    return () => window.removeEventListener('nova_analytics_event', handleNewEvent)
  }, [activeTab])

  const handleCopyAiSummary = () => {
    const summary = analyticsSummary || {}
    const aiPayload = {
      generated_at: new Date().toISOString(),
      dataset_overview: {
        total_events_collected: summary.totalEvents || analyticsEvents.length,
        search_events: summary.totalSearches || 0,
        filter_events: summary.totalFilters || 0,
        sort_events: summary.totalSorts || 0,
        wishlist_events: summary.totalWishlistAdds || 0,
      },
      top_searched_keywords: summary.topQueries || [],
      popular_fuel_preferences: summary.fuelBreakdown || {},
      popular_body_type_demands: summary.bodyBreakdown || {},
      most_wishlisted_vehicles: summary.topWishlisted || [],
      sample_raw_events: analyticsEvents.slice(0, 20),
      ai_analysis_prompt: 'Analyze these consumer car search queries and filter range events. Identify unmet buyer demand, emerging vehicle body/fuel trends, and recommend inventory pricing and procurement adjustments.',
    }
    navigator.clipboard.writeText(JSON.stringify(aiPayload, null, 2))
    setAiSummaryCopied(true)
    setTimeout(() => setAiSummaryCopied(false), 2500)
  }

  const handleGenerateSampleEvents = async () => {
    const sampleSearches = ['Honda City', 'Swift Diesel', 'Creta Automatic', 'SUV under 10 Lakhs', 'Fortuner 4x4', 'Sedan']
    for (const s of sampleSearches) {
      await trackSearch(s, Math.floor(Math.random() * 8) + 1, { screen: 'home', isDemo: true }, 0)
    }
    const sampleFilters = [
      { minBudget: 500000, maxBudget: 1200000, fuel: 'Diesel', transmission: 'automatic', bodyType: 'suv' },
      { minBudget: 200000, maxBudget: 600000, fuel: 'Petrol', transmission: 'manual', bodyType: 'hatchback' },
      { minBudget: 1500000, maxBudget: 3500000, fuel: 'Electric', transmission: 'automatic', bodyType: 'sedan' },
    ]
    for (const f of sampleFilters) {
      await trackFilter(f, Math.floor(Math.random() * 5) + 1, { screen: 'catalogue', isDemo: true })
    }
    if (cars.length > 0) {
      await trackWishlist('add', cars[0], { screen: 'catalogue', isDemo: true })
      if (cars[1]) await trackWishlist('add', cars[1], { screen: 'home', isDemo: true })
    }
    await loadAnalyticsData()
  }

  // Modals state
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false)
  const [editingDraft, setEditingDraft] = useState(null)
  const [saleModalCar, setSaleModalCar] = useState(null)

  // Features Bank Modal state
  const [featuresModalOpen, setFeaturesModalOpen] = useState(false)
  const [managingCarFeatures, setManagingCarFeatures] = useState(null)

  // Add Car Form State (Includes top highlighted features from Features Bank)
  const [newCarForm, setNewCarForm] = useState({
    title: '',
    make: 'Toyota',
    model: 'Fortuner',
    year: '2023',
    variant: '4x4 Sigma AT',
    price: 3450000,
    kmNumeric: 28000,
    fuel: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    ownership: '1st Owner',
    location: 'Tiruppur, Tamil Nadu',
    color: 'Silver Metallic',
    image: '/hero-fortuner.png',
    inspected: true,
    listingStatus: 'Available',
    keyFeatures: getFeaturesByIds(BODY_TYPE_DEFAULT_FEATURES['SUV'] || []),
  })

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Synchronize with live Supabase database
  const handleSyncDatabase = async (silent = false) => {
    setIsSyncing(true)
    try {
      const health = await checkSupabaseHealth()
      setDbStatus(health)
      if (health.connected) {
        // Sync cars
        try {
          const remoteCars = await fetchCarsFromSupabase()
          if (Array.isArray(remoteCars)) {
            // Check if there are local cars that have not synced to remote yet
            const localCars = getStoredCars()
            const missingFromRemote = localCars.filter(
              (lc) => lc && lc.id && !remoteCars.some((rc) => rc.id === lc.id)
            )

            if (missingFromRemote.length > 0) {
              // Sync missing local cars up to Supabase so they are NEVER lost on refresh!
              for (const missing of missingFromRemote) {
                try {
                  await publishDraftInSupabase(missing.id, missing)
                } catch (e) {
                  console.warn('Auto-sync missing car to cloud notice:', e.message)
                }
              }
              const recheck = await fetchCarsFromSupabase()
              if (Array.isArray(recheck)) {
                setCars(recheck)
                saveStoredCars(recheck)
              }
            } else {
              setCars(remoteCars)
              saveStoredCars(remoteCars)
            }
          }
        } catch (e) {
          console.warn('Cars sync notice:', e.message)
        }

        // Sync test drives
        try {
          const remoteTD = await fetchTestDrivesFromSupabase()
          if (Array.isArray(remoteTD)) {
            setTestDrives(remoteTD)
            saveStoredTestDrives(remoteTD)
          }
        } catch (e) {
          console.warn('Test drives sync notice:', e.message)
        }

        // Sync sell requests
        try {
          const remoteSR = await fetchSellRequestsFromSupabase()
          if (Array.isArray(remoteSR)) {
            setSellRequests(remoteSR)
            saveStoredSellRequests(remoteSR)
          }
        } catch (e) {
          console.warn('Sell requests sync notice:', e.message)
        }

        // Sync leads (merge — do not wipe local WhatsApp leads when remote is empty or behind)
        try {
          const remoteLeads = await fetchLeadsFromSupabase()
          const localLeads = getStoredLeads()
          const remoteIds = new Set((remoteLeads || []).map((l) => l?.id).filter(Boolean))
          const unsyncedLocal = localLeads.filter((l) => l?.id && !remoteIds.has(l.id))
          for (const lead of unsyncedLocal) {
            try {
              await addLeadToSupabase(lead)
            } catch (pushErr) {
              console.warn('Lead backfill notice:', pushErr.message)
            }
          }
          const refreshedRemote = unsyncedLocal.length > 0
            ? await fetchLeadsFromSupabase()
            : (remoteLeads || [])
          const mergedLeads = mergeLeadsWithRemote(refreshedRemote, localLeads)
          setLeads(mergedLeads)
          saveStoredLeads(mergedLeads)
        } catch (e) {
          console.warn('Leads sync notice:', e.message)
          setLeads(getStoredLeads())
        }

        // Sync activities
        try {
          const remoteActivities = await fetchActivitiesFromSupabase()
          if (Array.isArray(remoteActivities)) {
            setActivities(remoteActivities)
          }
        } catch (e) {
          console.warn('Activities sync notice:', e.message)
        }

        setLastSynced(new Date())
        if (!silent) showToast('Database synchronized with Supabase live!', 'success')
      } else {
        if (!silent) showToast(`Supabase status: ${health.message}`, 'warning')
      }
    } catch (err) {
      console.error('Supabase sync error:', err)
      setDbStatus({ checking: false, connected: false, message: err.message })
      if (!silent) showToast(`Sync failed: ${err.message}. Using offline storage.`, 'warning')
    } finally {
      setIsSyncing(false)
    }
  }

  // Initial sync on mount
  useEffect(() => {
    handleSyncDatabase(true)
  }, [])

  // Quick manual booking form state
  const [newBookingForm, setNewBookingForm] = useState({
    carId: '',
    customerName: '',
    phone: '',
    slot: 'Tomorrow, 11:00 AM',
    locationType: 'home',
    address: 'Tiruppur'
  })

  // Search input ref for Ctrl+K
  const searchInputRef = useRef(null)

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('metis_theme', theme)
  }, [theme])

  // Attach Metis CSS dynamically while in admin dashboard
  useEffect(() => {
    let link = document.getElementById('metis-theme-css')
    if (!link) {
      link = document.createElement('link')
      link.id = 'metis-theme-css'
      link.rel = 'stylesheet'
      link.href = '/metis.css'
      document.head.appendChild(link)
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      const existingLink = document.getElementById('metis-theme-css')
      if (existingLink) {
        existingLink.remove()
      }
      document.documentElement.removeAttribute('data-bs-theme')
    }
  }, [])

  // Two-way synchronization event listeners:
  // If user books test drive or submits sell request in frontend, admin updates in real-time!
  useEffect(() => {
    const handleCarsChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setCars(e.detail)
    }
    const handleTDChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setTestDrives(e.detail)
    }
    const handleSRChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setSellRequests(e.detail)
    }
    const handleLeadsChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setLeads(e.detail)
    }
    const handleRemindersChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setReminders(e.detail)
    }

    const handleStorage = (event) => {
      if (event.key === 'nova_cars_inventory') setCars(getStoredCars())
    }

    window.addEventListener('nova_cars_updated', handleCarsChange)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('nova_test_drives_updated', handleTDChange)
    window.addEventListener('nova_sell_requests_updated', handleSRChange)
    window.addEventListener('nova_leads_updated', handleLeadsChange)
    window.addEventListener('nova_reminders_updated', handleRemindersChange)

    return () => {
      window.removeEventListener('nova_cars_updated', handleCarsChange)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('nova_test_drives_updated', handleTDChange)
      window.removeEventListener('nova_sell_requests_updated', handleSRChange)
      window.removeEventListener('nova_leads_updated', handleLeadsChange)
      window.removeEventListener('nova_reminders_updated', handleRemindersChange)
    }
  }, [])

  // Alert the open admin session as soon as a new sell request is stored.
  useEffect(() => {
    const seen = new Set(getStoredSellRequests().map((sr) => sr.id))
    const mountedAt = Date.now()

    const unlockAudio = () => {
      const ctx = playSellRequestChime.ctx
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    }
    window.addEventListener('pointerdown', unlockAudio)

    const acceptIncoming = (incoming) => {
      const list = Array.isArray(incoming) ? incoming.filter(Boolean) : []
      const fresh = []
      for (const sr of list) {
        if (!sr.id || seen.has(sr.id)) continue
        seen.add(sr.id)
        const arrivedAt = Number(sr.timestamp) || 0
        if (arrivedAt >= mountedAt - 15000) fresh.push(sr)
      }
      if (!fresh.length) return

      setSellRequests((prev) => {
        const ids = new Set(prev.map((item) => item.id))
        const extra = fresh.filter((item) => !ids.has(item.id))
        if (!extra.length) return prev
        return [...extra, ...prev]
      })

      playSellRequestChime()
      const label = fresh.length === 1
        ? `New sell request ${fresh[0].id} for ${fresh[0].regNumber}`
        : `${fresh.length} new sell requests`
      setToastMessage({ msg: label, type: 'info' })
      window.setTimeout(() => setToastMessage(null), 6000)
    }

    const channel = supabase
      .channel('admin-sell-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sell_requests' }, (payload) => {
        acceptIncoming([mapSellRequestFromDb(payload.new)])
      })
      .subscribe()

    const onStorage = (event) => {
      if (event.key !== 'nova_sell_requests' || !event.newValue) return
      try {
        acceptIncoming(JSON.parse(event.newValue))
      } catch (err) {
        console.warn('Could not read sell request storage event', err)
      }
    }
    window.addEventListener('storage', onStorage)

    const poll = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const remote = await fetchSellRequestsFromSupabase()
        acceptIncoming(remote)
      } catch (err) {
        console.warn('Sell request poll notice:', err.message)
      }
    }, 4000)

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('storage', onStorage)
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [])

  // Close listing status dropdown on outside click or Escape key
  useEffect(() => {
    if (!openStatusDropdownCarId) return

    const handleClickOutside = (e) => {
      if (!e.target.closest('.status-dropdown-container')) {
        setOpenStatusDropdownCarId(null)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenStatusDropdownCarId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openStatusDropdownCarId])

  // Reset open status dropdown if page or filters change
  useEffect(() => {
    setOpenStatusDropdownCarId(null)
  }, [currentPage, inventoryViewMode, carSearch, statusFilter, bodyFilter, fuelFilter])

  // Computed KPI Metrics
  const kpis = useMemo(() => {
    const totalCount = cars.length
    const draftsCount = cars.filter(isCarDraft).length
    const availableCount = cars.filter((c) => (c.listingStatus || 'Available') === 'Available' && !isCarDraft(c)).length
    const soldCount = cars.filter((c) => (c.listingStatus || '') === 'Sold').length
    const totalInventoryValue = cars.filter((c) => !isCarDraft(c)).reduce((acc, c) => acc + (Number(c.price) || 0), 0)
    const inspectedCount = cars.filter((c) => c.inspected && !isCarDraft(c)).length
    const inspectedPct = totalCount > 0 ? Math.round((inspectedCount / totalCount) * 100) : 100
    const pendingTestDrives = testDrives.filter((td) => td.status === 'Pending').length
    const pendingSellRequests = sellRequests.filter((sr) => sr.status === 'Under Review').length

    return {
      totalCount,
      draftsCount,
      availableCount,
      soldCount,
      totalInventoryValue,
      totalInventoryFormatted: formatINRLakhsOrCrore(totalInventoryValue),
      avgPriceFormatted: totalCount > 0 ? formatINR(Math.round(totalInventoryValue / totalCount)) : '₹ 0',
      inspectedPct,
      testDrivesTotal: testDrives.length,
      pendingTestDrives,
      sellRequestsTotal: sellRequests.length,
      pendingSellRequests,
      leadsTotal: leads.length,
      remindersTotal: reminders.length,
      activeRemindersCount: reminders.filter((r) => r.status === 'active').length,
    }
  }, [cars, testDrives, sellRequests, leads, reminders])

  // Filtered cars for inventory table
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (carSearch) {
        const q = carSearch.toLowerCase()
        const matches =
          car.title?.toLowerCase().includes(q) ||
          car.make?.toLowerCase().includes(q) ||
          car.model?.toLowerCase().includes(q) ||
          car.variant?.toLowerCase().includes(q) ||
          car.location?.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (bodyFilter !== 'all' && car.bodyType?.toLowerCase() !== bodyFilter.toLowerCase()) {
        return false
      }
      if (fuelFilter !== 'all' && car.fuel?.toLowerCase() !== fuelFilter.toLowerCase()) {
        return false
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'Draft') {
          if (!isCarDraft(car)) return false
        } else {
          if (isCarDraft(car)) return false
          const currentStatus = (car.listingStatus || 'Available').toLowerCase()
          if (currentStatus !== statusFilter.toLowerCase()) return false
        }
      }
      return true
    })
  }, [cars, carSearch, bodyFilter, fuelFilter, statusFilter])

  // Pagination for inventory table
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage) || 1
  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCars.slice(start, start + itemsPerPage)
  }, [filteredCars, currentPage])

  // Body type breakdown for Donut Chart
  const bodyTypeStats = useMemo(() => {
    const counts = { Sedan: 0, SUV: 0, Hatchback: 0, MPV: 0 }
    cars.forEach((c) => {
      const type = c.bodyType || 'Sedan'
      if (counts[type] !== undefined) counts[type]++
      else counts.SUV++
    })
    const total = cars.length || 1
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    }))
  }, [cars])

  // Dealership Sales Analytics & Trends
  const [salesRangePreset, setSalesRangePreset] = useState('month')
  const [salesCustomFrom, setSalesCustomFrom] = useState(() => formatLocalISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [salesCustomTo, setSalesCustomTo] = useState(() => formatLocalISODate(new Date()))
  const salesRange = useMemo(
    () => getSalesRange(salesRangePreset, salesCustomFrom, salesCustomTo),
    [salesRangePreset, salesCustomFrom, salesCustomTo]
  )
  const salesTrend = useMemo(() => getSalesTrendAnalytics(cars, salesRange), [cars, salesRange])
  const bodyTypeSalesStats = useMemo(() => getBodyTypeSalesAnalytics(cars, salesRange), [cars, salesRange])
  const modelSalesStats = useMemo(() => getModelSalesAnalytics(cars, salesRange), [cars, salesRange])
  const periodTestDrives = useMemo(
    () => testDrives.filter((drive) => recordInSalesRange(drive, salesRange)),
    [testDrives, salesRange]
  )
  const periodSellRequests = useMemo(
    () => sellRequests.filter((request) => recordInSalesRange(request, salesRange)),
    [sellRequests, salesRange]
  )

  // Global search across cars, bookings, and sell requests
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results = []

    if ('add vehicle'.includes(q) || 'new car'.includes(q) || 'add car'.includes(q) || 'create'.includes(q)) {
      results.push({
        title: '➕ Add New Vehicle to Inventory',
        type: 'New Page',
        tab: 'add-car'
      })
    }

    cars.filter((c) => c.title?.toLowerCase().includes(q)).slice(0, 3).forEach((c) => {
      results.push({
        title: `${c.title} • ${c.priceFormatted}`,
        type: 'Car Listing',
        tab: 'inventory'
      })
    })

    testDrives.filter((td) => td.customerName?.toLowerCase().includes(q) || td.ref?.toLowerCase().includes(q)).slice(0, 2).forEach((td) => {
      results.push({
        title: `Test Drive: ${td.customerName} (${td.carTitle})`,
        type: 'Test Drive',
        tab: 'bookings'
      })
    })

    sellRequests.filter((sr) => sr.regNumber?.toLowerCase().includes(q) || sr.customerName?.toLowerCase().includes(q)).slice(0, 2).forEach((sr) => {
      results.push({
        title: `Trade-in: ${sr.regNumber} • ${sr.carTitle}`,
        type: 'Sell Request',
        tab: 'sell-requests'
      })
    })

    return results
  }, [searchQuery, cars, testDrives, sellRequests])

  const editCarId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') === 'edit-car' ? params.get('car') : null
  }, [])

  const [editingVehicle, setEditingVehicle] = useState(() => {
    if (!editCarId) return null
    return getStoredCars().find((car) => String(car.id) === String(editCarId)) || null
  })
  const [editingVehicleStatus, setEditingVehicleStatus] = useState(() => {
    if (!editCarId) return 'idle'
    return getStoredCars().some((car) => String(car.id) === String(editCarId)) ? 'ready' : 'loading'
  })

  useEffect(() => {
    if (!editCarId) return undefined
    let isMounted = true
    fetchCarByIdFromSupabase(editCarId)
      .then((car) => {
        if (!isMounted) return
        if (car) {
          setEditingVehicle((current) => current || car)
        }
        const hasVehicle = Boolean(car) || getStoredCars().some((item) => String(item.id) === String(editCarId))
        setEditingVehicleStatus(hasVehicle ? 'ready' : 'missing')
      })
      .catch(() => {
        if (!isMounted) return
        setEditingVehicleStatus(getStoredCars().some((item) => String(item.id) === String(editCarId)) ? 'ready' : 'missing')
      })
    return () => {
      isMounted = false
    }
  }, [editCarId])

  // Opens the same add-vehicle form in a new tab, filled with this listing.
  const handleOpenEditCar = (car) => {
    const url = new URL(window.location.href)
    url.searchParams.set('screen', 'admin')
    url.searchParams.set('tab', 'edit-car')
    url.searchParams.set('car', car.id)
    url.hash = ''
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  // Handlers for Drafts Folder Management
  const handleResumeDraft = (draft) => {
    setEditingDraft(draft)
    setActiveTab('add-car')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast(`Resumed draft "${draft.title || draft.make}"`, 'info')
  }

  const handleDiscardDraft = async (id) => {
    discardDraftCar(id)
    try {
      await discardDraftFromSupabase(id)
    } catch (err) {
      console.warn('Supabase discard draft notice:', err.message)
    }
    setCars(getStoredCars())
    showToast('Draft discarded successfully.', 'info')
  }

  const handlePublishDraft = async (draft) => {
    const published = publishDraftCar(draft.id, { listingStatus: 'Available', isDraft: false })
    try {
      await publishDraftInSupabase(draft.id, { listingStatus: 'Available', isDraft: false })
    } catch (err) {
      console.warn('Supabase publish draft notice:', err.message)
    }
    setCars(getStoredCars())
    showToast(`Draft "${published?.title || draft.title || draft.make}" published live to storefront!`, 'success')
  }

  // Handlers for Dedicated Highlighted Features Modal
  const handleOpenFeaturesModal = (car) => {
    setManagingCarFeatures({ ...car, keyFeatures: car.keyFeatures || [] })
    setFeaturesModalOpen(true)
  }

  const handleSaveFeaturesModal = (newFeatures) => {
    if (!managingCarFeatures) return
    const carId = managingCarFeatures.id
    updateCar(carId, { keyFeatures: newFeatures })

    updateCarInSupabase(carId, { keyFeatures: newFeatures })
      .then(() => {
        showToast(`Top features saved to Supabase for "${managingCarFeatures.title}"!`, 'success')
      })
      .catch((err) => {
        console.warn('Supabase features save notice:', err.message)
      })

    setFeaturesModalOpen(false)
    showToast(`Updated top highlights for "${managingCarFeatures.title}"!`)
  }

  // Delete Car
  const handleDeleteCar = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from inventory and customer catalog?`)) {
      deleteCar(id)
      deleteCarFromSupabase(id).catch((err) => console.warn('Supabase deleteCar notice:', err.message))
      setSelectedCarIds((prev) => prev.filter((i) => i !== id))
      showToast(`Removed "${title}" from live store`, 'warning')
    }
  }

  // Quick status toggle
  const handleToggleCarStatus = async (car, newStatus) => {
    const wasDraft = isCarDraft(car)
    const isNowDraft = newStatus === 'Draft'

    // If marking as Sold, open dedicated Record Sale Modal for accurate price/date/buyer tracking
    if (newStatus === 'Sold') {
      setSaleModalCar(car)
      return
    }

    if (wasDraft && !isNowDraft) {
      const published = publishDraftCar(car.id, { listingStatus: newStatus, isDraft: false })
      try {
        await publishDraftInSupabase(car.id, { listingStatus: newStatus, isDraft: false })
      } catch (err) {
        console.warn('Supabase publish draft notice:', err.message)
      }
      setCars(getStoredCars())
      showToast(`Published "${published?.title || car.title || car.make}" as ${newStatus}!`, 'success')
      return
    }

    const updates = {
      listingStatus: newStatus,
      isDraft: isNowDraft,
    }
    updateCar(car.id, updates)
    try {
      await updateCarInSupabase(car.id, {
        listingStatus: newStatus,
        isDraft: isNowDraft,
        dealer: {
          ...(typeof car.dealer === 'object' && car.dealer !== null ? car.dealer : {}),
          isDraft: isNowDraft,
          draftStatus: isNowDraft ? 'Draft' : 'Published',
        },
      })
    } catch (err) {
      console.warn('Supabase notice:', err.message)
    }
    setCars(getStoredCars())
    showToast(isNowDraft ? `Saved "${car.title}" as Draft` : `Marked "${car.title}" as ${newStatus}`)
  }

  // Handle sale confirmation from RecordSaleModal
  const handleConfirmSale = async (car, saleData) => {
    const updates = {
      ...saleData,
      listingStatus: 'Sold',
      isDraft: false,
    }
    updateCar(car.id, updates)
    try {
      await updateCarInSupabase(car.id, updates)
    } catch (err) {
      console.warn('Supabase record sale notice:', err.message)
    }
    setCars(getStoredCars())
    showToast(`🎉 Recorded sale of "${car.title}" for ${formatINR(saleData.soldPrice)}! Sales trend & revenue updated.`, 'success')
  }

  // Quick toggle Nova inspection
  const handleToggleInspection = (car) => {
    const updatedStatus = !car.inspected
    updateCar(car.id, { inspected: updatedStatus })
    updateCarInSupabase(car.id, { inspected: updatedStatus }).catch((err) => console.warn('Supabase notice:', err.message))
    showToast(`Inspection status set to ${updatedStatus ? 'Certified A+' : 'Standard'}`)
  }

  const handleToggleHero = (car) => {
    const next = !car.showInHero
    updateCarInSupabase(car.id, { showInHero: next })
      .then(() => {
        updateCar(car.id, { showInHero: next })
        setCars(getStoredCars())
        showToast(next ? `${car.title} is now on the hero` : `${car.title} removed from the hero`)
      })
      .catch((err) => {
        showToast(err.message || 'Could not save the hero flag. Run the hero page SQL first.', 'error')
      })
  }

  // Reset to default factory inventory
  const handleResetCars = () => {
    if (window.confirm('Reset car inventory to default factory showroom list? Any custom added cars will be restored.')) {
      resetCars()
      showToast('Inventory reset to default showroom cars!')
    }
  }

  // Export Cars to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Make', 'Model', 'Year', 'Variant', 'Price_INR', 'KM_Driven', 'Fuel', 'Transmission', 'Body_Type', 'Location', 'Status', 'Nova_Certified']
    const rows = cars.map((c) => [
      c.id,
      `"${c.make}"`,
      `"${c.model}"`,
      c.year,
      `"${c.variant}"`,
      c.price,
      c.kmNumeric || c.km,
      c.fuel,
      c.transmission,
      c.bodyType,
      `"${c.location}"`,
      c.listingStatus || 'Available',
      c.inspected ? 'Yes' : 'No'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Harsha_cars_Inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Cars inventory exported to CSV')
  }

  // Export Test Drives to CSV
  const handleExportTestDrivesCSV = () => {
    const headers = ['Booking_Ref', 'Customer_Name', 'Phone', 'Vehicle', 'Preferred_Slot', 'Location_Type', 'Address', 'Status', 'Booked_At']
    const rows = testDrives.map((td) => [
      td.ref,
      `"${td.customerName}"`,
      `"${td.phone}"`,
      `"${td.carTitle}"`,
      `"${td.slot}"`,
      td.locationType,
      `"${td.address}"`,
      td.status,
      `"${td.bookedAt}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Harsha_cars_Test_Drives_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Test drive bookings exported to CSV')
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  return (
    <div className="admin-app" style={{ minHeight: '100vh', width: '100%' }}>
      <div className={`admin-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="admin-wrapper">

        {/* ==============================================================
            HEADER / NAVBAR
        ============================================================== */}
        <header className="admin-header">
          <nav className="navbar navbar-expand-lg bg-body border-bottom px-2 px-sm-3">
            <div className="container-fluid px-0 d-flex align-items-center flex-nowrap">

              {/* Hamburger Sidebar Toggle */}
              <button
                className="hamburger-menu btn btn-link p-1 text-body me-2 flex-shrink-0 d-inline-flex align-items-center justify-content-center"
                type="button"
                onClick={() => {
                  if (window.innerWidth < 992) {
                    setMobileSidebarOpen(!mobileSidebarOpen)
                  } else {
                    setSidebarCollapsed(!sidebarCollapsed)
                  }
                }}
                aria-label="Toggle sidebar"
                style={{ textDecoration: 'none' }}
              >
                <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
              </button>

              {/* Brand Logo & Name */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="navbar-brand d-flex align-items-center border-0 bg-transparent text-decoration-none me-2 p-0"
                style={{ cursor: 'pointer' }}
              >
                <BrandLogo imgClassName="h-8 w-auto max-w-[140px] object-contain me-2 flex-shrink-0" />
              </button>

              {/* Search Bar */}
              <div className="search-container flex-grow-1 mx-3 d-none d-lg-block position-relative">
                <div className="position-relative">
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSearchResultsOpen(true)
                    }}
                    onFocus={() => setSearchResultsOpen(true)}
                    onBlur={() => setTimeout(() => setSearchResultsOpen(false), 250)}
                    aria-label="Search"
                  />
                  <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-muted pointer-events-none"></i>

                  {/* Search Results Dropdown */}
                  {searchResultsOpen && globalSearchResults.length > 0 && (
                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-2 shadow-lg mt-1 z-3 overflow-hidden">
                      {globalSearchResults.map((res, idx) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            if (res.tab === 'add-car') {
                              setEditingDraft(null)
                            }
                            setActiveTab(res.tab)
                            setSearchQuery('')
                            setSearchResultsOpen(false)
                          }}
                          className="d-flex align-items-center px-3 py-2 text-decoration-none text-dark border-bottom cursor-pointer hover-bg-light"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-arrow-right-circle me-2 text-primary"></i>
                          <span className="small">{res.title}</span>
                          <small className="ms-auto badge bg-light text-muted border">
                            {res.type}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="navbar-nav flex-row align-items-center ms-auto flex-shrink-0">
                {/* Supabase Database Connection & Sync Status */}
                <div className="d-none d-md-flex align-items-center me-2">
                  <button
                    type="button"
                    onClick={() => handleSyncDatabase(false)}
                    disabled={isSyncing}
                    className={`btn btn-sm d-inline-flex align-items-center gap-1.5 px-2 px-sm-2.5 py-1 rounded-pill ${
                      dbStatus.connected
                        ? 'btn-outline-success'
                        : 'btn-outline-warning'
                    }`}
                    title={`Supabase Database: ${dbStatus.message || 'qkriofsteqxccheavuot'}. Click to sync.`}
                    style={{ fontSize: '11.5px' }}
                  >
                    <span
                      className={`rounded-circle d-inline-block ${
                        dbStatus.connected ? 'bg-success' : 'bg-warning'
                      }`}
                      style={{
                        width: '7px',
                        height: '7px',
                        boxShadow: dbStatus.connected ? '0 0 6px rgba(25, 135, 84, 0.8)' : 'none'
                      }}
                    ></span>
                    <span className="d-none d-sm-inline fw-semibold">
                      {isSyncing ? 'Syncing...' : dbStatus.connected ? 'Supabase Live' : 'Supabase Standby'}
                    </span>
                    <i className={`bi bi-arrow-repeat ${isSyncing ? 'spin-icon' : ''}`} style={{ fontSize: '11px' }}></i>
                  </button>
                </div>

                {/* Switch to Frontend Storefront Button */}
                <button
                  type="button"
                  onClick={onReturnToStore}
                  className="btn btn-sm btn-outline-primary me-2 d-none d-lg-inline-flex align-items-center gap-1 px-2.5"
                  title="View user side store"
                >
                  <i className="bi bi-shop"></i>
                  <span className="font-semibold">Storefront</span>
                </button>

                {/* Theme Toggle Button */}
                <button
                  className="btn btn-sm btn-outline-secondary me-2 d-flex align-items-center justify-content-center"
                  type="button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  title="Toggle light / dark theme"
                  style={{ width: '32px', height: '32px' }}
                >
                  {theme === 'light' ? (
                    <i className="bi bi-moon-fill" style={{ fontSize: '0.9rem' }}></i>
                  ) : (
                    <i className="bi bi-sun-fill text-warning" style={{ fontSize: '0.9rem' }}></i>
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  className="btn btn-sm btn-outline-secondary me-1.5 me-sm-2 d-none d-md-inline-flex align-items-center justify-content-center"
                  type="button"
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                  style={{ width: '32px', height: '32px' }}
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </button>

                {/* Notifications Dropdown: Pending Test Drives & Leads */}
                <div className="position-relative me-2">
                  <button
                    className="btn btn-sm btn-outline-secondary position-relative d-flex align-items-center justify-content-center"
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    style={{ width: '32px', height: '32px' }}
                  >
                    <i className="bi bi-bell" style={{ fontSize: '0.95rem' }}></i>
                    {(kpis.pendingTestDrives > 0 || kpis.pendingSellRequests > 0) && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', padding: '0.25em 0.4em' }}>
                        {kpis.pendingTestDrives + kpis.pendingSellRequests}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 p-0"
                      style={{ minWidth: '280px', maxWidth: 'calc(100vw - 24px)', zIndex: 1050 }}
                    >
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                        <span className="fw-bold small">Dealership Alerts</span>
                        <span className="badge bg-primary rounded-pill small">
                          {kpis.pendingTestDrives + kpis.pendingSellRequests} Pending
                        </span>
                      </div>
                      <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {kpis.pendingTestDrives > 0 ? (
                          <button
                            type="button"
                            className="list-group-item list-group-item-action p-2.5 small"
                            onClick={() => {
                              setActiveTab('bookings')
                              setNotificationsOpen(false)
                            }}
                          >
                            <div className="d-flex align-items-center text-primary fw-semibold">
                              <i className="bi bi-calendar-event me-2"></i>
                              <span>{kpis.pendingTestDrives} Test Drive(s) Pending</span>
                            </div>
                          </button>
                        ) : null}

                        {kpis.pendingSellRequests > 0 ? (
                          <button
                            type="button"
                            className="list-group-item list-group-item-action p-2.5 small"
                            onClick={() => {
                              setActiveTab('sell-requests')
                              setNotificationsOpen(false)
                            }}
                          >
                            <div className="d-flex align-items-center text-success fw-semibold">
                              <i className="bi bi-tag me-2"></i>
                              <span>{kpis.pendingSellRequests} Sell Requests Pending</span>
                            </div>
                          </button>
                        ) : null}

                        {testDrives.slice(0, 2).map((td) => (
                          <div key={td.id} className="list-group-item p-2.5 small text-muted">
                            <div className="fw-medium text-dark">{td.customerName} &bull; {td.carTitle}</div>
                            <div style={{ fontSize: '11px' }}>{td.slot} &bull; {td.locationType === 'home' ? 'Doorstep' : 'Showroom Hub'}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-top text-center bg-light">
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none py-0"
                          onClick={() => {
                            setActiveTab('bookings')
                            setNotificationsOpen(false)
                          }}
                        >
                          View All Bookings &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="position-relative">
                  <button
                    className="btn btn-link text-decoration-none d-flex align-items-center p-0"
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                      AD
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 p-2"
                      style={{ minWidth: '220px', maxWidth: 'calc(100vw - 24px)', zIndex: 1050 }}
                    >
                      <div className="px-2 py-1.5 border-bottom mb-1">
                        <div className="fw-bold small">Admin</div>
                      </div>
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 d-flex align-items-center gap-2 d-lg-none"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onReturnToStore()
                        }}
                      >
                        <i className="bi bi-shop text-primary"></i>
                        <span>Return to Storefront</span>
                      </button>
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 d-flex align-items-center gap-2"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setActiveTab('settings')
                        }}
                      >
                        <i className="bi bi-gear text-secondary"></i>
                        <span>Dealership Settings</span>
                      </button>
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 d-flex align-items-center gap-2 d-md-none"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          handleSyncDatabase(false)
                        }}
                      >
                        <i className={`bi bi-arrow-repeat text-success ${isSyncing ? 'spin-icon' : ''}`}></i>
                        <span>{isSyncing ? 'Syncing...' : 'Sync Database'}</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 text-danger d-flex align-items-center gap-2"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onLogout()
                        }}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Sign Out of Admin</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </nav>
        </header>

        {/* ==============================================================
            SIDEBAR NAVIGATION
        ============================================================== */}
        <aside
          className={`admin-sidebar ${mobileSidebarOpen ? 'show' : ''}`}
          id="admin-sidebar"
        >
          <div className="sidebar-content d-flex flex-column h-100">
            {/* Nav Menu */}
            <nav className="sidebar-nav flex-grow-1 p-2 overflow-y-auto">
              <ul className="nav nav-pills flex-column gap-1">
                {/* 1. Dashboard Overview */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'dashboard' ? 'active' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    <span>Overview</span>
                  </button>
                </li>

                {/* 2. Cars Inventory */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inventory')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'inventory' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-car-front me-2"></i>
                      <span>Cars Inventory</span>
                    </div>
                    <span className={`badge rounded-pill ${activeTab === 'inventory' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {kpis.totalCount}
                    </span>
                  </button>
                </li>

                {/* 2b. Add Vehicle (Dedicated Page) */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDraft(null)
                      setActiveTab('add-car')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'add-car' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-plus-circle me-2"></i>
                      <span>Add Vehicle</span>
                    </div>
                    <span className={`badge rounded-pill ${activeTab === 'add-car' ? 'bg-white text-primary' : 'bg-primary-subtle text-primary'}`}>
                      New
                    </span>
                  </button>
                </li>

                {/* 2c. Drafts Folder */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('drafts')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'drafts' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-folder-check me-2 text-warning"></i>
                      <span>Drafts Folder</span>
                    </div>
                    {kpis.draftsCount > 0 ? (
                      <span className={`badge rounded-pill ${activeTab === 'drafts' ? 'bg-white text-dark' : 'bg-warning text-dark'}`}>
                        {kpis.draftsCount}
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-secondary-subtle text-secondary">
                        0
                      </span>
                    )}
                  </button>
                </li>

                {/* 3. Test Drive Bookings */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('bookings')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'bookings' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-check me-2"></i>
                      <span>Test Drives</span>
                    </div>
                    {kpis.pendingTestDrives > 0 ? (
                      <span className="badge bg-danger rounded-pill">
                        {kpis.pendingTestDrives}
                      </span>
                    ) : (
                      <span className={`badge rounded-pill ${activeTab === 'bookings' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                        {kpis.testDrivesTotal}
                      </span>
                    )}
                  </button>
                </li>

                {/* 4. Sell Car Requests */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sell-requests')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'sell-requests' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-tag me-2"></i>
                      <span>Sell Requests</span>
                    </div>
                    {kpis.pendingSellRequests > 0 ? (
                      <span className="badge bg-warning text-dark rounded-pill">
                        {kpis.pendingSellRequests}
                      </span>
                    ) : (
                      <span className={`badge rounded-pill ${activeTab === 'sell-requests' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                        {kpis.sellRequestsTotal}
                      </span>
                    )}
                  </button>
                </li>

                {/* 5. Customer Leads */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('leads')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'leads' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-chat-dots me-2"></i>
                      <span>Customer Leads</span>
                    </div>
                    <span className={`badge rounded-pill ${activeTab === 'leads' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {kpis.leadsTotal}
                    </span>
                  </button>
                </li>

                {/* 5b. Car Reminders */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reminders')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'reminders' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-bell me-2 text-warning"></i>
                      <span>Car Reminders</span>
                    </div>
                    {kpis.activeRemindersCount > 0 ? (
                      <span className="badge bg-warning text-dark rounded-pill">
                        {kpis.activeRemindersCount}
                      </span>
                    ) : (
                      <span className={`badge rounded-pill ${activeTab === 'reminders' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                        {kpis.remindersTotal}
                      </span>
                    )}
                  </button>
                </li>

                {/* 6. Analytics */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('analytics')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'analytics' ? 'active' : ''}`}
                  >
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    <span>Analytics</span>
                  </button>
                </li>

                {/* 6b. Hero Page */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('hero')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'hero' ? 'active' : ''}`}
                  >
                    <i className="bi bi-image me-2"></i>
                    <span>Hero Page</span>
                  </button>
                </li>

                {/* 7. Settings */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'settings' ? 'active' : ''}`}
                  >
                    <i className="bi bi-gear me-2"></i>
                    <span>Settings</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-top mt-auto bg-body-tertiary">
              <button
                type="button"
                onClick={onReturnToStore}
                className="btn btn-outline-secondary btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2 sidebar-bottom-btn"
                title="Customer Storefront"
              >
                <i className="bi bi-arrow-left"></i>
                <span>Customer Storefront</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 sidebar-bottom-btn"
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="modal-backdrop fade show d-lg-none"
            style={{ zIndex: 1040 }}
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
        )}

        {/* ==============================================================
            MAIN PAGE CONTENT
        ============================================================== */}
        <main id="main-content" className="admin-main">
          <div className="container-fluid p-3 p-lg-4">

            {/* ==========================================================
                TAB 1: OVERVIEW DASHBOARD
            ========================================================== */}
            {activeTab === 'dashboard' && (
              <>
                {/* Header Row */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                  <div>
                    <h1 className="sales-overview-title">Overview</h1>
                    <p className="sales-overview-sub">{salesRange.label}</p>
                  </div>
                  <div className="d-flex gap-2 w-100 w-md-auto">
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 flex-md-grow-0"
                      onClick={() => {
                        setEditingDraft(null)
                        setActiveTab('add-car')
                      }}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add Vehicle</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={handleExportCSV}
                      title="Export Cars CSV"
                    >
                      <i className="bi bi-download"></i>
                      <span className="d-none d-sm-inline ms-1">Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={() => {
                        setCars(getStoredCars())
                        setTestDrives(getStoredTestDrives())
                        setSellRequests(getStoredSellRequests())
                        showToast('Data refreshed')
                      }}
                      title="Refresh"
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>

                <SalesRangeBar
                  preset={salesRangePreset}
                  onPreset={setSalesRangePreset}
                  from={salesCustomFrom}
                  to={salesCustomTo}
                  onFrom={setSalesCustomFrom}
                  onTo={setSalesCustomTo}
                />

                <div className="sales-kpis">
                  <article className="sales-kpi">
                    <p>Sales revenue</p>
                    <strong>{salesTrend.totalRevenueFormatted}</strong>
                    <span>{salesTrend.totalUnitsSold} cars sold</span>
                  </article>
                  <article className="sales-kpi">
                    <p>Live inventory</p>
                    <strong>{kpis.availableCount} available</strong>
                    <span>{kpis.totalInventoryFormatted} on the floor</span>
                  </article>
                  <article className="sales-kpi">
                    <p>Test drives</p>
                    <strong>{periodTestDrives.length} booked</strong>
                    <span>
                      {periodTestDrives.filter((drive) => drive.status === 'Pending').length} pending
                    </span>
                  </article>
                  <article className="sales-kpi">
                    <p>Sell requests</p>
                    <strong>{periodSellRequests.length} enquiries</strong>
                    <span>
                      {periodSellRequests.filter((request) => request.status === 'Under Review').length} pending
                    </span>
                  </article>
                </div>

                {/* Section: Vehicle Sales Revenue Trend & Body Type Distribution */}
                <div className="row g-4 mb-4">
                  {/* Left Column: Interactive Realtime Sales Revenue & Units SVG Chart */}
                  <div className="col-lg-8">
                    <SalesRevenueChart
                      salesData={salesTrend}
                      onRecordSaleClick={() => {
                        const firstAvail = cars.find((c) => (c.listingStatus || 'Available') === 'Available' && !isCarDraft(c))
                        if (firstAvail) {
                          setSaleModalCar(firstAvail)
                        } else {
                          showToast('No available vehicle in stock to mark sold. Add a vehicle first!', 'info')
                        }
                      }}
                    />
                  </div>

                  {/* Right Column: Body Type Distribution & Revenue Mix */}
                  <div className="col-lg-4">
                    <BodyTypeMixCard bodyStats={bodyTypeSalesStats} />
                  </div>
                </div>

                {/* Section: Vehicle Models & Brands Performance */}
                <div className="row g-4 mb-4">
                  <div className="col-12">
                    <ModelsPerformanceCard
                      modelsData={modelSalesStats}
                      onViewInventory={() => setActiveTab('inventory')}
                    />
                  </div>
                </div>

                {/* Section: Live Test Drives Table & Recent Activity */}
                <div className="row g-4">
                  {/* Left: Latest Test Drive Appointments */}
                  <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="h5 card-title mb-0 fw-bold">Recent Test Drives</h2>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setActiveTab('bookings')}
                        >
                          View All ({periodTestDrives.length})
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 sales-activity-table" style={{ minWidth: '700px' }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: '170px' }} className="text-nowrap">Ref / Customer</th>
                              <th style={{ minWidth: '180px' }} className="text-nowrap">Vehicle</th>
                              <th style={{ minWidth: '140px' }} className="text-nowrap">Slot & Type</th>
                              <th style={{ minWidth: '110px' }} className="text-nowrap">Status</th>
                              <th className="text-end text-nowrap" style={{ minWidth: '100px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periodTestDrives.length === 0 && (
                              <tr>
                                <td colSpan="5" className="text-body-secondary py-4">No test drives in this period.</td>
                              </tr>
                            )}
                            {periodTestDrives.slice(0, 5).map((td) => (
                              <tr key={td.id}>
                                <td>
                                  <div className="fw-bold">{td.customerName}</div>
                                  <div className="text-muted">
                                    <span className="font-monospace text-primary">{td.ref}</span> &bull; {td.phone}
                                  </div>
                                </td>
                                <td>
                                  <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                                    {td.carTitle}
                                  </div>
                                  <div className="text-muted">{td.carPrice}</div>
                                </td>
                                <td>
                                  <div>{td.slot}</div>
                                  <span className={`badge ${td.locationType === 'home' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                                    {td.locationType === 'home' ? 'Home Doorstep' : 'Showroom Hub'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    td.status === 'Confirmed' ? 'bg-success' :
                                    td.status === 'Completed' ? 'bg-secondary' :
                                    td.status === 'Cancelled' ? 'bg-danger' :
                                    'bg-warning text-dark'
                                  }`}>
                                    {td.status}
                                  </span>
                                </td>
                                <td className="text-end">
                                  {td.status === 'Pending' ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={() => {
                                        updateTestDriveStatus(td.id, 'Confirmed')
                                        showToast(`Confirmed test drive for ${td.customerName}`)
                                      }}
                                    >
                                      Confirm
                                    </button>
                                  ) : td.status === 'Confirmed' ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => {
                                        updateTestDriveStatus(td.id, 'Completed')
                                        showToast(`Marked test drive as completed`)
                                      }}
                                    >
                                      Complete
                                    </button>
                                  ) : (
                                    <span className="text-muted small">&bull;</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dealership Activity Feed */}
                  <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Recent Activity</h2>
                      </div>
                      <div className="card-body p-3">
                        <div className="timeline">
                          {activities.map((act) => (
                            <div key={act.id} className="d-flex align-items-start mb-3">
                              <div className={`bg-${act.color} bg-opacity-10 text-${act.color} p-2 rounded-circle me-3 shrink-0 d-flex align-items-center justify-content-center`} style={{ width: '32px', height: '32px' }}>
                                <i className={`bi ${act.icon}`} style={{ fontSize: '0.9rem' }}></i>
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{act.title}</div>
                                <div className="text-muted">{act.subtitle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 2: CARS INVENTORY MANAGEMENT
            ========================================================== */}
            {activeTab === 'inventory' && (
              <>
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-0 fw-bold">Cars Inventory</h1>
                  </div>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    {/* View Toggle */}
                    <div className="btn-group btn-group-sm" role="group" aria-label="Inventory view toggle">
                      <button
                        type="button"
                        className={`btn d-inline-flex align-items-center gap-1 ${inventoryViewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setInventoryViewMode('table')}
                        title="Table View"
                      >
                        <i className="bi bi-table"></i>
                        <span>Table</span>
                      </button>
                      <button
                        type="button"
                        className={`btn d-inline-flex align-items-center gap-1 ${inventoryViewMode === 'cards' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setInventoryViewMode('cards')}
                        title="Card Grid View"
                      >
                        <i className="bi bi-grid-3x2-gap"></i>
                        <span>Cards</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                      onClick={handleExportCSV}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5"
                      onClick={handleResetCars}
                      title="Reset inventory to default seed"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
                      onClick={() => {
                        setEditingDraft(null)
                        setActiveTab('add-car')
                      }}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add Car</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar Card */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-3">
                    <div className="row g-2 align-items-center">
                      {/* Search */}
                      <div className="col-12 col-md-4">
                        <div className="position-relative">
                          <input
                            type="search"
                            className="form-control form-control-sm"
                            placeholder="Search make, model, variant..."
                            value={carSearch}
                            onChange={(e) => {
                              setCarSearch(e.target.value)
                              setCurrentPage(1)
                            }}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted small"></i>
                        </div>
                      </div>

                      {/* Body Type Filter */}
                      <div className="col-6 col-sm-4 col-md-2">
                        <CustomSelect
                          size="sm"
                          value={bodyFilter}
                          onChange={(val) => {
                            setBodyFilter(val)
                            setCurrentPage(1)
                          }}
                          options={[
                            { value: 'all', label: 'All Body Types' },
                            { value: 'Sedan', label: 'Sedan' },
                            { value: 'SUV', label: 'SUV' },
                            { value: 'Hatchback', label: 'Hatchback' },
                            { value: 'MPV', label: 'MPV' },
                          ]}
                        />
                      </div>

                      {/* Fuel Filter */}
                      <div className="col-6 col-sm-4 col-md-2">
                        <CustomSelect
                          size="sm"
                          value={fuelFilter}
                          onChange={(val) => {
                            setFuelFilter(val)
                            setCurrentPage(1)
                          }}
                          options={[
                            { value: 'all', label: 'All Fuels' },
                            { value: 'Petrol', label: 'Petrol' },
                            { value: 'Diesel', label: 'Diesel' },
                            { value: 'CNG', label: 'CNG' },
                          ]}
                        />
                      </div>

                      {/* Listing Status */}
                      <div className="col-6 col-sm-4 col-md-2">
                        <CustomSelect
                          size="sm"
                          value={statusFilter}
                          onChange={(val) => {
                            setStatusFilter(val)
                            setCurrentPage(1)
                          }}
                          options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'Available', label: 'Available' },
                            { value: 'Reserved', label: 'Reserved' },
                            { value: 'Sold', label: 'Sold' },
                            { value: 'Draft', label: `📁 Drafts (${kpis.draftsCount})` },
                          ]}
                        />
                      </div>

                      {/* Result Counter */}
                      <div className="col-6 col-sm-12 col-md-2 text-sm-start text-md-end">
                        <span className="small text-muted">
                          Showing <strong>{filteredCars.length}</strong> of <strong>{cars.length}</strong> cars
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Table / Card Card */}
                {inventoryViewMode === 'table' ? (
                  <div className="card border-0 shadow-sm overflow-hidden">
                    <div className="table-responsive" style={{ minHeight: '280px' }}>
                      <table className="table table-hover align-middle mb-0" style={{ minWidth: '920px' }}>
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '40px', minWidth: '40px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedCarIds.length === paginatedCars.length && paginatedCars.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedCarIds(paginatedCars.map((c) => c.id))
                                  else setSelectedCarIds([])
                                }}
                              />
                            </th>
                            <th style={{ minWidth: '260px' }} className="text-nowrap">Vehicle</th>
                            <th style={{ minWidth: '160px' }} className="text-nowrap">Specs</th>
                            <th style={{ minWidth: '140px' }} className="text-nowrap">Price & EMI</th>
                            <th style={{ minWidth: '150px' }} className="text-nowrap">Inspection</th>
                            <th style={{ minWidth: '130px' }} className="text-nowrap">Listing Status</th>
                            <th className="text-end text-nowrap" style={{ minWidth: '100px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCars.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-5 text-muted">
                                <i className="bi bi-car-front fs-2 d-block mb-2"></i>
                                No vehicles found. Click "Reset" to restore.
                              </td>
                            </tr>
                          ) : (
                            paginatedCars.map((car, index) => {
                              const isNearBottom = index >= paginatedCars.length - 2 && paginatedCars.length > 2
                              return (
                                <tr key={car.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={selectedCarIds.includes(car.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedCarIds([...selectedCarIds, car.id])
                                        else setSelectedCarIds(selectedCarIds.filter((i) => i !== car.id))
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <img
                                        src={car.image || '/mock_cars/honda_city_front.jpg'}
                                        alt={car.title}
                                        className="rounded me-2.5 border flex-shrink-0"
                                        style={{ width: '56px', height: '40px', objectFit: 'cover' }}
                                        onError={(e) => {
                                          e.target.src = '/mock_cars/honda_city_front.jpg'
                                        }}
                                      />
                                      <div style={{ minWidth: 0 }}>
                                        <div className="fw-bold small text-nowrap">{car.title}</div>
                                        <div className="text-muted text-nowrap" style={{ fontSize: '11px' }}>
                                          {car.variant} &bull; {car.year} &bull; {car.location}
                                        </div>
                                        {/* Highlighted Features preview */}
                                        <div className="d-flex flex-wrap gap-1 mt-1">
                                          {(car.keyFeatures || []).slice(0, 3).map((feat) => (
                                            <span
                                              key={feat.id}
                                              className="badge bg-body-secondary text-secondary-emphasis border py-0.5 px-1.5 d-inline-flex align-items-center gap-1"
                                              style={{ fontSize: '9.5px', fontWeight: 500 }}
                                            >
                                              {renderFeatureIcon(feat.iconName, 'w-2.5 h-2.5')}
                                              <span>{feat.name}</span>
                                            </span>
                                          ))}
                                          {(car.keyFeatures?.length || 0) > 3 && (
                                            <span
                                              onClick={() => handleOpenFeaturesModal(car)}
                                              className="badge bg-primary-subtle text-primary border py-0.5 px-1 cursor-pointer"
                                              style={{ fontSize: '9px', cursor: 'pointer' }}
                                              title="Click to view all features"
                                            >
                                              +{car.keyFeatures.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="small fw-semibold text-nowrap">{car.km || `${car.kmNumeric?.toLocaleString('en-IN')} km`}</div>
                                    <div className="text-muted text-nowrap" style={{ fontSize: '11px' }}>
                                      {car.fuel} &bull; {car.transmission} &bull; {car.bodyType}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="fw-bold text-dark small text-nowrap">{car.priceFormatted || formatINR(car.price)}</div>
                                    <div className="text-muted text-nowrap" style={{ fontSize: '11px' }}>{car.emi}</div>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleInspection(car)}
                                      className="border-0 bg-transparent p-0 cursor-pointer text-nowrap"
                                      title="Click to toggle inspection status"
                                    >
                                      {car.inspected ? (
                                        <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1 text-nowrap">
                                          <i className="bi bi-shield-check"></i> Certified
                                        </span>
                                      ) : (
                                        <span className="badge bg-secondary-subtle text-secondary border text-nowrap">
                                          Standard
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                  <td>
                                    {(() => {
                                      const isDraft = isCarDraft(car)
                                      const currentStatus = isDraft ? 'Draft' : (car.listingStatus || 'Available')
                                      return (
                                        <div className="dropdown position-relative status-dropdown-container">
                                          <button
                                            className={`btn btn-sm dropdown-toggle py-0 px-2 fw-semibold text-nowrap ${
                                              currentStatus === 'Available' ? 'btn-outline-success' :
                                              currentStatus === 'Reserved' ? 'btn-outline-warning text-dark' :
                                              currentStatus === 'Draft' ? 'btn-outline-warning text-dark' :
                                              'btn-outline-secondary'
                                            }`}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setOpenStatusDropdownCarId(openStatusDropdownCarId === car.id ? null : car.id)
                                            }}
                                            aria-expanded={openStatusDropdownCarId === car.id}
                                            title="Click to change listing status"
                                          >
                                            {currentStatus === 'Draft' ? '📁 Draft' : currentStatus}
                                          </button>

                                          {openStatusDropdownCarId === car.id && (
                                            <div
                                              className="dropdown-menu show shadow-lg border p-1"
                                              style={{
                                                position: 'absolute',
                                                zIndex: 1060,
                                                minWidth: '175px',
                                                top: isNearBottom ? 'auto' : 'calc(100% + 4px)',
                                                bottom: isNearBottom ? 'calc(100% + 4px)' : 'auto',
                                                left: 0,
                                                margin: 0,
                                              }}
                                            >
                                              <div className="px-2 py-1 text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                                                Listing Status
                                              </div>
                                              {LISTING_STATUS_OPTIONS.map((opt) => {
                                                const isCurrent = currentStatus === opt.value
                                                return (
                                                  <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={`dropdown-item d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded small ${
                                                      isCurrent ? 'fw-bold bg-body-secondary' : ''
                                                    }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      if (!isCurrent) {
                                                        handleToggleCarStatus(car, opt.value)
                                                      }
                                                      setOpenStatusDropdownCarId(null)
                                                    }}
                                                    style={{ cursor: 'pointer', fontSize: '12px' }}
                                                  >
                                                    <span className="d-flex align-items-center gap-2">
                                                      <span
                                                        className="rounded-circle d-inline-block flex-shrink-0"
                                                        style={{
                                                          width: '8px',
                                                          height: '8px',
                                                          backgroundColor: opt.dotColor,
                                                        }}
                                                      />
                                                      <span>{opt.label}</span>
                                                      <span
                                                        className={`badge border ms-1 ${opt.badgeClass}`}
                                                        style={{ fontSize: '9.5px', padding: '0.15em 0.45em' }}
                                                      >
                                                        {opt.badgeText}
                                                      </span>
                                                    </span>
                                                    {isCurrent && (
                                                      <i className="bi bi-check2 text-primary ms-2" style={{ fontSize: '14px' }}></i>
                                                    )}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}
                                  </td>
                                  <td className="text-end">
                                    {isCarDraft(car) ? (
                                      <div className="btn-group btn-group-sm">
                                        <button
                                          type="button"
                                          className="btn btn-primary"
                                          onClick={() => handleResumeDraft(car)}
                                          title="Continue Editing Draft"
                                        >
                                          <i className="bi bi-pencil-square me-1"></i>
                                          <span>Resume</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-success"
                                          onClick={() => handlePublishDraft(car)}
                                          title="Publish Draft to Store"
                                        >
                                          <i className="bi bi-check-circle"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger"
                                          onClick={() => {
                                            if (window.confirm(`Discard draft "${car.title || car.make}"?`)) {
                                              handleDiscardDraft(car.id)
                                            }
                                          }}
                                          title="Discard Draft"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="btn-group btn-group-sm">
                                        <button
                                          type="button"
                                          className="btn btn-outline-primary"
                                          onClick={() => handleOpenFeaturesModal(car)}
                                          title="Configure Highlighted Features from Features Bank"
                                        >
                                          <i className="bi bi-stars"></i>
                                          <span className="d-none d-xxl-inline ms-1" style={{ fontSize: '11px' }}>
                                            Features ({car.keyFeatures?.length || 0})
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary"
                                          onClick={() => handleOpenEditCar(car)}
                                          title="Edit vehicle"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger"
                                          onClick={() => handleDeleteCar(car.id, car.title)}
                                          title="Delete from inventory"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="card-footer bg-transparent py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                        <span className="small text-muted">
                          Page {currentPage} of {totalPages}
                        </span>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              &laquo; Prev
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                              Next &raquo;
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Mobile/Card Grid View */}
                    {paginatedCars.length === 0 ? (
                      <div className="card border-0 shadow-sm p-5 text-center text-muted">
                        <i className="bi bi-car-front fs-2 d-block mb-2"></i>
                        No vehicles matched your filter. Click "Reset Factory Cars" to restore.
                      </div>
                    ) : (
                      <div className="row g-3">
                        {paginatedCars.map((car) => (
                          <div key={car.id} className="col-12 col-md-6 col-xl-4">
                            <div className="card h-100 border-0 shadow-sm">
                              <div className="position-relative">
                                <img
                                  src={car.image || '/mock_cars/honda_city_front.jpg'}
                                  alt={car.title}
                                  className="w-100 rounded-top"
                                  style={{ height: '175px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = '/mock_cars/honda_city_front.jpg'
                                  }}
                                />
                                <div className="position-absolute top-0 start-0 m-2">
                                  <input
                                    type="checkbox"
                                    className="form-check-input shadow"
                                    checked={selectedCarIds.includes(car.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedCarIds([...selectedCarIds, car.id])
                                      else setSelectedCarIds(selectedCarIds.filter((i) => i !== car.id))
                                    }}
                                  />
                                </div>
                                <div className="position-absolute top-0 end-0 m-2 status-dropdown-container">
                                  {(() => {
                                    const isDraft = isCarDraft(car)
                                    const currentStatus = isDraft ? 'Draft' : (car.listingStatus || 'Available')
                                    return (
                                      <div className="dropdown position-relative">
                                        <button
                                          type="button"
                                          className={`btn btn-sm dropdown-toggle shadow-sm py-0.5 px-2 fw-semibold ${
                                            currentStatus === 'Available' ? 'btn-success text-white' :
                                            currentStatus === 'Reserved' ? 'btn-warning text-dark' :
                                            currentStatus === 'Draft' ? 'btn-warning text-dark' :
                                            'btn-secondary text-white'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setOpenStatusDropdownCarId(openStatusDropdownCarId === `grid-${car.id}` ? null : `grid-${car.id}`)
                                          }}
                                          title="Click to change listing status"
                                          style={{ fontSize: '11px' }}
                                          aria-expanded={openStatusDropdownCarId === `grid-${car.id}`}
                                        >
                                          {currentStatus === 'Draft' ? '📁 Draft' : currentStatus}
                                        </button>

                                        {openStatusDropdownCarId === `grid-${car.id}` && (
                                          <div
                                            className="dropdown-menu dropdown-menu-end show shadow-lg border p-1"
                                            style={{
                                              position: 'absolute',
                                              zIndex: 1060,
                                              minWidth: '175px',
                                              top: 'calc(100% + 4px)',
                                              right: 0,
                                              left: 'auto',
                                              margin: 0,
                                            }}
                                          >
                                            <div className="px-2 py-1 text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                                              Listing Status
                                            </div>
                                            {LISTING_STATUS_OPTIONS.map((opt) => {
                                              const isCurrent = currentStatus === opt.value
                                              return (
                                                <button
                                                  key={opt.value}
                                                  type="button"
                                                  className={`dropdown-item d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded small ${
                                                    isCurrent ? 'fw-bold bg-body-secondary' : ''
                                                  }`}
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (!isCurrent) {
                                                      handleToggleCarStatus(car, opt.value)
                                                    }
                                                    setOpenStatusDropdownCarId(null)
                                                  }}
                                                  style={{ cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                  <span className="d-flex align-items-center gap-2">
                                                    <span
                                                      className="rounded-circle d-inline-block flex-shrink-0"
                                                      style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        backgroundColor: opt.dotColor,
                                                      }}
                                                    />
                                                    <span>{opt.label}</span>
                                                    <span
                                                      className={`badge border ms-1 ${opt.badgeClass}`}
                                                      style={{ fontSize: '9.5px', padding: '0.15em 0.45em' }}
                                                    >
                                                      {opt.badgeText}
                                                    </span>
                                                  </span>
                                                  {isCurrent && (
                                                    <i className="bi bi-check2 text-primary ms-2" style={{ fontSize: '14px' }}></i>
                                                  )}
                                                </button>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                              <div className="card-body p-3 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="fw-bold small text-truncate pe-2">{car.title}</div>
                                  <div className="fw-bold text-primary small text-nowrap">{car.priceFormatted || formatINR(car.price)}</div>
                                </div>
                                <div className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                                  {car.variant} &bull; {car.year} &bull; {car.location}
                                </div>
                                <div className="d-flex flex-wrap gap-1 mb-3">
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{car.km || `${car.kmNumeric?.toLocaleString('en-IN')} km`}</span>
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{car.fuel}</span>
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{car.transmission}</span>
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '10.5px' }}>{car.bodyType}</span>
                                </div>
                                <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleInspection(car)}
                                    className="border-0 bg-transparent p-0 cursor-pointer"
                                  >
                                    {car.inspected ? (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                                        <i className="bi bi-shield-check"></i> Certified
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '10px' }}>
                                        Standard
                                      </span>
                                    )}
                                  </button>
                                  <div className="btn-group btn-group-sm">
                                    {isCarDraft(car) ? (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-primary py-1 px-2"
                                          onClick={() => handleResumeDraft(car)}
                                          title="Resume Editing Draft"
                                        >
                                          <i className="bi bi-pencil-square me-1"></i>
                                          <span style={{ fontSize: '11px' }}>Resume</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-success py-1 px-2"
                                          onClick={() => handlePublishDraft(car)}
                                          title="Publish to Store"
                                        >
                                          <i className="bi bi-check-circle"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger py-1 px-2"
                                          onClick={() => {
                                            if (window.confirm(`Discard draft "${car.title || car.make}"?`)) {
                                              handleDiscardDraft(car.id)
                                            }
                                          }}
                                          title="Discard"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-outline-primary py-1 px-2"
                                          onClick={() => handleOpenFeaturesModal(car)}
                                          title="Configure Features from Bank"
                                        >
                                          <i className="bi bi-stars"></i>
                                          <span className="ms-1" style={{ fontSize: '10.5px' }}>
                                            {car.keyFeatures?.length || 0}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary py-1 px-2"
                                          onClick={() => handleOpenEditCar(car)}
                                          title="Edit vehicle"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger py-1 px-2"
                                          onClick={() => handleDeleteCar(car.id, car.title)}
                                          title="Delete"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination for Card View */}
                    {totalPages > 1 && (
                      <div className="card-footer bg-transparent py-3 mt-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                        <span className="small text-muted">
                          Page {currentPage} of {totalPages}
                        </span>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              &laquo; Prev
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                              Next &raquo;
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ==========================================================
                TAB: ADD NEW VEHICLE (DEDICATED FRESH PAGE)
            ========================================================== */}
            {activeTab === 'add-car' && (
              <AddVehicleScreen
                key={editingDraft ? editingDraft.id : 'fresh-new-car'}
                initialDraft={editingDraft}
                onCancel={() => {
                  setEditingDraft(null)
                  setActiveTab('inventory')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onSuccess={(newCar) => {
                  setEditingDraft(null)
                  setCars(getStoredCars())
                  setActiveTab('inventory')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  showToast(`Vehicle "${newCar.title}" published to live inventory & customer store!`, 'success')
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'edit-car' && (
              editingVehicleStatus === 'loading' || (editCarId && !editingVehicle && editingVehicleStatus !== 'missing') ? (
                <div className="bg-white border rounded-3 p-5 text-center text-secondary">
                  Loading vehicle details...
                </div>
              ) : editingVehicle ? (
                <AddVehicleScreen
                  key={editingVehicle.id}
                  existingVehicle={editingVehicle}
                  onCancel={() => {
                    if (window.opener) {
                      window.close()
                      return
                    }
                    setActiveTab('inventory')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onSuccess={(updatedCar) => {
                    setCars(getStoredCars())
                    showToast(`Vehicle "${updatedCar.title}" updated.`, 'success')
                    if (window.opener) {
                      window.close()
                      return
                    }
                    setActiveTab('inventory')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  showToast={showToast}
                />
              ) : (
                <div className="bg-white border rounded-3 p-5">
                  <h2 className="h5 fw-bold mb-2">Vehicle not found</h2>
                  <p className="text-secondary mb-3">This listing is no longer in inventory.</p>
                  <button type="button" className="btn btn-dark" onClick={() => setActiveTab('inventory')}>
                    Back to inventory
                  </button>
                </div>
              )
            )}

            {/* ==========================================================
                TAB: DRAFTS FOLDER (SAVED UNPUBLISHED VEHICLES)
            ========================================================== */}
            {activeTab === 'drafts' && (
              <div className="drafts-folder-view">
                <div className="bg-white border-bottom shadow-2xs py-3 px-4 mb-4 rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                  <div>
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-1 small">
                        <li className="breadcrumb-item">
                          <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className="btn btn-link p-0 text-decoration-none text-muted small"
                          >
                            Inventory
                          </button>
                        </li>
                        <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
                          Drafts Folder
                        </li>
                      </ol>
                    </nav>
                    <div className="d-flex align-items-center gap-2">
                      <h1 className="h4 fw-bold mb-0 text-dark">Unpublished Vehicle Drafts</h1>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 small">
                        {kpis.draftsCount} Saved in DB
                      </span>
                    </div>
                    <p className="text-muted small mb-0 mt-1">
                      Work-in-progress vehicle listings safely stored in the database. Resume editing or discard them anytime.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
                    onClick={() => {
                      setEditingDraft(null)
                      setActiveTab('add-car')
                    }}
                  >
                    <i className="bi bi-plus-circle"></i>
                    <span>Create New Listing</span>
                  </button>
                </div>

                {/* Drafts List Grid */}
                {kpis.draftsCount === 0 ? (
                  <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <div className="mb-3">
                      <div
                        className="rounded-circle bg-body-tertiary text-muted d-inline-flex align-items-center justify-content-center"
                        style={{ width: '64px', height: '64px' }}
                      >
                        <i className="bi bi-folder-check fs-2 text-warning"></i>
                      </div>
                    </div>
                    <h5 className="fw-bold mb-1">Your Drafts Folder is Empty</h5>
                    <p className="text-muted small mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
                      When creating vehicles in "Add Vehicle", click "Save as Draft" to save your work in progress here in the database.
                    </p>
                    <div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm px-3"
                        onClick={() => {
                          setEditingDraft(null)
                          setActiveTab('add-car')
                        }}
                      >
                        Add New Vehicle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="row g-3">
                    {cars.filter(isCarDraft).map((draft) => {
                      const coverImg = draft.image || (Array.isArray(draft.gallery) && draft.gallery[0]?.image) || '/mock_cars/honda_city_front.jpg'
                      const keyFeatsCount = Array.isArray(draft.keyFeatures) ? draft.keyFeatures.length : 0
                      const photosCount = Array.isArray(draft.gallery) ? draft.gallery.length : (draft.totalPhotos || 0)

                      return (
                        <div key={draft.id} className="col-12 col-md-6 col-xl-4">
                          <div className="card h-100 border rounded-3 overflow-hidden shadow-2xs hover-border-primary transition-all bg-white">
                            <div className="position-relative bg-light" style={{ height: '180px' }}>
                              <img
                                src={coverImg}
                                alt={draft.title || draft.make}
                                className="w-100 h-100 object-fit-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/mock_cars/honda_city_front.jpg'
                                }}
                              />
                              <span className="position-absolute top-0 start-0 m-2 badge bg-warning text-dark border shadow-xs">
                                📁 Draft Listing
                              </span>
                              {photosCount > 0 && (
                                <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white">
                                  <i className="bi bi-camera me-1"></i>
                                  {photosCount} Photos
                                </span>
                              )}
                            </div>

                            <div className="card-body p-3 d-flex flex-column justify-content-between">
                              <div>
                                <h6 className="fw-bold mb-1 text-truncate" title={draft.title}>
                                  {draft.title || `${draft.year || 2023} ${draft.make} ${draft.model || 'Draft'}`}
                                </h6>
                                <div className="d-flex align-items-center gap-2 small text-muted mb-2">
                                  <span className="fw-bold text-primary">{draft.price ? formatINR(draft.price) : 'Price not set'}</span>
                                  <span>•</span>
                                  <span>{draft.kmNumeric ? `${draft.kmNumeric.toLocaleString('en-IN')} km` : 'Km not set'}</span>
                                  <span>•</span>
                                  <span>{draft.fuel || 'Petrol'}</span>
                                </div>

                                <div className="d-flex align-items-center gap-2 mb-3">
                                  <span className="badge bg-body-secondary text-secondary small">
                                    {draft.bodyType || 'SUV'}
                                  </span>
                                  <span className="badge bg-body-secondary text-secondary small">
                                    {draft.transmission || 'Manual'}
                                  </span>
                                  {keyFeatsCount > 0 && (
                                    <span className="badge bg-primary-subtle text-primary small">
                                      ✨ {keyFeatsCount} Highlights
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-top d-flex align-items-center justify-content-between gap-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => {
                                    if (window.confirm(`Discard draft "${draft.title || draft.make}" permanently?`)) {
                                      handleDiscardDraft(draft.id)
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash me-1"></i>
                                  Discard
                                </button>

                                <div className="d-flex align-items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() => handlePublishDraft(draft)}
                                    title="Publish this draft directly to customer store"
                                  >
                                    <i className="bi bi-check-circle me-1"></i>
                                    Publish
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm shadow-2xs"
                                    onClick={() => handleResumeDraft(draft)}
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    Continue
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==========================================================
                TAB 3: TEST DRIVE APPOINTMENTS
            ========================================================== */}
            {activeTab === 'bookings' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-0 fw-bold">Test Drives</h1>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                      onClick={handleExportTestDrivesCSV}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
                      onClick={() => setNewBookingModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Manual Booking</span>
                    </button>
                  </div>
                </div>

                <div className="card border-0 shadow-sm overflow-hidden">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ minWidth: '880px' }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ minWidth: '90px' }} className="text-nowrap">Ref</th>
                          <th style={{ minWidth: '160px' }} className="text-nowrap">Customer</th>
                          <th style={{ minWidth: '180px' }} className="text-nowrap">Vehicle</th>
                          <th style={{ minWidth: '140px' }} className="text-nowrap">Time Slot</th>
                          <th style={{ minWidth: '180px' }} className="text-nowrap">Location / Address</th>
                          <th style={{ minWidth: '140px' }} className="text-nowrap">Status</th>
                          <th className="text-end text-nowrap" style={{ minWidth: '80px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testDrives.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              No test drive bookings recorded yet.
                            </td>
                          </tr>
                        ) : (
                          testDrives.map((td) => (
                            <tr key={td.id}>
                              <td>
                                <span className="font-monospace fw-bold text-primary small">{td.ref}</span>
                              </td>
                              <td>
                                <div className="fw-bold small">{td.customerName}</div>
                                <a href={`tel:${td.phone}`} className="text-decoration-none small text-muted">
                                  <i className="bi bi-telephone me-1"></i>{td.phone}
                                </a>
                              </td>
                              <td>
                                <div className="fw-semibold small">{td.carTitle}</div>
                                <small className="text-muted">{td.carPrice}</small>
                              </td>
                              <td>
                                <div className="small fw-medium">{td.slot}</div>
                                <small className="text-muted">{td.bookedAt}</small>
                              </td>
                              <td>
                                <span className={`badge ${td.locationType === 'home' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} mb-1`}>
                                  {td.locationType === 'home' ? 'Home Delivery' : 'Tiruppur Hub'}
                                </span>
                                <div className="text-muted text-truncate" style={{ fontSize: '11px', maxWidth: '200px' }}>
                                  {td.address}
                                </div>
                              </td>
                              <td style={{ minWidth: '140px' }}>
                                <CustomSelect
                                  size="sm"
                                  value={td.status}
                                  onChange={(val) => {
                                    updateTestDriveStatus(td.id, val)
                                    updateTestDriveStatusInSupabase(td.id, val).catch((e) => console.warn(e.message))
                                    setTestDrives((prev) => prev.map((item) => item.id === td.id ? { ...item, status: val } : item))
                                    showToast(`Booking ${td.ref} updated to ${val}`)
                                  }}
                                  options={[
                                    { value: 'Pending', label: 'Pending' },
                                    { value: 'Confirmed', label: 'Confirmed' },
                                    { value: 'Completed', label: 'Completed' },
                                    { value: 'Cancelled', label: 'Cancelled' },
                                  ]}
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0 px-2"
                                  onClick={() => {
                                    if (window.confirm(`Delete booking ${td.ref}?`)) {
                                      deleteTestDrive(td.id)
                                      deleteTestDriveFromSupabase(td.id).catch((e) => console.warn(e.message))
                                      setTestDrives((prev) => prev.filter((item) => item.id !== td.id))
                                      showToast(`Removed booking ${td.ref}`)
                                    }
                                  }}
                                  title="Delete booking"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 4: SELL REQUESTS
            ========================================================== */}
            {activeTab === 'sell-requests' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-0 fw-bold">Sell Requests</h1>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                      onClick={() => {
                        const headers = ['Request_ID', 'Reg_Number', 'Vehicle', 'Year', 'KM', 'Customer_Update', 'Phone', 'Status', 'Submitted']
                        const rows = sellRequests.map((sr) => [
                          sr.id,
                          `"${sr.regNumber}"`,
                          `"${sr.carTitle}"`,
                          sr.year,
                          `"${sr.km}"`,
                          `"${sr.estimatedRange}"`,
                          `"${sr.phone}"`,
                          sr.status,
                          `"${sr.submittedAt}"`
                        ])
                        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
                        const link = document.createElement('a')
                        link.href = encodeURI(csv)
                        link.download = `Harsha_cars_Sell_Requests_${new Date().toISOString().slice(0, 10)}.csv`
                        link.click()
                        showToast('Sell requests exported to CSV')
                      }}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="card border-0 shadow-sm overflow-hidden">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ minWidth: '900px' }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ minWidth: '120px' }} className="text-nowrap">ID / Reg No</th>
                          <th style={{ minWidth: '180px' }} className="text-nowrap">Vehicle Spec</th>
                          <th style={{ minWidth: '220px' }} className="text-nowrap">Customer update</th>
                          <th style={{ minWidth: '150px' }} className="text-nowrap">Owner Contact</th>
                          <th style={{ minWidth: '150px' }} className="text-nowrap">Doorstep Inspection</th>
                          <th style={{ minWidth: '150px' }} className="text-nowrap">Status</th>
                          <th className="text-end text-nowrap" style={{ minWidth: '130px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellRequests.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              No vehicle sell requests submitted yet.
                            </td>
                          </tr>
                        ) : (
                          sellRequests.map((sr) => {
                            const photoTotal = Array.isArray(sr.photos)
                              ? sr.photos.filter((photo) => photo?.url).length
                              : 0
                            return (
                            <tr
                              key={sr.id}
                              onClick={() => setSellPhotoPreview(sr)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td>
                                <div className="font-monospace fw-bold text-primary small">{sr.id}</div>
                                <div className="badge bg-dark font-monospace text-uppercase" style={{ fontSize: '11px' }}>
                                  {sr.regNumber}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold small">{sr.carTitle}</div>
                                <small className="text-muted">
                                  {sr.km} &bull; Year {sr.year}
                                </small>
                              </td>
                              <td style={{ whiteSpace: 'normal', minWidth: '220px' }}>
                                <span className="small">
                                  {sr.quoteMessage || sr.estimatedRange}
                                </span>
                                <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
                                  <i className="bi bi-camera me-1"></i>
                                  {photoTotal > 0
                                    ? `${photoTotal} photo${photoTotal === 1 ? '' : 's'}`
                                    : 'No photos'}
                                </div>
                              </td>
                              <td>
                                <div className="small fw-medium">{sr.customerName}</div>
                                <a href={`tel:${sr.phone}`} className="text-decoration-none small text-muted" onClick={(e) => e.stopPropagation()}>
                                  <i className="bi bi-telephone me-1"></i>{sr.phone}
                                </a>
                              </td>
                              <td>
                                <span className="small text-muted">{sr.inspectionScheduled || 'Pending Hub Contact'}</span>
                              </td>
                              <td style={{ minWidth: '160px' }} onClick={(e) => e.stopPropagation()}>
                                <CustomSelect
                                  size="sm"
                                  value={sr.status}
                                  onChange={(val) => {
                                    updateSellRequestStatus(sr.id, val)
                                    updateSellRequestStatusInSupabase(sr.id, val).catch((e) => console.warn(e.message))
                                    setSellRequests((prev) => prev.map((item) => item.id === sr.id ? { ...item, status: val } : item))
                                    showToast(`Sell request ${sr.id} updated to ${val}`)
                                  }}
                                  options={[
                                    { value: 'Under Review', label: 'Under Review' },
                                    { value: 'Inspection Scheduled', label: 'Inspection Scheduled' },
                                    { value: 'Offer Accepted', label: 'Offer Accepted' },
                                    { value: 'Purchased', label: 'Purchased' },
                                    { value: 'Rejected', label: 'Rejected' },
                                  ]}
                                />
                              </td>
                              <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark py-0 px-2 me-1"
                                  onClick={() => setSellPhotoPreview(sr)}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0 px-2"
                                  onClick={() => {
                                    if (window.confirm(`Delete sell request ${sr.id}?`)) {
                                      deleteSellRequest(sr.id)
                                      deleteSellRequestFromSupabase(sr.id).catch((e) => console.warn(e.message))
                                      setSellRequests((prev) => prev.filter((item) => item.id !== sr.id))
                                      if (sellPhotoPreview?.id === sr.id) setSellPhotoPreview(null)
                                      showToast(`Removed request ${sr.id}`)
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {sellPhotoPreview && (
                  <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                    style={{ zIndex: 1080, background: 'rgba(15, 23, 42, 0.72)' }}
                    onClick={() => {
                      setSellPhotoPreview(null)
                      setSellPhotoLightbox(null)
                    }}
                  >
                    <div
                      className="bg-white rounded-3 shadow p-3 p-md-4"
                      style={{ maxWidth: 760, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                          <div className="text-muted small">{sellPhotoPreview.id}</div>
                          <h2 className="h5 fw-bold mb-1">{sellPhotoPreview.carTitle}</h2>
                          <div className="badge bg-dark font-monospace">{sellPhotoPreview.regNumber}</div>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSellPhotoPreview(null); setSellPhotoLightbox(null) }}>
                          Close
                        </button>
                      </div>

                      <div className="row g-3 mb-4">
                        {[
                          ['Year', sellPhotoPreview.year],
                          ['Kilometres', sellPhotoPreview.km],
                          ['Fuel', sellPhotoPreview.fuel],
                          ['Transmission', sellPhotoPreview.transmission],
                          ['Owner', sellPhotoPreview.customerName],
                          ['Phone', sellPhotoPreview.phone],
                          ['City', sellPhotoPreview.city],
                          ['Status', sellPhotoPreview.status],
                          ['Inspection', sellPhotoPreview.inspectionScheduled || 'Pending Hub Contact'],
                          ['Submitted', sellPhotoPreview.submittedAt],
                        ].filter(([, value]) => value).map(([label, value]) => (
                          <div className="col-6 col-md-4" key={label}>
                            <div className="text-muted" style={{ fontSize: 12 }}>{label}</div>
                            <div className="fw-semibold small">{value}</div>
                          </div>
                        ))}
                      </div>

                      {(sellPhotoPreview.quoteMessage || sellPhotoPreview.estimatedRange) && (
                        <p className="small text-secondary mb-4">
                          {sellPhotoPreview.quoteMessage || sellPhotoPreview.estimatedRange}
                        </p>
                      )}

                      <div className="fw-semibold small mb-2">Photos</div>
                      {(sellPhotoPreview.photos || []).filter((photo) => photo?.url).length === 0 ? (
                        <p className="text-muted small mb-0">
                          {sellPhotoPreview.photoCount > 0
                            ? `${sellPhotoPreview.photoCount} photo${sellPhotoPreview.photoCount === 1 ? '' : 's'} ${sellPhotoPreview.photoCount === 1 ? 'was' : 'were'} counted, but the file was not saved with this request.`
                            : 'No photos were saved with this request.'}
                        </p>
                      ) : (
                        <div className="row g-2">
                          {(sellPhotoPreview.photos || []).filter((photo) => photo?.url).map((photo, index) => (
                            <div className="col-4 col-md-3" key={`${photo.slot || photo.name || 'photo'}-${index}`}>
                              <button
                                type="button"
                                className="btn p-0 border rounded w-100 text-start bg-light"
                                onClick={() => setSellPhotoLightbox(photo)}
                              >
                                <span
                                  className="d-flex align-items-center justify-content-center w-100 rounded-top bg-secondary-subtle"
                                  style={{ height: 92 }}
                                >
                                  <img
                                    src={photo.url}
                                    alt={photo.tag || photo.name || `Photo ${index + 1}`}
                                    className="w-100 h-100 rounded-top"
                                    style={{ objectFit: 'contain' }}
                                  />
                                </span>
                                <span className="d-block small text-truncate px-1 py-1">
                                  {photo.tag || photo.name || `Photo ${index + 1}`}
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {sellPhotoLightbox?.url && (
                        <div
                          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
                          style={{ zIndex: 1090, background: 'rgba(0, 0, 0, 0.88)' }}
                          onClick={() => setSellPhotoLightbox(null)}
                        >
                          <button
                            type="button"
                            className="btn btn-light position-absolute top-0 end-0 m-3"
                            onClick={() => setSellPhotoLightbox(null)}
                          >
                            Close
                          </button>
                          <img
                            src={sellPhotoLightbox.url}
                            alt={sellPhotoLightbox.tag || 'Uploaded car photo'}
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '100%', maxHeight: '86vh', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==========================================================
                TAB 5: CUSTOMER LEADS
            ========================================================== */}
            {activeTab === 'leads' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-0 fw-bold">Customer Leads</h1>
                  </div>
                </div>

                <div className="row g-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="col-md-6 col-lg-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge bg-primary-subtle text-primary fw-semibold">
                              {lead.type}
                            </span>
                            <small className="text-muted">{lead.date}</small>
                          </div>
                          <h5 className="card-title fw-bold small mb-1">{lead.carTitle}</h5>
                          <p className="text-muted small mb-2">{lead.customerName}</p>
                          <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                            <span className="badge bg-secondary-subtle text-secondary">
                              {lead.status}
                            </span>
                            <a
                              href={`tel:${lead.phone}`}
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            >
                              <i className="bi bi-telephone"></i>
                              <span>Call {lead.phone}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 5B: CAR REMINDERS & BUYER STOCK ALERTS
            ========================================================== */}
            {activeTab === 'reminders' && (
              <AdminRemindersView
                cars={cars}
                showToast={showToast}
              />
            )}

            {/* ==========================================================
                TAB 6: ANALYTICS (USER SEARCH, FILTERS, SORTS & AI ANALYSIS)
            ========================================================== */}
            {activeTab === 'analytics' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-1 fw-bold d-flex align-items-center gap-2">
                      <i className="bi bi-graph-up-arrow text-primary"></i>
                      <span>Customer Search & Behavior Analytics</span>
                    </h1>
                    <p className="text-muted small mb-0">
                      Live search queries, filter range applications, sort preferences, and wishlist signals saved in the database for AI market intelligence.
                    </p>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <button
                      onClick={loadAnalyticsData}
                      disabled={analyticsLoading}
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-xs"
                      title="Reload latest analytics from database"
                    >
                      <i className={`bi bi-arrow-clockwise ${analyticsLoading ? 'spin-icon' : ''}`}></i>
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={handleGenerateSampleEvents}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 shadow-xs"
                      title="Seed realistic customer search & filter events to verify analytics flow"
                    >
                      <i className="bi bi-lightning-charge"></i>
                      <span>Seed Test Events</span>
                    </button>
                    <button
                      onClick={handleCopyAiSummary}
                      className={`btn btn-sm d-inline-flex align-items-center gap-1 shadow-xs ${
                        aiSummaryCopied ? 'btn-success text-white' : 'btn-dark'
                      }`}
                      title="Copy structured dataset formatted for AI prompt analysis"
                    >
                      <i className={`bi ${aiSummaryCopied ? 'bi-check-lg' : 'bi-robot'}`}></i>
                      <span>{aiSummaryCopied ? 'AI Dataset Copied!' : 'Copy AI Prompt Data'}</span>
                    </button>
                  </div>
                </div>

                {/* AI Readiness Banner */}
                <div className="card border-0 bg-primary-subtle text-primary-emphasis p-3 p-md-4 mb-4 shadow-sm rounded-4">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-center shrink-0" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-cpu fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">AI Demand Analysis Pipeline: Active & Recording</h6>
                        <p className="small mb-0 opacity-75">
                          Every consumer search term, budget/mileage filter slider combination, sort preference, and wishlist bookmark is structured and stored in Supabase with session identifiers. Ready for LLM trend analysis, vehicle inventory acquisition recommendations, and buyer intent prediction.
                        </p>
                      </div>
                    </div>
                    <span className="badge bg-primary text-white px-3 py-2 rounded-pill shrink-0">
                      Schema: public.analytics_events
                    </span>
                  </div>
                </div>

                {/* Analytics Metric KPI Cards */}
                <div className="row g-3 g-md-4 mb-4">
                  <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm p-3 p-md-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small fw-semibold">Search Queries</span>
                        <div className="bg-primary-subtle text-primary p-2 rounded-3">
                          <i className="bi bi-search"></i>
                        </div>
                      </div>
                      <h3 className="fw-bold text-primary mb-1">
                        {analyticsSummary?.totalSearches ?? 0}
                      </h3>
                      <div className="text-muted small">Customer searches</div>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm p-3 p-md-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small fw-semibold">Filters Applied</span>
                        <div className="bg-info-subtle text-info-emphasis p-2 rounded-3">
                          <i className="bi bi-sliders"></i>
                        </div>
                      </div>
                      <h3 className="fw-bold text-info-emphasis mb-1">
                        {analyticsSummary?.totalFilters ?? 0}
                      </h3>
                      <div className="text-muted small">Budget & spec filters</div>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm p-3 p-md-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small fw-semibold">Sort Interactions</span>
                        <div className="bg-warning-subtle text-warning-emphasis p-2 rounded-3">
                          <i className="bi bi-arrow-down-up"></i>
                        </div>
                      </div>
                      <h3 className="fw-bold text-warning-emphasis mb-1">
                        {analyticsSummary?.totalSorts ?? 0}
                      </h3>
                      <div className="text-muted small">Ordering preferences</div>
                    </div>
                  </div>

                  <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm p-3 p-md-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small fw-semibold">Wishlist Adds</span>
                        <div className="bg-danger-subtle text-danger p-2 rounded-3">
                          <i className="bi bi-heart-fill"></i>
                        </div>
                      </div>
                      <h3 className="fw-bold text-danger mb-1">
                        {analyticsSummary?.totalWishlistAdds ?? 0}
                      </h3>
                      <div className="text-muted small">High-intent saves</div>
                    </div>
                  </div>
                </div>

                {/* Insight Grids: Top Searches & Popular Filters */}
                <div className="row g-4 mb-4">
                  {/* Top Search Queries */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-3 p-sm-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <i className="bi bi-search text-primary"></i>
                          <span>Top Searched Terms</span>
                        </h6>
                        <span className="text-muted small">By Frequency</span>
                      </div>
                      {(!analyticsSummary?.topQueries || analyticsSummary.topQueries.length === 0) ? (
                        <div className="text-center py-4 text-muted small">
                          <i className="bi bi-chat-left-dots fs-3 d-block mb-2 opacity-50"></i>
                          No search events recorded yet. Type queries in the customer storefront or click "Seed Test Events" above.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Keyword / Query</th>
                                <th className="text-end">Times Searched</th>
                                <th className="text-end">Popularity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsSummary.topQueries.map((item, idx) => {
                                const maxCount = analyticsSummary.topQueries[0]?.count || 1
                                const pct = Math.round((item.count / maxCount) * 100)
                                return (
                                  <tr key={idx}>
                                    <td className="fw-semibold">
                                      <span className="badge bg-secondary-subtle text-dark font-monospace me-2">#{idx + 1}</span>
                                      <span>"{item.query}"</span>
                                    </td>
                                    <td className="text-end fw-bold">{item.count}</td>
                                    <td className="text-end" style={{ width: '120px' }}>
                                      <div className="progress" style={{ height: '6px' }}>
                                        <div
                                          className="progress-bar bg-primary"
                                          role="progressbar"
                                          style={{ width: `${pct}%` }}
                                        ></div>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Most Wishlisted Cars */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-3 p-sm-4 h-100 rounded-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                          <i className="bi bi-heart-fill text-danger"></i>
                          <span>Most Wishlisted Vehicles</span>
                        </h6>
                        <span className="text-muted small">Customer Favorites</span>
                      </div>
                      {(!analyticsSummary?.topWishlisted || analyticsSummary.topWishlisted.length === 0) ? (
                        <div className="text-center py-4 text-muted small">
                          <i className="bi bi-heart fs-3 d-block mb-2 opacity-50 text-danger"></i>
                          No wishlist events recorded yet. Click the heart icon on any vehicle card in the storefront to save.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Vehicle Title</th>
                                <th className="text-end">Wishlist Saves</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticsSummary.topWishlisted.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="fw-semibold text-truncate" style={{ maxWidth: '280px' }}>
                                    <i className="bi bi-star-fill text-warning me-2 small"></i>
                                    {item.title}
                                  </td>
                                  <td className="text-end">
                                    <span className="badge bg-danger-subtle text-danger fw-bold px-2 py-1">
                                      <i className="bi bi-heart-fill me-1"></i>
                                      {item.count} {item.count === 1 ? 'save' : 'saves'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Analytics Event Log Table */}
                <div className="card border-0 shadow-sm p-3 p-sm-4 rounded-4 mb-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
                    <div>
                      <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-activity text-success"></i>
                        <span>Live Analytics Event Stream</span>
                      </h6>
                      <p className="text-muted small mb-0">
                        Inspecting real-time payloads saved to Supabase (searches, applied filter thresholds, sorts, wishlist actions)
                      </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="btn-group btn-group-sm">
                      {['all', 'search', 'filter', 'sort', 'wishlist_add', 'wishlist_remove', 'car_view'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setAnalyticsFilterType(type)}
                          className={`btn ${
                            analyticsFilterType === type ? 'btn-primary' : 'btn-outline-secondary'
                          }`}
                        >
                          {type === 'all'
                            ? 'All'
                            : type === 'wishlist_add'
                            ? 'Wishlist+'
                            : type === 'wishlist_remove'
                            ? 'Wishlist-'
                            : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {analyticsEvents.length === 0 ? (
                    <div className="text-center py-5 text-muted small">
                      <i className="bi bi-database-check fs-2 d-block mb-2 text-primary opacity-50"></i>
                      <span>No events recorded in buffer yet.</span>
                      <div className="mt-2">
                        <button
                          onClick={handleGenerateSampleEvents}
                          className="btn btn-sm btn-primary"
                        >
                          Seed Sample Events
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Query / Parameters</th>
                            <th>Results</th>
                            <th>Screen & Device</th>
                            <th>Session / User</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsEvents
                            .filter((e) => analyticsFilterType === 'all' || e.event_type === analyticsFilterType)
                            .slice(0, 30)
                            .map((evt) => {
                              const badgeClass =
                                evt.event_type === 'search'
                                  ? 'bg-primary text-white'
                                  : evt.event_type === 'filter'
                                  ? 'bg-info text-white'
                                  : evt.event_type === 'sort'
                                  ? 'bg-warning text-dark'
                                  : evt.event_type === 'wishlist_add'
                                  ? 'bg-danger text-white'
                                  : evt.event_type === 'wishlist_remove'
                                  ? 'bg-secondary text-white'
                                  : 'bg-success text-white'

                              let detailsText = ''
                              if (evt.event_type === 'search') {
                                detailsText = `"${evt.search_query}"`
                              } else if (evt.event_type === 'filter') {
                                const f = evt.filters || {}
                                const parts = []
                                if (f.minBudget > 200000 || f.maxBudget < 3500000) {
                                  parts.push(`₹ ${(f.minBudget / 100000).toFixed(1)}L - ${(f.maxBudget / 100000).toFixed(1)}L`)
                                }
                                if (f.fuel && f.fuel !== 'All Fuels') parts.push(f.fuel)
                                if (f.bodyType && f.bodyType !== 'all') parts.push(f.bodyType)
                                if (f.transmission && f.transmission !== 'all') parts.push(f.transmission)
                                if (f.makes && f.makes.length > 0) parts.push(`Makes: ${f.makes.join(', ')}`)
                                detailsText = parts.length > 0 ? parts.join(' · ') : 'Default Ranges'
                              } else if (evt.event_type === 'sort') {
                                detailsText = `Sorted by: ${evt.sort_by}`
                              } else if (evt.event_type === 'wishlist_add' || evt.event_type === 'wishlist_remove') {
                                detailsText = evt.car_details?.title || evt.car_id || 'Car ID ' + evt.car_id
                              } else if (evt.event_type === 'car_view') {
                                detailsText = evt.car_details?.title || evt.car_id || 'View Details'
                              }

                              const timeStr = evt.created_at
                                ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                : 'Just now'

                              return (
                                <tr key={evt.id || Math.random()}>
                                  <td>
                                    <span className={`badge ${badgeClass} text-uppercase font-monospace`} style={{ fontSize: '10px' }}>
                                      {evt.event_type}
                                    </span>
                                  </td>
                                  <td className="fw-semibold text-truncate" style={{ maxWidth: '300px' }} title={detailsText}>
                                    {detailsText}
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border">
                                      {evt.results_count ?? 0} {evt.results_count === 1 ? 'match' : 'matches'}
                                    </span>
                                  </td>
                                  <td className="small text-muted">
                                    <span className="badge bg-secondary-subtle text-secondary me-1">
                                      {evt.metadata?.screen || 'storefront'}
                                    </span>
                                    <span>{evt.metadata?.device || 'desktop'}</span>
                                  </td>
                                  <td className="small text-muted font-monospace" style={{ maxWidth: '140px' }} title={evt.user_email || evt.session_id}>
                                    {evt.user_email || (evt.session_id ? evt.session_id.substring(0, 10) + '...' : 'anon')}
                                  </td>
                                  <td className="small text-muted text-nowrap">
                                    {timeStr}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Legacy Holding & Pricing KPI Card */}
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center rounded-4">
                      <div className="text-muted small fw-semibold mb-1">Avg. Holding Period</div>
                      <h2 className="fw-bold text-primary mb-0">16.4 Days</h2>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center rounded-4">
                      <div className="text-muted small fw-semibold mb-1">Conversion Rate</div>
                      <h2 className="fw-bold text-success mb-0">38.2%</h2>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center rounded-4">
                      <div className="text-muted small fw-semibold mb-1">Average Vehicle Price</div>
                      <h2 className="fw-bold text-dark mb-0">{kpis.avgPriceFormatted}</h2>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm p-3 p-sm-4 rounded-4">
                  <h5 className="fw-bold small mb-3">Top Requested Vehicles</h5>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Vehicle</th>
                          <th>Body Type</th>
                          <th>Price</th>
                          <th>Bookings</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cars.slice(0, 5).map((car) => {
                          const bookingsCount = testDrives.filter(
                            (td) => td.carId === car.id || td.carTitle?.toLowerCase().includes(car.model?.toLowerCase())
                          ).length
                          return (
                            <tr key={car.id}>
                              <td className="fw-semibold">{car.title}</td>
                              <td>{car.bodyType}</td>
                              <td>{car.priceFormatted || formatINR(car.price)}</td>
                              <td>{bookingsCount}</td>
                              <td>
                                <span className={`badge ${
                                  (car.listingStatus || 'Available') === 'Available' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                                }`}>
                                  {car.listingStatus || 'Available'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 7: SETTINGS
            ========================================================== */}
            {activeTab === 'hero' && (
              <HeroPageEditor cars={cars} onToggleHero={handleToggleHero} />
            )}

            {activeTab === 'settings' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h4 mb-0 fw-bold">Settings</h1>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4">
                      <h4 className="fw-bold small mb-3">Showroom Location & Contact</h4>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Primary Hub Name</label>
                        <input type="text" className="form-control form-control-sm" readOnly value={BRAND_NAME} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Hub Address (Tiruppur)</label>
                        <textarea className="form-control form-control-sm" rows="2" readOnly value="14, Avinashi Main Road, Gandhi Nagar, Tiruppur, Tamil Nadu - 641603" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Concierge Phone Line</label>
                        <input type="text" className="form-control form-control-sm" readOnly value="+91 94882 12044" />
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4">
                      <h4 className="fw-bold small mb-3">Data Management</h4>
                      <div className="p-3 bg-light rounded border mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold">Cars in Storage:</span>
                          <span className="badge bg-primary">{cars.length}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold">Test Drives Logged:</span>
                          <span className="badge bg-success">{testDrives.length}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="small fw-semibold">Sell Requests Logged:</span>
                          <span className="badge bg-warning text-dark">{sellRequests.length}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={handleResetCars}
                      >
                        <i className="bi bi-arrow-counterclockwise me-1.5"></i>
                        Reset All Cars to Defaults
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="admin-footer border-top bg-body py-3 px-4">
          <div className="small text-muted">
            &copy; 2026 <strong>{BRAND_NAME}</strong>
          </div>
        </footer>

      </div>

      {/* ==============================================================
          MODALS
      ============================================================== */}

      {/* 3. Dedicated Features Bank Modal */}
      {featuresModalOpen && managingCarFeatures && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-stars text-warning"></i>
                    <span>Configure Highlighted Features</span>
                  </h5>
                  <small className="text-muted">
                    Selecting top highlights for <strong>{managingCarFeatures.title}</strong>
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setFeaturesModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <FeaturesSelector
                  selectedFeatures={managingCarFeatures.keyFeatures || []}
                  onChange={(feats) => setManagingCarFeatures({ ...managingCarFeatures, keyFeatures: feats })}
                  maxHighlights={8}
                />
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setFeaturesModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleSaveFeaturesModal(managingCarFeatures.keyFeatures || [])}
                >
                  <i className="bi bi-check-lg me-1"></i> Save Features to Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manual New Booking Quick Modal */}
      {newBookingModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Customer Test Drive</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setNewBookingModalOpen(false)}
                ></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const selectedCarObj = cars.find((c) => c.id === newBookingForm.carId) || cars[0]
                  addTestDrive({
                    carId: selectedCarObj.id,
                    carTitle: selectedCarObj.title,
                    carPrice: selectedCarObj.priceFormatted,
                    carImage: selectedCarObj.image,
                    customerName: newBookingForm.customerName || 'Walk-in Customer',
                    phone: newBookingForm.phone || '98421 00000',
                    slot: newBookingForm.slot,
                    locationType: newBookingForm.locationType,
                    address: newBookingForm.address
                  })
                  setNewBookingModalOpen(false)
                  showToast('Test drive appointment scheduled')
                }}
              >
                <div className="modal-body p-4 space-y-3">
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Select Vehicle</label>
                    <CustomSelect
                      size="sm"
                      value={newBookingForm.carId}
                      onChange={(val) => setNewBookingForm({ ...newBookingForm, carId: val })}
                      options={cars.map((c) => ({ value: c.id, label: `${c.title} (${c.priceFormatted})` }))}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-control form-control-sm"
                      placeholder="e.g. Suresh Kumar"
                      value={newBookingForm.customerName}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      className="form-control form-control-sm"
                      placeholder="e.g. 98421 54321"
                      value={newBookingForm.phone}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Time Slot</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newBookingForm.slot}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, slot: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Test Drive Type</label>
                    <CustomSelect
                      size="sm"
                      value={newBookingForm.locationType}
                      onChange={(val) => setNewBookingForm({ ...newBookingForm, locationType: val })}
                      options={[
                        { value: 'home', label: 'Home Doorstep' },
                        { value: 'hub', label: 'Tiruppur Hub Visit' },
                      ]}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setNewBookingModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Create Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dedicated Record Vehicle Sale Modal */}
      <RecordSaleModal
        isOpen={Boolean(saleModalCar)}
        car={saleModalCar}
        onClose={() => setSaleModalCar(null)}
        onConfirm={(saleData) => handleConfirmSale(saleModalCar, saleData)}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
          <div className="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <i className={`bi ${toastMessage.type === 'error' ? 'bi-exclamation-circle-fill text-warning' : 'bi-check-circle-fill text-success'}`}></i>
                <span>{toastMessage.msg}</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-app {
          --bs-body-font-size: 1rem;
          background-color: var(--bs-tertiary-bg, #f8fafc);
          color: var(--bs-body-color, #0f172a);
          font-size: 16px;
          min-height: 100vh;
          width: 100%;
          overflow-x: clip;
        }
        .sales-overview-title {
          font-size: 1.75rem;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .sales-overview-sub {
          margin: 0.2rem 0 0;
          color: var(--bs-secondary-color, #71717a);
          font-size: 1rem;
        }
        .sales-range {
          margin-bottom: 1rem;
        }
        .sales-range-track {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          overflow-x: auto;
          border: 1px solid var(--bs-border-color, #e4e4e7);
          border-radius: 14px;
          background: linear-gradient(180deg, var(--bs-body-bg, #fff), var(--bs-tertiary-bg, #f4f4f5));
        }
        .sales-range-track button,
        .sales-segment button,
        .sales-quiet-btn,
        .sales-chart-xaxis button {
          border: 0;
          background: transparent;
          color: var(--bs-body-color, #18181b);
          font-size: 0.9375rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          border-radius: 10px;
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease, color 160ms ease;
        }
        .sales-range-track button {
          padding: 0.55rem 0.9rem;
        }
        .sales-range-track button.is-active,
        .sales-segment button.is-active {
          background: linear-gradient(180deg, color-mix(in srgb, var(--bs-body-color, #18181b) 88%, white), var(--bs-body-color, #18181b));
          color: var(--bs-body-bg, #fff);
        }
        .sales-range-track button:active,
        .sales-segment button:active,
        .sales-quiet-btn:active {
          transform: scale(0.97);
        }
        .sales-range-custom {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .sales-range-custom label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--bs-secondary-color, #52525b);
        }
        .sales-range-custom input {
          height: 2.5rem;
          border: 1px solid var(--bs-border-color, #d4d4d8);
          border-radius: 10px;
          background: var(--bs-body-bg, #fff);
          color: var(--bs-body-color, #18181b);
          font-size: 1rem;
          padding: 0 0.75rem;
        }
        .sales-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .sales-kpi {
          padding: 1.05rem 1.15rem 1rem;
          border: 1px solid var(--bs-border-color, #e4e4e7);
          border-radius: 16px;
          background: linear-gradient(180deg, var(--bs-body-bg, #fff), var(--bs-tertiary-bg, #f4f4f5));
        }
        .sales-kpi p,
        .sales-panel-note,
        .sales-chart-summary span,
        .sales-mix-list p,
        .sales-model-table td span {
          margin: 0;
          color: var(--bs-secondary-color, #71717a);
          font-size: 0.9375rem;
        }
        .sales-kpi strong {
          display: block;
          margin: 0.2rem 0 0.15rem;
          font-size: 1.75rem;
          line-height: 1.15;
          letter-spacing: -0.03em;
          font-weight: 700;
        }
        .sales-kpi span,
        .sales-chart-summary strong {
          font-size: 1rem;
        }
        .sales-panel-head,
        .sales-panel-body {
          padding: 1.1rem 1.2rem;
        }
        .sales-panel-body {
          padding-top: 0.35rem;
        }
        .sales-panel-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .sales-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .sales-chart-tools,
        .sales-segment {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .sales-segment {
          padding: 0.2rem;
          border-radius: 12px;
          background: var(--bs-secondary-bg, #f4f4f5);
        }
        .sales-segment button,
        .sales-quiet-btn {
          padding: 0.45rem 0.75rem;
        }
        .sales-quiet-btn {
          border: 1px solid var(--bs-border-color, #d4d4d8);
          background: var(--bs-body-bg, #fff);
        }
        .sales-chart-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          padding-bottom: 0.85rem;
          margin-bottom: 0.85rem;
          border-bottom: 1px solid var(--bs-border-color, #ececef);
        }
        .sales-chart-summary strong {
          display: block;
          margin-top: 0.15rem;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
        }
        .sales-chart {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.6rem;
          min-height: 230px;
        }
        .sales-chart-yaxis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 3.2rem;
          padding: 0.35rem 0 0.7rem;
          color: var(--bs-secondary-color, #71717a);
          font-size: 0.875rem;
          font-variant-numeric: tabular-nums;
        }
        .sales-chart-plot {
          position: relative;
          color: var(--bs-body-color, #18181b);
          min-height: 220px;
        }
        .sales-chart-plot svg {
          width: 100%;
          height: 220px;
          display: block;
        }
        .sales-chart-value {
          position: absolute;
          transform: translate(-50%, -140%);
          font-size: 0.8125rem;
          font-weight: 700;
          pointer-events: none;
          white-space: nowrap;
        }
        .sales-chart-tip {
          position: absolute;
          top: 0;
          transform: translateX(-50%);
          min-width: 9rem;
          padding: 0.55rem 0.7rem;
          border-radius: 12px;
          background: var(--bs-body-color, #18181b);
          color: var(--bs-body-bg, #fff);
          font-size: 0.875rem;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .sales-chart-empty,
        .sales-empty {
          margin: 0.75rem 0 0;
          color: var(--bs-secondary-color, #71717a);
          font-size: 1rem;
        }
        .sales-chart-empty {
          position: absolute;
          left: 0;
          right: 0;
          top: 42%;
          text-align: center;
        }
        .sales-chart-xaxis {
          display: flex;
          justify-content: space-between;
          gap: 0.25rem;
          margin-top: 0.35rem;
        }
        .sales-chart-xaxis button {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--bs-secondary-color, #71717a);
          padding: 0.15rem;
        }
        .sales-chart-xaxis button.is-active {
          color: var(--bs-body-color, #18181b);
        }
        .sales-mix-bar,
        .sales-mix-track {
          display: flex;
          overflow: hidden;
          height: 0.55rem;
          border-radius: 999px;
          background: var(--bs-secondary-bg, #ececef);
        }
        .sales-mix-bar span,
        .sales-mix-track span,
        .sales-model-meter i b {
          display: block;
          height: 100%;
          background: var(--bs-body-color, #18181b);
        }
        .sales-mix-list {
          list-style: none;
          margin: 1rem 0 0;
          padding: 0;
        }
        .sales-mix-list li + li {
          margin-top: 0.9rem;
        }
        .sales-mix-row {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 1rem;
          margin-bottom: 0.35rem;
        }
        .sales-mix-name {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 700;
        }
        .sales-mix-name i {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 999px;
          background: var(--bs-body-color, #18181b);
        }
        .sales-mix-track {
          height: 0.4rem;
        }
        .sales-mix-list p {
          margin-top: 0.3rem;
        }
        .sales-model-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1rem;
        }
        .sales-model-table th {
          text-align: left;
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--bs-secondary-color, #71717a);
          padding: 0 0.75rem 0.65rem 0;
        }
        .sales-model-table td {
          padding: 0.75rem 0.75rem 0.75rem 0;
          border-top: 1px solid var(--bs-border-color, #ececef);
          vertical-align: middle;
        }
        .sales-model-table td strong,
        .sales-model-table td span {
          display: block;
        }
        .sales-model-meter span {
          font-weight: 700;
          margin-bottom: 0.3rem;
        }
        .sales-model-meter i {
          display: block;
          height: 0.4rem;
          border-radius: 999px;
          background: var(--bs-secondary-bg, #ececef);
          overflow: hidden;
        }
        .sales-activity-table {
          font-size: 1rem;
        }
        .sales-activity-table .badge,
        .admin-main .card .h5 {
          font-size: 0.95rem;
        }
        @media (max-width: 991px) {
          .sales-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 575px) {
          .sales-kpis,
          .sales-chart-summary {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sales-range-track button,
          .sales-segment button,
          .sales-quiet-btn {
            transition: background-color 160ms ease, color 160ms ease;
          }
        }
        .admin-main {
          min-width: 0;
          overflow-x: clip;
        }
        .admin-header .hamburger-menu {
          position: static !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
        }
        .admin-wrapper.sidebar-collapsed .admin-sidebar .sidebar-hide-collapsed {
          display: none !important;
        }
        .admin-wrapper.sidebar-collapsed .admin-sidebar .sidebar-bottom-btn span {
          display: none;
        }
        .admin-sidebar .nav-link:not(.active) {
          background-color: transparent;
          color: var(--bs-body-color);
        }
        .admin-sidebar .nav-link:not(.active):hover {
          background-color: var(--bs-secondary-bg, #f1f5f9);
        }
        .admin-sidebar .sidebar-nav .nav .nav-link.active {
          background: linear-gradient(
            90deg,
            rgba(24, 24, 27, 0.1) 0%,
            rgba(148, 163, 184, 0.22) 55%,
            rgba(248, 250, 252, 0.9) 100%
          );
          color: #0f172a;
          font-weight: 600;
          box-shadow: inset 3px 0 0 #18181b;
        }
        .admin-sidebar .sidebar-nav .nav .nav-link.active::before {
          display: none;
        }
        .admin-sidebar .sidebar-nav .nav .nav-link.active i {
          color: #18181b;
        }
        .admin-sidebar .sidebar-nav .nav .nav-link.active:hover {
          background: linear-gradient(
            90deg,
            rgba(24, 24, 27, 0.12) 0%,
            rgba(148, 163, 184, 0.26) 55%,
            rgba(248, 250, 252, 0.95) 100%
          );
          color: #0f172a;
        }
        [data-bs-theme='dark'] .admin-sidebar .sidebar-nav .nav .nav-link.active {
          background: linear-gradient(
            90deg,
            rgba(248, 250, 252, 0.08) 0%,
            rgba(148, 163, 184, 0.18) 55%,
            rgba(15, 23, 42, 0.85) 100%
          );
          color: #f8fafc;
          box-shadow: inset 3px 0 0 #e2e8f0;
        }
        [data-bs-theme='dark'] .admin-sidebar .sidebar-nav .nav .nav-link.active i {
          color: #f1f5f9;
        }
        [data-bs-theme='dark'] .admin-sidebar .sidebar-nav .nav .nav-link.active:hover {
          background: linear-gradient(
            90deg,
            rgba(248, 250, 252, 0.1) 0%,
            rgba(148, 163, 184, 0.22) 55%,
            rgba(15, 23, 42, 0.9) 100%
          );
          color: #f8fafc;
        }
        .hover-bg-light:hover {
          background-color: var(--bs-tertiary-bg, #f8f9fa);
        }
        /* Mobile-safe tables & scrollbars */
        .table-responsive {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .table-responsive::-webkit-scrollbar {
          height: 6px;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 9999px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: transparent;
        }
        /* Ensure table cells do not collapse content inappropriately */
        .table > :not(caption) > * > * {
          padding: 0.65rem 0.75rem;
        }
      `}</style>

    </div>
  )
}

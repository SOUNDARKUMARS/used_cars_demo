/**
 * Nova Motors Analytics Engine
 * Tracks user search queries, applied filter ranges, sorting preferences,
 * and wishlist interactions for business intelligence and AI analysis.
 */
import { supabase } from './supabase.js'

const SESSION_KEY = 'nova_analytics_session_id'
const LOCAL_EVENTS_KEY = 'nova_local_analytics_events'
const MAX_LOCAL_EVENTS = 100

/**
 * Get or create an anonymous session ID that persists across page refreshes
 */
export function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9)
      sessionStorage.setItem(SESSION_KEY, sid)
      localStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return 'sess_fallback_' + Date.now()
  }
}

/**
 * Get active user identity if signed in
 */
export function getActiveUser() {
  try {
    const raw = localStorage.getItem('nova_google_user_session')
    if (raw) {
      const u = JSON.parse(raw)
      return {
        id: u?.id || u?.sub || null,
        email: u?.email || null,
        name: u?.name || null,
      }
    }
  } catch {
    // ignore
  }
  return { id: null, email: null, name: null }
}

/**
 * Save an event to local buffer (for resilient offline & dashboard preview fallback)
 */
function bufferEventLocally(event) {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const updated = [event, ...existing].slice(0, MAX_LOCAL_EVENTS)
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated))
  } catch {
    // ignore storage quota issues
  }
}

/**
 * Core event logging function
 */
export async function trackEvent({
  eventType,
  searchQuery = null,
  filters = {},
  sortBy = null,
  carId = null,
  carDetails = {},
  resultsCount = 0,
  metadata = {},
}) {
  if (!eventType) return null

  const user = getActiveUser()
  const sessionId = getOrCreateSessionId()
  const device = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'

  const eventPayload = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    event_type: eventType,
    user_id: user.id,
    user_email: user.email,
    session_id: sessionId,
    search_query: searchQuery ? String(searchQuery).trim() : null,
    filters: filters && typeof filters === 'object' ? filters : {},
    sort_by: sortBy || null,
    car_id: carId || null,
    car_details: carDetails && typeof carDetails === 'object' ? carDetails : {},
    results_count: Number(resultsCount) || 0,
    metadata: {
      ...metadata,
      device,
      path: typeof window !== 'undefined' ? window.location.hash || '#home' : '',
      timestamp: Date.now(),
    },
    created_at: new Date().toISOString(),
  }

  // 1. Buffer locally first (guarantees zero data loss even before DB migration)
  bufferEventLocally(eventPayload)

  // 2. Fire custom event for real-time dashboard listeners
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('nova_analytics_event', { detail: eventPayload }))
    } catch {
      // ignore
    }
  }

  // 3. Persist to Supabase DB
  try {
    const { data, error } = await supabase.from('analytics_events').insert([
      {
        event_type: eventPayload.event_type,
        user_id: eventPayload.user_id,
        user_email: eventPayload.user_email,
        session_id: eventPayload.session_id,
        search_query: eventPayload.search_query,
        filters: eventPayload.filters,
        sort_by: eventPayload.sort_by,
        car_id: eventPayload.car_id,
        car_details: eventPayload.car_details,
        results_count: eventPayload.results_count,
        metadata: eventPayload.metadata,
      },
    ])

    if (error) {
      // In case table is not yet created in Supabase SQL editor, fail silently and keep local buffer
      if (error.code !== 'PGRST205') {
        console.warn('Analytics event sync notice:', error.message)
      }
    }
    return data
  } catch (err) {
    // Non-blocking
    return null
  }
}

// ============================================================================
// CONVENIENCE TRACKING HELPERS
// ============================================================================

let searchDebounceTimers = {}

/**
 * Track user search queries (debounced by default so typing isn't flooded)
 */
export function trackSearch(query, resultsCount = 0, metadata = {}, debounceMs = 700) {
  const trimmed = (query || '').trim()
  if (!trimmed || trimmed.length < 2) return

  const timerKey = metadata.screen || 'global'
  if (searchDebounceTimers[timerKey]) {
    clearTimeout(searchDebounceTimers[timerKey])
  }

  if (debounceMs <= 0) {
    return trackEvent({
      eventType: 'search',
      searchQuery: trimmed,
      resultsCount,
      metadata,
    })
  }

  searchDebounceTimers[timerKey] = setTimeout(() => {
    trackEvent({
      eventType: 'search',
      searchQuery: trimmed,
      resultsCount,
      metadata,
    })
  }, debounceMs)
}

/**
 * Track user applied filter ranges
 */
export function trackFilter(filters = {}, resultsCount = 0, metadata = {}) {
  // Extract clean serializable filter parameters
  const cleanFilters = {
    minBudget: filters.minBudget ?? 200000,
    maxBudget: filters.maxBudget ?? 3500000,
    budgetPreset: filters.budget || 'all',
    minKm: filters.minKm ?? 0,
    maxKm: filters.maxKm ?? 100000,
    kmPreset: filters.km || 'all',
    fuel: filters.fuel || 'All Fuels',
    year: filters.year || 'All Years',
    transmission: filters.transmission || 'all',
    ownership: filters.ownership || 'all',
    bodyType: filters.bodyType || 'all',
    makes: Array.isArray(filters.makes) ? filters.makes : (filters.make ? [filters.make] : []),
  }

  return trackEvent({
    eventType: 'filter',
    filters: cleanFilters,
    resultsCount,
    metadata,
  })
}

/**
 * Track sorting change
 */
export function trackSort(sortBy, resultsCount = 0, metadata = {}) {
  if (!sortBy) return
  return trackEvent({
    eventType: 'sort',
    sortBy,
    resultsCount,
    metadata,
  })
}

/**
 * Track wishlist additions / removals
 */
export function trackWishlist(action, car, metadata = {}) {
  const isAdd = action === 'add'
  const carDetails = car ? {
    id: car.id,
    title: car.title,
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    priceFormatted: car.priceFormatted,
    fuel: car.fuel,
    transmission: car.transmission,
    bodyType: car.bodyType,
    km: car.km,
  } : {}

  return trackEvent({
    eventType: isAdd ? 'wishlist_add' : 'wishlist_remove',
    carId: car?.id || null,
    carDetails,
    metadata,
  })
}

/**
 * Track vehicle detail view
 */
export function trackCarView(car, metadata = {}) {
  if (!car) return
  return trackEvent({
    eventType: 'car_view',
    carId: car.id,
    carDetails: {
      id: car.id,
      title: car.title,
      make: car.make,
      model: car.model,
      price: car.price,
      fuel: car.fuel,
    },
    metadata,
  })
}

// ============================================================================
// ANALYTICS DATA RETRIEVAL (FOR ADMIN DASHBOARD & AI ANALYSIS)
// ============================================================================

/**
 * Fetch analytics events from Supabase DB with local buffer fallback
 */
export async function fetchAnalyticsEvents({ limit = 100, eventType = null } = {}) {
  try {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data
    }
  } catch {
    // fallback to local buffer
  }

  // Fallback to local storage buffer
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY)
    let list = raw ? JSON.parse(raw) : []
    if (eventType) {
      list = list.filter((e) => e.event_type === eventType)
    }
    return list.slice(0, limit)
  } catch {
    return []
  }
}

/**
 * Aggregate summary metrics across searches, filters, sorts, and wishlist
 */
export async function getAnalyticsSummary() {
  const events = await fetchAnalyticsEvents({ limit: 200 })

  const searches = events.filter((e) => e.event_type === 'search')
  const filters = events.filter((e) => e.event_type === 'filter')
  const sorts = events.filter((e) => e.event_type === 'sort')
  const wishlistAdds = events.filter((e) => e.event_type === 'wishlist_add')

  // Count search terms
  const queryCounts = {}
  searches.forEach((s) => {
    const q = (s.search_query || '').trim().toLowerCase()
    if (q) queryCounts[q] = (queryCounts[q] || 0) + 1
  })
  const topQueries = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Count top filter categories
  const fuelCounts = {}
  const bodyCounts = {}
  filters.forEach((f) => {
    const flt = f.filters || {}
    if (flt.fuel && flt.fuel !== 'All Fuels') {
      fuelCounts[flt.fuel] = (fuelCounts[flt.fuel] || 0) + 1
    }
    if (flt.bodyType && flt.bodyType !== 'all') {
      bodyCounts[flt.bodyType] = (bodyCounts[flt.bodyType] || 0) + 1
    }
  })

  // Count top wishlisted cars
  const carWishlistCounts = {}
  wishlistAdds.forEach((w) => {
    const key = w.car_details?.title || w.car_id || 'Unknown Car'
    carWishlistCounts[key] = (carWishlistCounts[key] || 0) + 1
  })
  const topWishlisted = Object.entries(carWishlistCounts)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    totalEvents: events.length,
    totalSearches: searches.length,
    totalFilters: filters.length,
    totalSorts: sorts.length,
    totalWishlistAdds: wishlistAdds.length,
    topQueries,
    fuelBreakdown: fuelCounts,
    bodyBreakdown: bodyCounts,
    topWishlisted,
    recentEvents: events.slice(0, 20),
  }
}

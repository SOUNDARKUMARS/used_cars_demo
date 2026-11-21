import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Filter,
  ShieldCheck,
  Heart,
  ChevronLeft,
  X,
  ArrowRight,
  Check,
  Car,
  ArrowUpDown,
  Bell,
} from 'lucide-react'
import { trackSearch, trackFilter, trackSort } from '../lib/analytics'
import { emiBuyerLabel } from '../data/carStorage'
import CarCardImageSpecs from './CarCardImageSpecs'

export default function CarsCatalogueScreen({
  cars = [],
  onSelectCar,
  onBookTestDrive,
  onToggleWishlist,
  wishlist = [],
  onBack,
  onOpenFilter,
  filters = {},
  setFilters,
  onOpenCarAlert,
}) {
  const [query, setQuery] = useState('')
  const [selectedMakes, setSelectedMakes] = useState([])
  const [sortBy, setSortBy] = useState('featured')

  const publishedCars = useMemo(() => {
    return (cars || []).filter(
      (c) =>
        c.listingStatus === 'Available' ||
        c.listingStatus === 'Sold' ||
        c.listingStatus === 'Reserved' ||
        (!c.isDraft && c.listingStatus !== 'Draft')
    )
  }, [cars])

  const makes = ['Honda', 'Hyundai', 'Mahindra', 'Tata', 'BMW', 'Mercedes-Benz', 'Toyota']

  const handleToggleMake = (m) => {
    setSelectedMakes((prev) => {
      const next = prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
      trackFilter({ ...filters, makes: next }, cars.length, { screen: 'catalogue', source: 'make_pill' })
      return next
    })
  }

  const handleResetMakes = () => {
    setSelectedMakes([])
    trackFilter({ ...filters, makes: [] }, cars.length, { screen: 'catalogue', source: 'reset_makes' })
  }

  const filtered = cars.filter((c) => {
    // Exclude unpublished drafts from live customer catalogue
    const isDraft = Boolean(
      (c.listingStatus === 'Draft' || c.isDraft) &&
      c.listingStatus !== 'Available' &&
      c.listingStatus !== 'Sold' &&
      c.listingStatus !== 'Reserved'
    )
    if (isDraft) return false

    if (
      selectedMakes.length > 0 &&
      !selectedMakes.some((m) => m.toLowerCase() === c.make.toLowerCase())
    ) {
      return false
    }
    if (query) {
      const q = query.toLowerCase()
      const match =
        c.title.toLowerCase().includes(q) ||
        c.make.toLowerCase().includes(q) ||
        c.variant.toLowerCase().includes(q)
      if (!match) return false
    }

    // Fuel Type
    if (filters.fuel && filters.fuel !== 'All Fuels' && c.fuel !== filters.fuel) return false

    // Manufacturing Year
    if (filters.year && filters.year !== 'All Years') {
      if (filters.year === '2020 & Older') {
        if (c.year > 2020) return false
      } else if (c.year.toString() !== filters.year) {
        return false
      }
    }

    // Budget (supports dual slider min/max and preset budget strings)
    const minB = filters.minBudget ?? 200000
    const maxB = filters.maxBudget ?? 3500000
    if (minB > 200000 && c.price < minB) return false
    if (maxB < 3500000 && c.price > maxB) return false
    if (filters.budget === 'under-5' && c.price > 500000) return false
    if (filters.budget === '5-10' && (c.price < 500000 || c.price > 1000000)) return false
    if (filters.budget === '10-15' && (c.price < 1000000 || c.price > 1500000)) return false
    if (filters.budget === 'above-15' && c.price < 1500000) return false

    // KMs Driven (supports dual slider min/max and preset km strings)
    const minK = filters.minKm ?? 0
    const maxK = filters.maxKm ?? 100000
    if (minK > 0 && c.kmNumeric < minK) return false
    if (maxK < 100000 && c.kmNumeric > maxK) return false
    if (filters.km === 'under-20' && c.kmNumeric > 20000) return false
    if (filters.km === '20-40' && (c.kmNumeric < 20000 || c.kmNumeric > 40000)) return false
    if (filters.km === '40-70' && (c.kmNumeric < 40000 || c.kmNumeric > 70000)) return false
    if (filters.km === 'above-70' && c.kmNumeric < 70000) return false

    // Transmission
    if (
      filters.transmission &&
      filters.transmission !== 'all' &&
      c.transmission.toLowerCase() !== filters.transmission.toLowerCase()
    ) {
      return false
    }

    // Ownership
    if (
      filters.ownership &&
      filters.ownership !== 'all' &&
      !c.ownership.toLowerCase().includes(filters.ownership.toLowerCase())
    ) {
      return false
    }

    // Body Type
    if (
      filters.bodyType &&
      filters.bodyType !== 'all' &&
      c.bodyType.toLowerCase() !== filters.bodyType.toLowerCase()
    ) {
      return false
    }

    return true
  })

  // Sort filtered cars based on user preference
  const sortedCars = useMemo(() => {
    const list = [...filtered]
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    } else if (sortBy === 'year_desc') {
      list.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
    } else if (sortBy === 'km_asc') {
      list.sort((a, b) => (Number(a.kmNumeric) || 0) - (Number(b.kmNumeric) || 0))
    }
    return list
  }, [filtered, sortBy])

  // Track search queries automatically with intelligent debouncing
  useEffect(() => {
    if (query && query.trim().length >= 2) {
      trackSearch(query, sortedCars.length, { screen: 'catalogue' })
    }
  }, [query, sortedCars.length])

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    trackSort(newSort, sortedCars.length, { screen: 'catalogue' })
  }

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Certified Pre-Owned Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse {publishedCars.length} multi-point inspected vehicles with transparent pricing
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Selector with Analytics Tracking */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer text-xs sm:text-sm"
                aria-label="Sort vehicles"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Year: Newest First</option>
                <option value="km_asc">Mileage: Lowest First</option>
              </select>
            </div>

            <button
              onClick={() => onOpenFilter('all')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-2xs"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter</span>
            </button>

            <button
              onClick={() =>
                onOpenCarAlert &&
                onOpenCarAlert({
                  query,
                  brand: selectedMakes[0] || '',
                  bodyType: filters?.bodyType,
                })
              }
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 text-xs sm:text-sm font-semibold shadow-2xs transition active:scale-95"
              title="Can't find your car? Set a reminder alert"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span>Set Alert</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Brand Selector */}
        <div className="space-y-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search by make, model, variant, or fuel..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 focus:outline-none focus:border-slate-900 shadow-xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Multi-Select Brand Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={handleResetMakes}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition active:scale-95 ${
                selectedMakes.length === 0
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Makes
            </button>
            {makes.map((m) => {
              const isSelected = selectedMakes.includes(m)
              return (
                <button
                  key={m}
                  onClick={() => handleToggleMake(m)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition active:scale-95 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand text-white shadow-xs ring-1 ring-brand'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{m}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cars Responsive Grid or Empty State */}
        {sortedCars.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-md mx-auto">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Car className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Matching Vehicles</h3>
            <p className="text-xs text-slate-500 mb-4">
              {publishedCars.length === 0
                ? 'No published vehicles currently in inventory. Check back soon or add vehicles from the admin dashboard.'
                : 'Try adjusting your search query or filters to find more vehicles.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenCarAlert &&
                  onOpenCarAlert({
                    query,
                    brand: selectedMakes[0] || '',
                    bodyType: filters?.bodyType,
                  })
                }
                className="w-full sm:w-auto px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify Me When Available</span>
              </button>
              {(query || selectedMakes.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    handleResetMakes()
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Reset Search & Brands
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div
                className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => onSelectCar(car)}
              >
                <img
                  src={car.image || car.gallery[0]?.image}
                  alt={car.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{car.homeInspectedBadge || 'Inspected'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleWishlist(car.id)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      wishlist.includes(car.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }`}
                  />
                </button>

                <CarCardImageSpecs car={car} />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3
                      onClick={() => onSelectCar(car)}
                      className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900 cursor-pointer hover:text-slate-600 transition line-clamp-2 sm:text-lg"
                    >
                      {car.title}
                    </h3>
                    <p className="shrink-0 text-right text-sm font-bold text-slate-900 font-mono whitespace-nowrap tabular-nums sm:text-base">
                      {car.priceFormatted}
                    </p>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                    {car.variant?.trim() ? (
                      <p className="min-w-0 max-w-[58%] truncate text-slate-500 font-medium">{car.variant}</p>
                    ) : (
                      <span />
                    )}
                    <p className="shrink-0 text-slate-500 font-medium">{emiBuyerLabel(car)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCar(car)}
                    className="min-h-[44px] rounded-xl border border-slate-300 px-2 py-2.5 text-center text-xs font-semibold text-slate-900 transition hover:bg-slate-50 sm:text-sm"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookTestDrive(car)}
                    className="min-h-[44px] rounded-xl bg-brand px-2 py-2.5 text-center text-xs font-semibold text-white shadow-xs transition hover:bg-brand-hover sm:text-sm"
                  >
                    Book Test Drive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

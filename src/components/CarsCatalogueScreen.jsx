import React, { useState } from 'react'
import {
  Search,
  Filter,
  ShieldCheck,
  Heart,
  Calendar,
  Gauge,
  Fuel,
  SlidersHorizontal,
  ChevronLeft,
  X,
  ArrowRight,
  Check,
} from 'lucide-react'
import { allCarsData } from '../data/cars'

export default function CarsCatalogueScreen({
  onSelectCar,
  onBookTestDrive,
  onToggleWishlist,
  wishlist,
  onBack,
  onOpenFilter,
  filters = {},
  setFilters,
}) {
  const [query, setQuery] = useState('')
  const [selectedMakes, setSelectedMakes] = useState([])

  const makes = ['Honda', 'Hyundai', 'Mahindra', 'Tata', 'BMW', 'Mercedes-Benz', 'Toyota']

  const handleToggleMake = (m) => {
    setSelectedMakes((prev) =>
      prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
    )
  }

  const filtered = allCarsData.filter((c) => {
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

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Certified Pre-Owned Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse {allCarsData.length} multi-point inspected vehicles with transparent pricing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenFilter('all')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm font-semibold shadow-2xs"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter Vehicles</span>
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
              onClick={() => setSelectedMakes([])}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition active:scale-95 ${
                selectedMakes.length === 0
                  ? 'bg-slate-950 text-white shadow-xs'
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
                      ? 'bg-slate-950 text-white shadow-xs ring-1 ring-slate-950'
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

        {/* Cars Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
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
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
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
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-0.5">
                    <h3
                      onClick={() => onSelectCar(car)}
                      className="text-base sm:text-lg font-bold text-slate-900 cursor-pointer hover:text-slate-600 transition"
                    >
                      {car.title}
                    </h3>
                    <p className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                      {car.priceFormatted}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-3">{car.variant}</p>

                  <div className="grid grid-cols-4 py-2.5 border-t border-b border-slate-100 text-[11px] sm:text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{car.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{car.km.replace(' km', '')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{car.fuel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{car.transmission}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onSelectCar(car)}
                    className="py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-50 text-center transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onBookTestDrive(car)}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs sm:text-sm text-center transition shadow-xs"
                  >
                    Book Test Drive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

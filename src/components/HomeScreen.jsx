import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Heart,
  Calendar,
  Gauge,
  Fuel,
  SlidersHorizontal,
  X,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calculator,
  Car,
  Wrench,
  Users,
  ArrowUpDown,
  Bell,
} from 'lucide-react'
import { bodyTypesData, brandLogos } from '../data/cars'
import { trackSearch, trackFilter, trackSort } from '../lib/analytics'
import { DEFAULT_HERO_CONTENT, fetchHeroContentFromSupabase } from '../lib/supabase'
import { emiBuyerLabel } from '../data/carStorage'
import { BRAND_MAPS_URL } from '../config/brand'
import CarCardImageSpecs from './CarCardImageSpecs'

function carToHeroSlide(car) {
  const km = car.km || (car.kmNumeric ? `${Number(car.kmNumeric).toLocaleString('en-IN')} km` : '')
  const specs = [km, car.fuel, car.transmission].filter(Boolean).join(' • ')
  return {
    id: car.id,
    car,
    model: car.title || `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim(),
    price: car.priceFormatted || '',
    specs,
    image: car.image || '/hero-fortuner.png',
    bgClass: 'object-center',
  }
}

const fallbackHeroSlides = [
  {
    id: 'launch-fortuner',
    badge: 'NEW HIGH-VALUE LAUNCH',
    title: 'Quality Used Cars.',
    highlight: 'Hassle-Free.',
    model: '2023 Toyota Fortuner 4x4 Sigma',
    price: '₹ 34.50 Lakhs',
    emi: 'EMI from ₹ 42,850/mo',
    specs: '28,000 km • Diesel • Auto',
    desc: 'Certified pre-owned cars, transparent pricing, and complete peace of mind for your next drive.',
    image: '/hero-fortuner.png',
    bgClass: 'object-[center_35%]',
    ctaPrimary: 'Explore Cars',
    ctaSecondary: 'Sell Your Car',
  },
  {
    id: 'launch-bmw',
    badge: 'LUXURY FLAGSHIP ARRIVAL',
    title: 'Luxury Performance.',
    highlight: 'Pure Driving Joy.',
    model: '2022 BMW 3 Series 330i M-Sport',
    price: '₹ 38.90 Lakhs',
    emi: 'EMI from ₹ 48,200/mo',
    specs: '19,500 km • Petrol • Auto',
    desc: 'TwinPower Turbo 258 BHP with panoramic roof, pristine service history, and zero insurance claims.',
    image: '/hero-car-clean.jpg',
    bgClass: 'object-center',
    ctaPrimary: 'Explore Luxury',
    ctaSecondary: 'Sell Your Car',
  },
  {
    id: 'launch-suv',
    badge: 'PREMIUM SUV SPOTLIGHT',
    title: 'Dynamic Luxury.',
    highlight: 'Pure Precision.',
    model: '2023 Hyundai Tucson Signature AWD',
    price: '₹ 28.50 Lakhs',
    emi: 'EMI from ₹ 35,400/mo',
    specs: '22,000 km • Diesel • Auto',
    desc: 'Flagship AWD with panoramic glass roof, Level-2 ADAS suite, and complete authorized service history.',
    image: '/card-suv-gen.jpg',
    bgClass: 'object-center',
    ctaPrimary: 'Explore SUV',
    ctaSecondary: 'Sell Your Car',
  },
]

export default function HomeScreen({
  homeResetKey = 0,
  cars = [],
  onSelectCar,
  onBookTestDrive,
  onOpenWhatsApp,
  onOpenFilter,
  activeTab,
  setActiveTab,
  wishlist,
  onToggleWishlist,
  onOpenCall,
  filters: propFilters,
  setFilters: propSetFilters,
  onOpenCarAlert,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyType, setSelectedBodyType] = useState(null)
  const [selectedBrands, setSelectedBrands] = useState([])
  const [sortBy, setSortBy] = useState('featured')
  const [localFilters, setLocalFilters] = useState({
    minBudget: 200000,
    maxBudget: 3500000,
    minKm: 0,
    maxKm: 100000,
    budget: 'all',
    km: 'all',
    fuel: 'All Fuels',
    year: 'All Years',
    transmission: 'all',
    ownership: 'all',
    bodyType: 'all',
  })

  const filters = propFilters || localFilters
  const setFilters = propSetFilters || setLocalFilters

  // Filter status & label helpers
  const currentMinBudget = filters.minBudget ?? 200000
  const currentMaxBudget = filters.maxBudget ?? 3500000
  const currentMinKm = filters.minKm ?? 0
  const currentMaxKm = filters.maxKm ?? 100000

  const isBudgetFiltered =
    currentMinBudget > 200000 ||
    currentMaxBudget < 3500000 ||
    (filters.budget && filters.budget !== 'all' && filters.budget !== 'custom')
  const isKmFiltered =
    currentMinKm > 0 ||
    currentMaxKm < 100000 ||
    (filters.km && filters.km !== 'all')
  const isFuelFiltered = filters.fuel && filters.fuel !== 'All Fuels'
  const isYearFiltered = filters.year && filters.year !== 'All Years'
  const isTransmissionFiltered = filters.transmission && filters.transmission !== 'all'
  const isOwnershipFiltered = filters.ownership && filters.ownership !== 'all'
  const isBodyTypeFiltered = filters.bodyType && filters.bodyType !== 'all'

  const activeFiltersCount =
    (isBudgetFiltered ? 1 : 0) +
    (isKmFiltered ? 1 : 0) +
    (isFuelFiltered ? 1 : 0) +
    (isYearFiltered ? 1 : 0) +
    (isTransmissionFiltered ? 1 : 0) +
    (isOwnershipFiltered ? 1 : 0) +
    (isBodyTypeFiltered ? 1 : 0)

  const formatBudgetPill = () => {
    if (!isBudgetFiltered) return 'Budget'
    const minL = (currentMinBudget / 100000).toFixed(currentMinBudget % 100000 === 0 ? 0 : 1)
    const maxL = (currentMaxBudget / 100000).toFixed(currentMaxBudget % 100000 === 0 ? 0 : 1)
    if (currentMinBudget <= 200000) return `Budget: Up to ₹${maxL}L`
    if (currentMaxBudget >= 3500000) return `Budget: ₹${minL}L+`
    return `Budget: ₹${minL}L - ₹${maxL}L`
  }

  const formatKmPill = () => {
    if (!isKmFiltered) return 'KMs Driven'
    if (currentMinKm <= 0) return `KMs: Under ${(currentMaxKm / 1000).toFixed(0)}k km`
    if (currentMaxKm >= 100000) return `KMs: ${(currentMinKm / 1000).toFixed(0)}k+ km`
    return `KMs: ${(currentMinKm / 1000).toFixed(0)}k - ${(currentMaxKm / 1000).toFixed(0)}k km`
  }

  const handleResetFilters = () => {
    setFilters({
      minBudget: 200000,
      maxBudget: 3500000,
      minKm: 0,
      maxKm: 100000,
      budget: 'all',
      km: 'all',
      fuel: 'All Fuels',
      year: 'All Years',
      transmission: 'all',
      ownership: 'all',
      bodyType: 'all',
    })
  }

  const hasActiveFilters =
    activeFiltersCount > 0 ||
    Boolean(searchQuery) ||
    selectedBrands.length > 0 ||
    Boolean(selectedBodyType)

  const handleClearAllFilters = () => {
    handleResetFilters()
    setSearchQuery('')
    setSelectedBrands([])
    setSelectedBodyType(null)
    setSortBy('featured')
  }

  useEffect(() => {
    if (homeResetKey < 1) return
    setSearchQuery('')
    setSelectedBrands([])
    setSelectedBodyType(null)
    setSortBy('featured')
  }, [homeResetKey])

  const [heroContent, setHeroContent] = useState(DEFAULT_HERO_CONTENT)

  useEffect(() => {
    let active = true
    fetchHeroContentFromSupabase()
      .then((content) => {
        if (active && content) setHeroContent(content)
      })
      .catch(() => {
        // Table is created by the hero page migration. Defaults stay in place until then.
      })
    return () => {
      active = false
    }
  }, [])

  const heroSlides = useMemo(() => {
    const marked = (cars || []).filter(
      (car) => car.showInHero && car.listingStatus !== 'Sold' && car.listingStatus !== 'Draft' && !car.isDraft
    )
    if (marked.length === 0) {
      return fallbackHeroSlides
    }
    return marked.map((car) => carToHeroSlide(car))
  }, [cars])

  const heroStats = [
    { icon: Users, value: heroContent.stat1Value, label: heroContent.stat1Label },
    { icon: ShieldCheck, value: heroContent.stat2Value, label: heroContent.stat2Label },
    { icon: Wrench, value: heroContent.stat3Value, label: heroContent.stat3Label },
  ]

  // High-value launches hero carousel state
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const touchStartXRef = useRef(null)
  const touchEndXRef = useRef(null)

  const handleHeroTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX
  }

  const handleHeroTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX
  }

  const handleHeroTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return
    const diff = touchStartXRef.current - touchEndXRef.current
    if (diff > 40) {
      // Swipe left -> next slide
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
    } else if (diff < -40) {
      setActiveHeroSlide(
        (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
      )
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  useEffect(() => {
    setActiveHeroSlide((prev) => (heroSlides.length === 0 ? 0 : prev % heroSlides.length))
  }, [heroSlides.length])

  // Auto-rotate hero carousel every 6s
  useEffect(() => {
    if (heroSlides.length < 2) return undefined
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const currentHeroSlide = heroSlides[activeHeroSlide] || heroSlides[0]

  // Horizontal pan gesture state for brand logos strip
  const brandsScrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)

  const handleMouseDown = (e) => {
    if (!brandsScrollRef.current) return
    setIsDragging(true)
    setHasDragged(false)
    setStartX(e.pageX - brandsScrollRef.current.offsetLeft)
    setScrollLeft(brandsScrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !brandsScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - brandsScrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Drag speed
    if (Math.abs(walk) > 4) {
      setHasDragged(true)
    }
    brandsScrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleScrollBrands = (direction) => {
    if (brandsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280
      brandsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleToggleBrand = (brandName) => {
    if (hasDragged) return // Suppress toggle if the user was panning
    setSelectedBrands((prev) => {
      const next = prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName]
      trackFilter({ ...filters, makes: next }, cars.length, { screen: 'home', source: 'brand_strip' })
      return next
    })
  }

  const handleClearBrands = () => {
    setSelectedBrands([])
    trackFilter({ ...filters, makes: [] }, cars.length, { screen: 'home', source: 'clear_brands' })
  }

  // Filter cars based on search, body type, brands, and comprehensive filter criteria
  const filteredCars = (cars || []).filter((car) => {
    // Exclude unpublished drafts from live customer storefront
    const isDraft = Boolean(
      (car.listingStatus === 'Draft' || car.isDraft) &&
      car.listingStatus !== 'Available' &&
      car.listingStatus !== 'Sold' &&
      car.listingStatus !== 'Reserved'
    )
    if (isDraft) return false

    // Body type (from Browse by Body Type section or FilterModal)
    const effectiveBody =
      selectedBodyType || (filters.bodyType && filters.bodyType !== 'all' ? filters.bodyType : null)
    if (effectiveBody && car.bodyType.toLowerCase() !== effectiveBody.toLowerCase()) {
      return false
    }

    // Brand multi-select
    if (selectedBrands.length > 0) {
      const match = selectedBrands.some(
        (b) => b.toLowerCase() === car.make.toLowerCase()
      )
      if (!match) return false
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchTitle = car.title.toLowerCase().includes(q)
      const matchMake = car.make.toLowerCase().includes(q)
      const matchModel = car.model.toLowerCase().includes(q)
      if (!matchTitle && !matchMake && !matchModel) return false
    }

    // Fuel Type
    if (filters.fuel && filters.fuel !== 'All Fuels' && car.fuel !== filters.fuel) return false

    // Manufacturing Year
    if (filters.year && filters.year !== 'All Years') {
      if (filters.year === '2020 & Older') {
        if (car.year > 2020) return false
      } else if (car.year.toString() !== filters.year) {
        return false
      }
    }

    // Budget (supports dual slider min/max and preset budget strings)
    const minB = filters.minBudget ?? 200000
    const maxB = filters.maxBudget ?? 3500000
    if (minB > 200000 && car.price < minB) return false
    if (maxB < 3500000 && car.price > maxB) return false
    if (filters.budget === 'under-5' && car.price > 500000) return false
    if (filters.budget === '5-10' && (car.price < 500000 || car.price > 1000000)) return false
    if (filters.budget === '10-15' && (car.price < 1000000 || car.price > 1500000)) return false
    if (filters.budget === 'above-15' && car.price < 1500000) return false

    // KMs Driven (supports dual slider min/max and preset km strings)
    const minK = filters.minKm ?? 0
    const maxK = filters.maxKm ?? 100000
    if (minK > 0 && car.kmNumeric < minK) return false
    if (maxK < 100000 && car.kmNumeric > maxK) return false
    if (filters.km === 'under-20' && car.kmNumeric > 20000) return false
    if (filters.km === '20-40' && (car.kmNumeric < 20000 || car.kmNumeric > 40000)) return false
    if (filters.km === '40-70' && (car.kmNumeric < 40000 || car.kmNumeric > 70000)) return false
    if (filters.km === 'above-70' && car.kmNumeric < 70000) return false

    // Transmission
    if (
      filters.transmission &&
      filters.transmission !== 'all' &&
      car.transmission.toLowerCase() !== filters.transmission.toLowerCase()
    ) {
      return false
    }

    // Ownership
    if (
      filters.ownership &&
      filters.ownership !== 'all' &&
      !car.ownership.toLowerCase().includes(filters.ownership.toLowerCase())
    ) {
      return false
    }

    return true
  })

  // Sort filtered cars based on user preference
  const sortedCars = useMemo(() => {
    const list = [...filteredCars]
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
  }, [filteredCars, sortBy])

  // Track search queries automatically with intelligent debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      trackSearch(searchQuery, sortedCars.length, { screen: 'home' })
    }
  }, [searchQuery, sortedCars.length])

  // Track user sorting change
  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    trackSort(newSort, sortedCars.length, { screen: 'home' })
  }

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen pb-24 md:pb-16 selection:bg-brand selection:text-white">
      {/* Hero Section Container (1280px container, 12-column grid, 8pt spacing rhythm) */}
      <section className="ui-hero-section relative w-full overflow-hidden border-b border-slate-300/70 pt-6 pb-8 sm:pt-8 lg:pb-12 lg:pt-12">
        <div className="relative z-[1] mx-auto max-w-[1280px] px-4 sm:px-6">
          {/* Desktop Two-Column Layout in 12-Column Grid */}
          <div className="hidden lg:grid grid-cols-12 gap-6 items-center">
            {/* Left Content Column */}
            <div className="col-span-6 z-10">
              {/* Category Subhead with Line Accent */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-0.5 bg-brand rounded-full inline-block"></span>
                <span className="text-xs font-bold tracking-[0.18em] text-slate-700 uppercase">
                  {heroContent.eyebrow}
                </span>
              </div>

              <h1 className="text-5xl xl:text-6xl font-black text-slate-950 leading-[1.12] tracking-normal mb-4">
                {heroContent.headline}
                {heroContent.headlineAccent ? (
                  <>
                    <br />
                    <span className="text-slate-950">{heroContent.headlineAccent}</span>
                  </>
                ) : null}
              </h1>

              <p className="text-slate-600 text-base leading-relaxed max-w-md mb-8 font-normal">
                {heroContent.description}
              </p>

              {/* Hero Action Buttons */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => {
                    const el = document.getElementById('featured-cars-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-7 py-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <span>Explore Cars</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('sell')}
                  className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm transition active:scale-95 shadow-2xs"
                >
                  Sell Your Car
                </button>
              </div>

              {/* Desktop 3 Key Trust Highlights - Even Grid, Clean Alignment */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                {heroStats.map((stat) => {
                  const StatIcon = stat.icon
                  return (
                    <div className="flex items-center gap-3" key={stat.label}>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <StatIcon className="w-5 h-5 text-brand stroke-[2]" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-950 leading-none">{stat.value}</p>
                        <p className="text-xs font-semibold text-slate-600 mt-1">{stat.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Framed Showcase Container snapping to 12-column grid */}
            <div className="col-span-6">
              <div className="relative w-full h-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm select-none">
                {heroSlides.map((slide, idx) => (
                  <img
                    key={slide.id}
                    src={slide.image}
                    alt={slide.model}
                    onClick={() => {
                      if (slide.car && onSelectCar && activeHeroSlide === idx) onSelectCar(slide.car)
                    }}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      slide.bgClass
                    } ${slide.car ? 'cursor-pointer' : ''} ${activeHeroSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                  />
                ))}

                {/* Floating High-Value Launch Badge positioned at top-left so it NEVER covers car wheel/bumper */}
                <div className="ui-glass-panel pointer-events-auto absolute top-4 left-4 z-20 flex max-w-sm items-center gap-4 rounded-2xl px-4 py-3 text-slate-900">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{currentHeroSlide.model}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{currentHeroSlide.price} · {currentHeroSlide.specs}</p>
                  </div>

                  {/* Slider Controls */}
                  <div className="ui-glass-divider flex items-center gap-1.5 border-l pl-3">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHeroSlide(
                          (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                        )
                      }
                      className="ui-glass-btn flex h-9 w-9 items-center justify-center rounded-xl text-slate-800 transition active:scale-90"
                      aria-label="Previous launch"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
                      }
                      className="ui-glass-btn flex h-9 w-9 items-center justify-center rounded-xl text-slate-800 transition active:scale-90"
                      aria-label="Next launch"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View: High task priority (Search right under headline!), clean contrast, no mountain bg */}
          <div className="lg:hidden w-full space-y-6">
            {/* 1. Headline Block */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-brand rounded-full inline-block"></span>
                <span className="text-xs font-bold tracking-[0.18em] text-slate-700 uppercase">
                  {heroContent.eyebrow}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-[1.14] tracking-normal mb-2">
                {heroContent.headline}
                {heroContent.headlineAccent ? (
                  <>
                    <br />
                    <span className="text-slate-950">{heroContent.headlineAccent}</span>
                  </>
                ) : null}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {heroContent.description}
              </p>
            </div>

            {/* 2. Mobile Primary Search Card: Placed directly under headline for immediate task execution */}
            <div className="ui-search-hub space-y-3 rounded-2xl p-4">
              {/* Search Row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-brand absolute left-3.5" />
                  <input
                    type="text"
                    placeholder="Search brand, model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ui-search-input h-11 w-full rounded-xl pl-10 pr-9 text-sm font-normal text-slate-900 placeholder-slate-400 transition focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('featured-cars-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="ui-search-cta flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white transition active:scale-95"
                >
                  <span>Search</span>
                </button>
              </div>

              {/* Filter Chips Scroll Row: Bleeds to edges with -mx-4 px-4 so chips scroll cleanly without cut off */}
              <div className="ui-search-hub-divider -mx-4 flex items-center gap-2 overflow-x-auto scrollbar-none px-4 pt-3.5">
                <button
                  type="button"
                  onClick={() => onOpenFilter('budget')}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                    isBudgetFiltered
                      ? 'ui-filter-chip-active text-white'
                      : 'ui-filter-chip text-slate-700'
                  }`}
                >
                  <span>{formatBudgetPill()}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${isBudgetFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenFilter('km')}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                    isKmFiltered
                      ? 'ui-filter-chip-active text-white'
                      : 'ui-filter-chip text-slate-700'
                  }`}
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{formatKmPill()}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenFilter('fuel')}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                    isFuelFiltered
                      ? 'ui-filter-chip-active text-white'
                      : 'ui-filter-chip text-slate-700'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>{isFuelFiltered ? `Fuel: ${filters.fuel}` : 'Fuel'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenFilter('year')}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition active:scale-95 ${
                    isYearFiltered
                      ? 'ui-filter-chip-active text-white'
                      : 'ui-filter-chip text-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isYearFiltered ? `Year: ${filters.year}` : 'Year'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenFilter('all')}
                  className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition active:scale-95 ${
                    activeFiltersCount > 0
                      ? 'ui-filter-chip-active text-white'
                      : 'ui-filter-chip text-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-brand text-xs font-bold flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenCarAlert &&
                    onOpenCarAlert({
                      query: searchQuery,
                      brand: selectedBrands[0] || '',
                      minPrice: filters.minBudget,
                      maxPrice: filters.maxBudget,
                      fuel: filters.fuel,
                      bodyType: filters.bodyType,
                      transmission: filters.transmission,
                    })
                  }
                  className="ui-filter-chip flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-700 transition active:scale-95"
                  title="Can't find your car? Set an email reminder alert"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-600" />
                  <span>Set Alert</span>
                </button>
              </div>
            </div>

            {/* 3. Action CTAs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('featured-cars-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover active:scale-95 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <span>Explore Cars</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab('sell')}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-900 font-semibold text-xs text-center transition shadow-2xs"
              >
                Sell Your Car
              </button>
            </div>

            {/* 4. Car Showcase Carousel Card (Distinct visual presentation, 100% visible car) */}
            <div
              onTouchStart={handleHeroTouchStart}
              onTouchMove={handleHeroTouchMove}
              onTouchEnd={handleHeroTouchEnd}
              className="relative w-full aspect-[16/10] sm:h-64 rounded-2xl overflow-hidden shadow-xs border border-slate-200/60 bg-slate-100 select-none"
            >
              {heroSlides.map((slide, idx) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.model}
                  onClick={() => {
                    if (slide.car && onSelectCar && activeHeroSlide === idx) onSelectCar(slide.car)
                  }}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                    slide.bgClass
                  } ${slide.car ? 'cursor-pointer' : ''} ${activeHeroSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                />
              ))}

              {/* Top-Left Floating Info Badge (Clear typography >=12px, consistent specs with desktop) */}
              <div className="ui-glass-panel absolute top-3 left-3 z-10 flex max-w-[70%] flex-col gap-0.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  <span className="truncate">{currentHeroSlide.model}</span>
                </div>
                <p className="text-slate-600 font-medium text-xs">
                  {currentHeroSlide.price} • {currentHeroSlide.specs}
                </p>
              </div>

              {/* Top-Right Slide Counter (Clean single indicator) */}
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-white shadow-xs">
                {activeHeroSlide + 1} / {heroSlides.length}
              </div>

              {/* Bottom Navigation Arrows (44px min touch target) */}
              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveHeroSlide(
                      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                    )
                  }
                  className="ui-glass-btn flex h-11 w-11 items-center justify-center rounded-xl text-slate-900 transition active:scale-95"
                  aria-label="Previous launch"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length)
                  }
                  className="ui-glass-btn flex h-11 w-11 items-center justify-center rounded-xl text-slate-900 transition active:scale-95"
                  aria-label="Next launch"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 5. Mobile 3 Trust Highlights - Flat airy metrics strip, NOT a third card! */}
            <div className="ui-inset-surface grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200/80 py-4 text-center">
              {heroStats.map((stat) => {
                const StatIcon = stat.icon
                return (
                  <div className="flex flex-col items-center px-1" key={stat.label}>
                    <StatIcon className="w-4 h-4 text-brand mb-1 stroke-[2]" />
                    <span className="text-base font-black text-slate-950">{stat.value}</span>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Search & Filter Hub (Snapped strictly to 1280px container, clean 8pt spacing) */}
      <div className="hidden lg:block max-w-[1280px] mx-auto px-4 sm:px-6 my-10 lg:my-14">
        <div className="ui-search-hub rounded-2xl p-6">
          {/* Top Search Tabs - Focused purely on Buying & Financing */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {}}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition shrink-0 whitespace-nowrap active:scale-95"
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>Buy a Car</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className="px-5 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-semibold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 whitespace-nowrap active:scale-95"
            >
              <Calculator className="w-4 h-4 text-slate-500 shrink-0" />
              <span>EMI Calculator</span>
            </button>
          </div>

          {/* Search by Make/Model Input Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-brand absolute left-4" />
              <input
                type="text"
                placeholder="Search by brand, model or car type (e.g. Swift, City, Creta)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ui-search-input h-12 w-full rounded-xl pl-12 pr-10 text-sm font-normal text-slate-900 placeholder-slate-400 transition focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('featured-cars-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="ui-search-cta h-12 whitespace-nowrap rounded-xl px-8 text-sm font-semibold text-white transition active:scale-95"
            >
              Search
            </button>
          </div>

          {/* Quick Filter Pills Row (Apple-Style, Minimal Monochrome, No Hairline Chopping) */}
          <div className="ui-search-hub-divider mt-4 space-y-3 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* Budget Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('budget')}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                  isBudgetFiltered
                    ? 'ui-filter-chip-active text-white'
                    : 'ui-filter-chip text-slate-700'
                }`}
              >
                <span>{formatBudgetPill()}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isBudgetFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* KMs Driven Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('km')}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                  isKmFiltered
                    ? 'ui-filter-chip-active text-white'
                    : 'ui-filter-chip text-slate-700'
                }`}
              >
                <Gauge className={`w-3.5 h-3.5 ${isKmFiltered ? 'text-slate-200' : 'text-slate-500'}`} />
                <span>{formatKmPill()}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isKmFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* Fuel Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('fuel')}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                  isFuelFiltered
                    ? 'ui-filter-chip-active text-white'
                    : 'ui-filter-chip text-slate-700'
                }`}
              >
                <Fuel className={`w-3.5 h-3.5 ${isFuelFiltered ? 'text-slate-200' : 'text-slate-500'}`} />
                <span>{isFuelFiltered ? `Fuel: ${filters.fuel}` : 'Fuel'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isFuelFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* Year Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('year')}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                  isYearFiltered
                    ? 'ui-filter-chip-active text-white'
                    : 'ui-filter-chip text-slate-700'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${isYearFiltered ? 'text-slate-200' : 'text-slate-500'}`} />
                <span>{isYearFiltered ? `Year: ${filters.year}` : 'Year'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isYearFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* All Filters Button - Matching white chip styling */}
              <button
                type="button"
                onClick={() => onOpenFilter('all')}
                className={`ml-auto flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                  activeFiltersCount > 0
                    ? 'ui-filter-chip-active text-white'
                    : 'ui-filter-chip text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-brand text-xs font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Set Alert Reminder Button - Neutral monochrome */}
              <button
                type="button"
                onClick={() =>
                  onOpenCarAlert &&
                  onOpenCarAlert({
                    query: searchQuery,
                    brand: selectedBrands[0] || '',
                    minPrice: filters.minBudget,
                    maxPrice: filters.maxBudget,
                    fuel: filters.fuel,
                    bodyType: filters.bodyType,
                    transmission: filters.transmission,
                  })
                }
                className="ui-filter-chip flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 transition active:scale-95"
                title="Can't find your car? Set an email reminder alert"
              >
                <Bell className="w-3.5 h-3.5 text-slate-600" />
                <span>Set Alert</span>
              </button>
            </div>

            {/* Active Filters Summary Strip */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Active:</span>

                  {isBudgetFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span>{formatBudgetPill()}</span>
                      <button
                        onClick={() =>
                          setFilters({ ...filters, minBudget: 200000, maxBudget: 3500000, budget: 'all' })
                        }
                        className="hover:text-red-500 ml-0.5"
                        title="Remove budget filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {isKmFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span>{formatKmPill()}</span>
                      <button
                        onClick={() =>
                          setFilters({ ...filters, minKm: 0, maxKm: 100000, km: 'all' })
                        }
                        className="hover:text-red-500 ml-0.5"
                        title="Remove mileage filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {isFuelFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span>{filters.fuel}</span>
                      <button
                        onClick={() => setFilters({ ...filters, fuel: 'All Fuels' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove fuel filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {isYearFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span>{filters.year}</span>
                      <button
                        onClick={() => setFilters({ ...filters, year: 'All Years' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove year filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {isTransmissionFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span className="capitalize">{filters.transmission}</span>
                      <button
                        onClick={() => setFilters({ ...filters, transmission: 'all' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove transmission filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {isOwnershipFiltered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold border border-slate-200">
                      <span className="capitalize">{filters.ownership} Owner</span>
                      <button
                        onClick={() => setFilters({ ...filters, ownership: 'all' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove ownership filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="text-xs font-semibold text-slate-700">
                  {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'} matching
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Logos Strip with Pan Gesture, Multi-Select & Snapped Container */}
      <section id="brands-section" className="max-w-[1280px] mx-auto px-4 sm:px-6 my-10 sm:my-14">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Explore by Brand
              </h2>
              {selectedBrands.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-brand text-white">
                  {selectedBrands.length} selected
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Choose from certified cars from world-class automakers
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedBrands.length > 0 && (
              <button
                onClick={handleClearBrands}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1.5 transition active:scale-95"
              >
                <span>Clear Filters ({selectedBrands.length})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop Pan Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                onClick={() => handleScrollBrands('left')}
                aria-label="Scroll left"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollBrands('right')}
                aria-label="Scroll right"
                className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pan Gesture & Drag-to-Scroll Brand Strip */}
        <div
          ref={brandsScrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex items-center gap-3 overflow-x-auto pt-3.5 pb-4 px-2 scrollbar-none select-none scroll-smooth ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {brandLogos.map((brand) => {
            const isSelected = selectedBrands.includes(brand.name)
            return (
              <button
                key={brand.name}
                type="button"
                onClick={() => handleToggleBrand(brand.name)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl bg-white transition-all duration-200 shrink-0 w-24 sm:w-28 group active:scale-95 ${
                  isSelected
                    ? 'border-2 border-slate-950 shadow-md ring-1 ring-slate-950/10'
                    : 'border-2 border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Check Icon at the top right when selected */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-200 z-20">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Nice Linear Gradient Vignette Effect around the box */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-slate-900/[0.08] via-transparent to-slate-900/[0.14] shadow-[inset_0_0_18px_rgba(15,23,42,0.14)] z-10" />
                )}

                {/* Brand Logo - 100% Authentic Colors, No Invert, Clean Background */}
                <div className="w-12 h-11 flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-105 z-0">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    draggable={false}
                    className="max-w-full max-h-8 sm:max-h-9 object-contain select-none"
                  />
                </div>

                {/* Brand Label */}
                <span
                  className={`text-xs font-semibold truncate max-w-full z-0 transition-colors ${
                    isSelected ? 'text-slate-950 font-bold' : 'text-slate-700'
                  }`}
                >
                  {brand.name}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Browse by Body Type Section (4-column on mobile, expanded on desktop) */}
      <section id="body-types" className="max-w-[1280px] mx-auto px-4 sm:px-6 my-10 sm:my-14">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Browse by Body Type
          </h2>
          <button
            onClick={() => setActiveTab('cars')}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {bodyTypesData.map((body) => {
            const isSelected = selectedBodyType === body.id
            return (
              <button
                key={body.id}
                onClick={() => {
                  const next = isSelected ? null : body.id
                  setSelectedBodyType(next)
                  trackFilter({ ...filters, bodyType: next || 'all' }, cars.length, { screen: 'home', source: 'body_type_card' })
                }}
                className={`rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-between transition border cursor-pointer text-center group active:scale-95 ${
                  isSelected
                    ? 'bg-white border-slate-950 shadow-md ring-1 ring-slate-950'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md'
                }`}
              >
                <div className="w-full h-12 sm:h-20 flex items-center justify-center mb-1 sm:mb-2">
                  <img
                    src={body.image}
                    alt={body.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 pointer-events-none select-none"
                  />
                </div>
                <div className="text-center w-full">
                  <p className="text-xs sm:text-base font-bold text-slate-900 leading-tight">
                    {body.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">{body.count}</p>
                  <p className="hidden sm:block text-xs font-semibold text-slate-700 mt-1">
                    From {body.startingPrice}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Featured Cars Section */}
      <section id="featured-cars-section" className="max-w-[1280px] mx-auto px-4 sm:px-6 my-10 sm:my-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Featured Cars
            </h2>
            <p className="text-sm text-slate-600 mt-1 hidden sm:block">
              Hand-picked verified inventory ready for instant delivery in Tamil Nadu
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sort Selector with Analytics Tracking */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer text-xs"
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
              onClick={() => setActiveTab('cars')}
              className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Cars Responsive Grid or Clean Empty State */}
        {sortedCars.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Car className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Matching Vehicles</h3>
            <p className="text-xs text-slate-500 mb-4">
              {cars.filter((c) => (c.listingStatus === 'Available') || (!c.isDraft && c.listingStatus !== 'Draft')).length === 0
                ? 'No published vehicles currently in live inventory. Add your first vehicle from the admin dashboard.'
                : 'Try clearing your search query or brand filter to see more inventory.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onOpenCarAlert &&
                  onOpenCarAlert({
                    query: searchQuery,
                    brand: selectedBrands[0] || '',
                    minPrice: filters.minBudget,
                    maxPrice: filters.maxBudget,
                    fuel: filters.fuel,
                    bodyType: filters.bodyType,
                    transmission: filters.transmission,
                  })
                }
                className="w-full sm:w-auto px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notify Me When Available</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Car Image with Fixed Height & Object-Cover (Never Stretched!) */}
              <div
                className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => onSelectCar(car)}
              >
                <img
                  src={car.image || car.gallery[0]?.image}
                  alt={car.title}
                  className="w-full h-full object-contain object-center"
                />

                {/* Top-Left Inspected Pill */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{car.homeInspectedBadge || 'Inspected'}</span>
                </div>

                {/* Top-Right Favorite Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleWishlist(car.id)
                  }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-slate-950/40 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500 transition active:scale-90"
                  aria-label="Wishlist"
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

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Title & Price */}
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

                  {/* Variant & EMI */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
                    {car.variant?.trim() ? (
                      <p className="min-w-0 max-w-[58%] truncate text-slate-500 font-medium">{car.variant}</p>
                    ) : (
                      <span />
                    )}
                    <p className="shrink-0 text-slate-500 font-medium">{emiBuyerLabel(car)}</p>
                  </div>
                </div>

                {/* Action Buttons (View Details & Book Test Drive) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCar(car)}
                    className="min-h-[44px] rounded-xl border border-slate-300 px-2 py-2.5 text-center text-xs font-semibold text-slate-900 transition hover:bg-slate-50 active:scale-[0.99] sm:text-sm"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookTestDrive(car)}
                    className="min-h-[44px] rounded-xl bg-brand px-2 py-2.5 text-center text-xs font-semibold text-white shadow-xs transition hover:bg-brand-hover active:scale-[0.99] sm:text-sm"
                  >
                    Book Test Drive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </section>

      {/* Why Harsha cars - Minimal Apple-Style Standard */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 my-12 sm:my-16">
        <div className="bg-slate-50/70 rounded-2xl p-6 sm:p-10 border border-slate-200/80">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-700">
              THE HARSHA STANDARD
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1 mb-2 tracking-tight">
              Simple. Certified. Transparent.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every vehicle undergoes our 200-point physical inspection with fixed transparent pricing and complete warranty cover.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">200+ Point Check</h4>
              <p className="text-xs text-slate-500 mt-0.5">Engine, body & electronics inspection</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <Award className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">1-Year Warranty</h4>
              <p className="text-xs text-slate-500 mt-0.5">Comprehensive engine & gearbox cover</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <Clock className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">7-Day Return</h4>
              <p className="text-xs text-slate-500 mt-0.5">100% money back peace of mind</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">Free RC Transfer</h4>
              <p className="text-xs text-slate-500 mt-0.5">Paperwork handled with zero fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Hub Banner (Minimalist) */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 my-10 sm:my-14 mb-12 sm:mb-16">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src="/nova/dealer-thumb.jpg"
              alt="Harsha cars Showroom"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0"
            />
            <div>
              <span className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                Flagship Experience Hub
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-950 mt-0.5">
                Harsha cars Tiruppur Mega Showroom
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Harsha cars, Tiruppur • Open today till 8:30 PM</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onOpenCall}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition shadow-2xs"
            >
              Contact Concierge
            </button>
            <a
              href={BRAND_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm transition text-center shadow-xs"
            >
              Get Showroom Directions
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

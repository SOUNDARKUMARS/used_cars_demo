import React, { useState, useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { featuredCarData, bodyTypesData, allCarsData, brandLogos } from '../data/cars'

// Curated high-value launches carousel slides
const highValueHeroSlides = [
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
    bgClass: 'object-[center_42%]',
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
    id: 'launch-city',
    badge: 'EXECUTIVE SPOTLIGHT',
    title: 'Top Executive Sedan.',
    highlight: 'Sensing ADAS.',
    model: '2023 Honda City ZX CVT',
    price: '₹ 11.50 Lakhs',
    emi: 'EMI from ₹ 20,334/mo',
    specs: '28,000 km • Petrol • Auto',
    desc: 'Flagship ZX with ADAS collision avoidance, electric sunroof, and showroom maintenance pedigree.',
    image: '/mock_cars/honda_city_front.jpg',
    bgClass: 'object-center',
    ctaPrimary: 'View City ZX',
    ctaSecondary: 'Sell Your Car',
  },
]

export default function HomeScreen({
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
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyType, setSelectedBodyType] = useState(null)
  const [selectedBrands, setSelectedBrands] = useState([])
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
    if (currentMinBudget <= 200000) return `Up to ₹ ${maxL}L`
    if (currentMaxBudget >= 3500000) return `₹ ${minL}L+`
    return `₹ ${minL}L - ₹ ${maxL}L`
  }

  const formatKmPill = () => {
    if (!isKmFiltered) return 'KMs Driven'
    if (currentMinKm <= 0) return `Under ${(currentMaxKm / 1000).toFixed(0)}k km`
    if (currentMaxKm >= 100000) return `${(currentMinKm / 1000).toFixed(0)}k+ km`
    return `${(currentMinKm / 1000).toFixed(0)}k - ${(currentMaxKm / 1000).toFixed(0)}k km`
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
      setActiveHeroSlide((prev) => (prev + 1) % highValueHeroSlides.length)
    } else if (diff < -40) {
      // Swipe right -> prev slide
      setActiveHeroSlide(
        (prev) => (prev - 1 + highValueHeroSlides.length) % highValueHeroSlides.length
      )
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  // Auto-rotate hero carousel every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % highValueHeroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const currentHeroSlide = highValueHeroSlides[activeHeroSlide]

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
    setSelectedBrands((prev) =>
      prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName]
    )
  }

  const handleClearBrands = () => {
    setSelectedBrands([])
  }

  // Filter cars based on search, body type, brands, and comprehensive filter criteria
  const filteredCars = allCarsData.filter((car) => {
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

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen pb-24 md:pb-16 selection:bg-slate-900 selection:text-white">
      {/* Hero Section Container (Apple-like Clean Minimalist UI) */}
      <section className="relative w-full bg-white overflow-hidden pt-6 sm:pt-10 lg:pt-14 pb-8 lg:pb-24">
        {/* Mobile Hero Background Fill Image (Misty Mountain Landscape - Visible ONLY on Mobile Hero Section) */}
        <div className="lg:hidden absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/mobile-hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover object-top"
          />
          {/* Subtle bottom fade to white blending smoothly into the search card */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* Desktop Bleed Image (Matches Apple Minimal Luxury Side-by-Side) */}
        <div className="hidden lg:block absolute top-0 right-0 w-[55%] xl:w-[53%] h-full pointer-events-none select-none overflow-hidden">
          {highValueHeroSlides.map((slide, idx) => (
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.model}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                slide.bgClass
              } ${activeHeroSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
            />
          ))}
          {/* Soft horizontal gradient fade from white on left */}
          <div className="absolute inset-y-0 left-0 w-40 xl:w-56 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          {/* Soft bottom fade where search card overlaps */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/50 to-transparent z-10" />

          {/* Desktop Floating High-Value Launch Badge in bottom right */}
          <div className="pointer-events-auto absolute bottom-12 right-12 z-20 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl py-2.5 px-4 text-slate-900 shadow-lg flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{currentHeroSlide.badge}</p>
              <p className="text-xs font-bold text-slate-950 mt-0.5">{currentHeroSlide.model}</p>
              <p className="text-[11px] font-semibold text-slate-700">{currentHeroSlide.price} · {currentHeroSlide.specs}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <button
                type="button"
                onClick={() =>
                  setActiveHeroSlide(
                    (prev) => (prev - 1 + highValueHeroSlides.length) % highValueHeroSlides.length
                  )
                }
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-90"
                aria-label="Previous launch"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveHeroSlide((prev) => (prev + 1) % highValueHeroSlides.length)
                }
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition active:scale-90"
                aria-label="Next launch"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Desktop Two-Column Layout */}
          <div className="hidden lg:grid grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="col-span-6 z-10">
              {/* Category Subhead with Line Accent */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-6 h-0.5 bg-slate-900 rounded-full inline-block"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-slate-800 uppercase">
                  PRE-OWNED CARS IN TAMIL NADU
                </span>
              </div>

              {/* Bold Apple-Style Headline (Pure Monochrome Black) */}
              <h1 className="text-5xl lg:text-6xl font-black text-slate-950 leading-[1.08] tracking-tight mb-4">
                Quality Used Cars.<br />
                <span className="text-slate-950">Hassle-Free.</span>
              </h1>

              {/* Minimal Clear Description */}
              <p className="text-slate-600 text-base leading-relaxed max-w-md mb-8 font-normal">
                Certified pre-owned cars, transparent pricing, and complete peace of mind for your next drive.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex items-center gap-3 mb-10">
                <button
                  onClick={() => {
                    const el = document.getElementById('featured-cars-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-7 py-3.5 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition active:scale-95"
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

              {/* Desktop 3 Key Trust Highlights */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-900 shrink-0 stroke-[1.8]" />
                  <div>
                    <p className="text-sm font-bold text-slate-950 leading-tight">2,500+</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Happy Owners</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-slate-900 shrink-0 stroke-[1.8]" />
                  <div>
                    <p className="text-sm font-bold text-slate-950 leading-tight">100%</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Verified & Inspected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-slate-900 shrink-0 stroke-[1.8]" />
                  <div>
                    <p className="text-sm font-bold text-slate-950 leading-tight">1-Year</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Engine Warranty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View: Clean White Typography on top, Full-Glory Car Carousel below (NO dark overlays covering the car!) */}
          <div className="lg:hidden w-full">
            {/* Top Text Content on Pure White */}
            <div className="mb-4">
              {/* Category Subhead with Line Accent */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-slate-900 rounded-full inline-block"></span>
                <span className="text-[11px] font-bold tracking-[0.18em] text-slate-700 uppercase">
                  PRE-OWNED CARS IN TAMIL NADU
                </span>
              </div>

              {/* Bold Apple-Style Headline (Pure Deep Black) */}
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-[1.1] tracking-tight mb-2">
                Quality Used Cars.<br />
                <span className="text-slate-950">Hassle-Free.</span>
              </h1>

              {/* Minimal Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-3.5">
                Certified pre-owned cars, transparent pricing, and complete peace of mind for your next drive.
              </p>

              {/* Action Buttons placed ergonomically right under text */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const el = document.getElementById('featured-cars-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-950 hover:bg-black active:scale-95 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <span>Explore Cars</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('sell')}
                  className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-900 font-semibold text-xs text-center transition shadow-2xs"
                >
                  Sell Your Car
                </button>
              </div>
            </div>

            {/* Car Showcase Carousel Card (Car is 100% VISIBLE, Crisp, Natural Lighting, ZERO Dark Overlays!) */}
            <div
              onTouchStart={handleHeroTouchStart}
              onTouchMove={handleHeroTouchMove}
              onTouchEnd={handleHeroTouchEnd}
              className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100 select-none"
            >
              {/* Carousel Images with Smooth Crossfade */}
              {highValueHeroSlides.map((slide, idx) => (
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.model}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                    slide.bgClass
                  } ${activeHeroSlide === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                />
              ))}

              {/* Top-Left Floating Badge: Car Model & Price in Clean Monochrome Frosted Glass */}
              <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 text-[10.5px] font-semibold text-slate-900 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                <span>{currentHeroSlide.model}</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-slate-950">{currentHeroSlide.price}</span>
              </div>

              {/* Top-Right Slide Counter */}
              <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-medium text-white shadow-xs">
                {activeHeroSlide + 1} / {highValueHeroSlides.length}
              </div>

              {/* Bottom Controls Bar (Clean and Non-Obstructive) */}
              <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
                {/* Pagination Dots */}
                <div className="pointer-events-auto flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
                  {highValueHeroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveHeroSlide(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        activeHeroSlide === idx
                          ? 'w-5 h-1 bg-white'
                          : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrows */}
                <div className="pointer-events-auto flex items-center gap-1">
                  <button
                    onClick={() =>
                      setActiveHeroSlide(
                        (prev) => (prev - 1 + highValueHeroSlides.length) % highValueHeroSlides.length
                      )
                    }
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm border border-slate-200/80 active:scale-90 transition backdrop-blur-xs"
                    aria-label="Previous launch"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveHeroSlide((prev) => (prev + 1) % highValueHeroSlides.length)
                    }
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm border border-slate-200/80 active:scale-90 transition backdrop-blur-xs"
                    aria-label="Next launch"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile 3 Trust Highlights (3 Columns with vertical dividers, Clean Monochrome Glass) */}
            <div className="grid grid-cols-3 divide-x divide-slate-200/90 text-center py-3 px-1 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl mt-3.5 shadow-2xs">
              <div className="flex flex-col items-center px-1">
                <Users className="w-4 h-4 text-slate-900 mb-1 stroke-[1.9]" />
                <span className="text-xs font-bold text-slate-950">2,500+</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Happy Owners</p>
              </div>

              <div className="flex flex-col items-center px-1">
                <ShieldCheck className="w-4 h-4 text-slate-900 mb-1 stroke-[1.9]" />
                <span className="text-xs font-bold text-slate-950">100%</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Verified & Inspected</p>
              </div>

              <div className="flex flex-col items-center px-1">
                <Wrench className="w-4 h-4 text-slate-900 mb-1 stroke-[1.9]" />
                <span className="text-xs font-bold text-slate-950">1-Year</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Engine Warranty</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Search & Filter Hub (Matches Reference Mockup in Image 1 & 2) */}
      <div className="max-w-6xl mx-auto px-4 relative z-20 -mt-6 sm:-mt-8 lg:-mt-12 mb-8 sm:mb-14">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.07)] border border-slate-200/80">
          {/* Top Search Tabs (Clean 1-Line Buttons with No Text Wrapping) */}
          <div className="flex items-center gap-1.5 sm:gap-3 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {}}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-xs transition shrink-0 whitespace-nowrap active:scale-95"
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Buy a Car</span>
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition shrink-0 whitespace-nowrap active:scale-95"
            >
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">Sell Your Car</span>
              <span className="sm:hidden">Sell Car</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition shrink-0 whitespace-nowrap active:scale-95"
            >
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              <span className="hidden sm:inline">EMI Calculator</span>
              <span className="sm:hidden">EMI Calc</span>
            </button>
          </div>

          {/* Search by Make/Model Input Row (Matches Image 1 & 2) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4" />
              <input
                type="text"
                placeholder="Search by brand, model or car type (e.g. Swift, City, Creta)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm font-normal pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200 focus:outline-none focus:border-slate-800 text-slate-900 placeholder-slate-400 transition"
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

            {/* Mobile Filter Button (1-tap quick access) */}
            <button
              onClick={() => onOpenFilter('all')}
              className={`sm:hidden p-3 rounded-xl border transition active:scale-95 shadow-xs relative ${
                activeFiltersCount > 0
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Open Filters"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Desktop Search Button (Matches Image 1) */}
            <button
              onClick={() => {
                const el = document.getElementById('featured-cars-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="hidden sm:inline-flex px-8 py-3.5 rounded-2xl bg-slate-950 hover:bg-black text-white font-semibold text-sm transition active:scale-95 shadow-xs whitespace-nowrap"
            >
              Search
            </button>

            {/* Mobile Search Icon Button (Matches Image 2) */}
            <button
              onClick={() => {
                const el = document.getElementById('featured-cars-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="sm:hidden p-3 rounded-xl bg-slate-950 text-white hover:bg-black transition active:scale-95 shadow-xs"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Quick Filter Pills Row (Apple-Style, Minimal Monochrome) */}
          <div className="pt-3 sm:pt-3.5 mt-3 sm:mt-3.5 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* Budget Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('budget')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
                  isBudgetFiltered
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{formatBudgetPill()}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isBudgetFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* KMs Driven Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('km')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
                  isKmFiltered
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
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
                className={`py-2 px-3 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
                  isFuelFiltered
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Fuel className={`w-3.5 h-3.5 ${isFuelFiltered ? 'text-slate-200' : 'text-slate-500'}`} />
                <span>{isFuelFiltered ? filters.fuel : 'Fuel'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isFuelFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* Year Filter Pill */}
              <button
                type="button"
                onClick={() => onOpenFilter('year')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
                  isYearFiltered
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${isYearFiltered ? 'text-slate-200' : 'text-slate-500'}`} />
                <span>{isYearFiltered ? filters.year : 'Year'}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${isYearFiltered ? 'text-slate-300' : 'text-slate-400'}`} />
              </button>

              {/* All Filters Button */}
              <button
                type="button"
                onClick={() => onOpenFilter('all')}
                className={`py-2 px-3.5 rounded-xl border text-xs font-semibold shrink-0 flex items-center gap-1.5 transition active:scale-95 shadow-2xs ml-auto ${
                  activeFiltersCount > 0
                    ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active Filters Summary Strip */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500 mr-1">Active:</span>

                  {isBudgetFiltered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
                      <span>{formatKmPill()}</span>
                      <button
                        onClick={() =>
                          setFilters({ ...filters, minKm: 0, maxKm: 100000, km: 'all' })
                        }
                        className="hover:text-red-500 ml-0.5"
                        title="Remove mileage filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {isFuelFiltered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
                      <span>{filters.fuel}</span>
                      <button
                        onClick={() => setFilters({ ...filters, fuel: 'All Fuels' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove fuel filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {isYearFiltered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
                      <span>{filters.year}</span>
                      <button
                        onClick={() => setFilters({ ...filters, year: 'All Years' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove year filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {isTransmissionFiltered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
                      <span className="capitalize">{filters.transmission}</span>
                      <button
                        onClick={() => setFilters({ ...filters, transmission: 'all' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove transmission filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {isOwnershipFiltered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-semibold border border-slate-200">
                      <span className="capitalize">{filters.ownership} Owner</span>
                      <button
                        onClick={() => setFilters({ ...filters, ownership: 'all' })}
                        className="hover:text-red-500 ml-0.5"
                        title="Remove ownership filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-600">
                  {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'} matching
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Logos Strip with Pan Gesture, Multi-Select & Vignette Selection */}
      <section id="brands-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Explore by Brand
              </h2>
              {selectedBrands.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-white">
                  {selectedBrands.length} selected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Choose from 180+ verified cars from world-class automakers (drag or swipe to pan)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedBrands.length > 0 && (
              <button
                onClick={handleClearBrands}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1.5 transition active:scale-95"
              >
                <span>Clear Filters ({selectedBrands.length})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Desktop Pan Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <button
                onClick={() => handleScrollBrands('left')}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollBrands('right')}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs transition active:scale-90"
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
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md animate-in zoom-in-75 duration-200 z-20">
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
                  className={`text-[11px] sm:text-xs font-semibold truncate max-w-full z-0 transition-colors ${
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
      <section id="body-types" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Browse by Body Type
          </h2>
          <button
            onClick={() => setActiveTab('cars')}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
                  setSelectedBodyType(isSelected ? null : body.id)
                }}
                className={`rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between transition border cursor-pointer text-center group active:scale-95 ${
                  isSelected
                    ? 'bg-white border-slate-900 shadow-lg ring-1 ring-slate-900'
                    : 'bg-white border-slate-100/90 hover:border-slate-300 shadow-2xs hover:shadow-md'
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
                  <p className="text-[12px] sm:text-base font-bold text-slate-900 leading-tight">
                    {body.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{body.count}</p>
                  <p className="hidden sm:block text-[11px] font-semibold text-slate-800 mt-1">
                    From {body.startingPrice}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Featured Cars Section */}
      <section id="featured-cars-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              Featured Cars
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              Hand-picked verified inventory ready for instant delivery in Tamil Nadu
            </p>
          </div>
          <button
            onClick={() => setActiveTab('cars')}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Cars Responsive Grid (1 col on mobile, 2 col on tablet, 3 col on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Car Image with Fixed Height & Object-Cover (Never Stretched!) */}
              <div
                className="relative w-full h-52 sm:h-56 bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => onSelectCar(car)}
              >
                <img
                  src={car.image || car.gallery[0]?.image}
                  alt={car.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top-Left Inspected Pill */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{car.homeInspectedBadge || 'Inspected'}</span>
                </div>

                {/* Top-Right Favorite Heart */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleWishlist(car.id)
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500 hover:bg-black/60 transition active:scale-90"
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
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Title & Price */}
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

                  {/* Variant & EMI */}
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <p className="text-slate-500 font-medium">{car.variant}</p>
                    <p className="text-slate-500 font-medium">{car.emi}</p>
                  </div>

                  {/* 4 Specs Row (Calendar, Gauge, Fuel, Transmission) */}
                  <div className="grid grid-cols-4 py-2.5 border-t border-b border-slate-100 text-[11px] sm:text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{car.year}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{car.km.replace(' km', '')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{car.fuel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{car.transmission}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (View Details & Book Test Drive) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onSelectCar(car)}
                    className="py-2.5 sm:py-3 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-50 active:scale-[0.99] transition text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onBookTestDrive(car)}
                    className="py-2.5 sm:py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs sm:text-sm active:scale-[0.99] transition text-center shadow-xs"
                  >
                    Book Test Drive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Nova Motors - Minimal Apple-Style Standard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-10 border border-slate-200/80">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-700">
              THE NOVA STANDARD
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1 mb-2 tracking-tight">
              Simple. Certified. Transparent.
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every vehicle undergoes our 200-point physical inspection with fixed transparent pricing and complete warranty cover.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">200+ Point Check</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Engine, body & electronics inspection</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <Award className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">1-Year Warranty</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Comprehensive engine & gearbox cover</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <Clock className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">7-Day Return</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">100% money back peace of mind</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-slate-900 mb-2" />
              <h4 className="font-bold text-slate-950 text-sm">Free RC Transfer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paperwork handled with zero fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Hub Banner (Minimalist) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14 mb-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src="/nova/dealer-thumb.jpg"
              alt="Nova Motors Showroom"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-100 shadow-2xs shrink-0"
            />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                Flagship Experience Hub
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-950 mt-0.5">
                Nova Motors Tiruppur Mega Showroom
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Kangeyam Road, Near Collectorate, Tiruppur • Open today till 8:30 PM</span>
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
              href="https://maps.google.com/?q=Tiruppur+Tamil+Nadu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs sm:text-sm transition text-center shadow-xs"
            >
              Get Showroom Directions
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

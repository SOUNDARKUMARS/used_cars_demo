import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ShieldCheck,
  Calendar,
  Gauge,
  Fuel,
  SlidersHorizontal,
  User,
  MessageCircle,
  Sun,
  Armchair,
  Tv,
  Video,
  Disc,
  Power,
  Fan,
  Wrench,
  FileText,
  FileCheck,
  MapPin,
  Star,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Maximize2,
} from 'lucide-react'
import { featuredCarData } from '../data/cars'

export default function CarDetailScreen({
  car = featuredCarData,
  onBack,
  onBookTestDrive,
  onOpenWhatsApp,
  onOpenCall,
  onOpenDealer,
  onOpenInspection,
  onOpenEmi,
  wishlist,
  onToggleWishlist,
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('photo')
    return p !== null ? Number(p) : 0
  })
  const [readMore, setReadMore] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Pan gesture & horizontal swipe gallery state
  const galleryScrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollStart, setScrollStart] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('photo')
    if (p !== null) {
      const idx = Number(p)
      if (idx >= 0 && idx < car.gallery.length) {
        setActivePhotoIndex(idx)
        const timer = setTimeout(() => {
          if (galleryScrollRef.current) {
            const w = galleryScrollRef.current.clientWidth || galleryScrollRef.current.offsetWidth || 380
            galleryScrollRef.current.scrollLeft = idx * w
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [car.gallery.length])

  const handleScroll = () => {
    if (!galleryScrollRef.current) return
    const { scrollLeft, clientWidth } = galleryScrollRef.current
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth)
      if (idx >= 0 && idx < car.gallery.length && idx !== activePhotoIndex) {
        setActivePhotoIndex(idx)
      }
    }
  }

  const handleMouseDown = (e) => {
    if (!galleryScrollRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    setStartX(e.pageX - galleryScrollRef.current.offsetLeft)
    setScrollStart(galleryScrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !galleryScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - galleryScrollRef.current.offsetLeft
    const walk = (x - startX) * 1.3
    if (Math.abs(walk) > 4) {
      setHasMoved(true)
    }
    galleryScrollRef.current.scrollLeft = scrollStart - walk
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (galleryScrollRef.current) {
      const { scrollLeft, clientWidth } = galleryScrollRef.current
      if (clientWidth > 0) {
        const targetIndex = Math.round(scrollLeft / clientWidth)
        const clampedIndex = Math.max(0, Math.min(car.gallery.length - 1, targetIndex))
        galleryScrollRef.current.scrollTo({
          left: clampedIndex * clientWidth,
          behavior: 'smooth',
        })
        setActivePhotoIndex(clampedIndex)
      }
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp()
    }
  }

  const scrollToPhoto = (idx) => {
    setActivePhotoIndex(idx)
    if (galleryScrollRef.current) {
      const width = galleryScrollRef.current.clientWidth
      galleryScrollRef.current.scrollTo({
        left: idx * width,
        behavior: 'smooth',
      })
    }
  }

  const handlePrevPhoto = (e) => {
    e.stopPropagation()
    const nextIdx = Math.max(0, activePhotoIndex - 1)
    scrollToPhoto(nextIdx)
  }

  const handleNextPhoto = (e) => {
    e.stopPropagation()
    const nextIdx = Math.min(car.gallery.length - 1, activePhotoIndex + 1)
    scrollToPhoto(nextIdx)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${car.title} ${car.variant} - Nova Motors`,
        text: `Check out this verified ${car.title} on Nova Motors for ${car.priceFormatted}`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
  }

  // Precise icons matching Image 2
  const featureIconMap = {
    Sun: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
      </svg>
    ),
    Armchair: (
      // Car seat silhouette
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M6 18h11a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-2" strokeLinecap="round" />
        <path d="M8 4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" strokeLinecap="round" />
        <circle cx="10" cy="5" r="1.5" />
      </svg>
    ),
    Tv: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect width="18" height="13" x="3" y="4" rx="2" />
        <path d="M8 20h8M12 17v3" strokeLinecap="round" />
      </svg>
    ),
    Video: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect width="13" height="11" x="2" y="6" rx="2" />
        <path d="m15 10 6-4v11l-6-4v-3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Gauge: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="m12 14 3-3" strokeLinecap="round" />
        <path d="M3.34 17a10 10 0 1 1 17.32 0" strokeLinecap="round" />
      </svg>
    ),
    Disc: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 3v6.5M12 14.5V21M3.5 14.5l6-2.5M14.5 12l6 2.5M5.5 7l5.5 3.5M13 13.5l5.5 3.5" strokeLinecap="round" />
      </svg>
    ),
    Power: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2v10" strokeLinecap="round" />
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" strokeLinecap="round" />
      </svg>
    ),
    Fan: (
      <svg className="w-5 h-5 text-slate-800 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  }

  const currentGalleryItem = car.gallery[activePhotoIndex] || car.gallery[0]

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16 selection:bg-slate-900 selection:text-white">
      {/* Mobile Top Navigation Bar (Shown on Mobile to match Image 2 exactly) */}
      <header className="md:hidden px-4 py-2 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-30 shadow-2xs">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-slate-900 hover:text-slate-600 rounded-full transition"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Center Logo */}
        <div className="flex items-center">
          <span className="font-black text-lg tracking-tight text-slate-900 font-sans">
            NOVA
          </span>
          <span className="font-light text-lg tracking-widest text-slate-500 font-sans ml-1.5">
            MOTORS
          </span>
        </div>

        {/* Right Icons: Heart & Share */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleWishlist(car.id)}
            className="p-1 text-slate-900 hover:text-red-500 transition"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-5 h-5 ${
                wishlist.includes(car.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-900 stroke-[2]'
              }`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-1 text-slate-900 hover:text-slate-600 transition relative"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5 stroke-[2]" />
            {copiedShare && (
              <span className="absolute -bottom-7 right-0 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
                Copied!
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Responsive Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        {/* Desktop Breadcrumbs & Top Bar */}
        <div className="hidden md:flex items-center justify-between pb-6 border-b border-slate-200/80 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={onBack} className="hover:text-slate-900 font-medium">
              Home
            </button>
            <span>/</span>
            <span className="text-slate-400">Inventory</span>
            <span>/</span>
            <span className="text-slate-400">{car.make}</span>
            <span>/</span>
            <span className="font-semibold text-slate-900">{car.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleWishlist(car.id)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-xs"
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlist.includes(car.id) ? 'fill-red-500 text-red-500' : 'text-slate-700'
                }`}
              />
              <span>{wishlist.includes(car.id) ? 'Saved' : 'Save to Wishlist'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Vehicle</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout on Desktop, 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (Gallery & In-Depth Details) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Main Photo Gallery with Pan Gesture & Snap Indexing */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-xs">
              {/* Hero Image Slider Container */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm group select-none">
                {/* Horizontal Scroll Snap Track with Pan Drag */}
                <div
                  ref={galleryScrollRef}
                  onScroll={handleScroll}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  className={`flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none select-none scroll-smooth ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {car.gallery.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="w-full min-w-full h-full snap-center shrink-0 relative bg-slate-100 flex items-center justify-center select-none"
                    >
                      <img
                        src={item.image}
                        alt={`${car.title} - ${item.label}`}
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Left Arrow Button (Desktop hover) */}
                {activePhotoIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition shadow-lg active:scale-90 z-20"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* Right Arrow Button (Desktop hover) */}
                {activePhotoIndex < car.gallery.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition shadow-lg active:scale-90 z-20"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* Inspected & Verified Badge (Matches Image 2) */}
                <div
                  onClick={onOpenInspection}
                  className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10.5px] sm:text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-black/90 transition z-20"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{car.inspectedBadge}</span>
                </div>

                {/* Photo Counter 1/12 (Matches Image 2, updates in real-time as user pans!) */}
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-md shadow-sm z-20 pointer-events-none">
                  {activePhotoIndex + 1} / {car.totalPhotos || car.gallery.length}
                </div>
              </div>

              {/* 5 Interactive Thumbnails (Matches Image 2, synchronized with snap index) */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-3">
                {car.gallery.map((item, idx) => {
                  const isSelected = activePhotoIndex === idx
                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => scrollToPhoto(idx)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-slate-900 border-transparent shadow-sm scale-[1.02]'
                          : 'border-slate-200/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.thumb}
                        alt={item.label}
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title & Price Section (Rendered on mobile, matches Image 2) */}
            <div className="md:hidden bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-baseline justify-between gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                  {car.title}
                </h1>
                <p className="text-lg font-bold text-slate-900 tracking-tight font-mono shrink-0 whitespace-nowrap">
                  {car.priceFormatted}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs text-slate-500 font-medium truncate">{car.variant}</p>
                <button
                  onClick={onOpenEmi}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-0.5 transition shrink-0 whitespace-nowrap"
                >
                  <span>{car.emi}</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* 5 Key Specs Row (Exact match to Image 2) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-slate-200/80 shadow-xs overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 hidden sm:block">
                Vehicle Overview
              </h3>
              <div className="grid grid-cols-5 py-2 sm:py-3 text-center divide-x divide-slate-100">
                {/* Year */}
                <div className="flex flex-col items-center px-0.5">
                  <div className="flex items-center gap-1 mb-0.5 text-slate-800">
                    <img src="/icons/reg-year.png" alt="Year" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-[11px] sm:text-sm font-bold truncate">{car.year}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate">Year</span>
                </div>

                {/* Driven */}
                <div className="flex flex-col items-center px-0.5">
                  <div className="flex items-center gap-1 mb-0.5 text-slate-800">
                    <img src="/icons/odometer.png" alt="Odometer" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-[11px] sm:text-sm font-bold truncate">{car.km.replace(' km', '')}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate">Driven</span>
                </div>

                {/* Fuel */}
                <div className="flex flex-col items-center px-0.5">
                  <div className="flex items-center gap-1 mb-0.5 text-slate-800">
                    <img src="/icons/fuel.png" alt="Fuel" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-[11px] sm:text-sm font-bold truncate">{car.fuel}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate">Fuel</span>
                </div>

                {/* Transmission */}
                <div className="flex flex-col items-center px-0.5">
                  <div className="flex items-center gap-1 mb-0.5 text-slate-800">
                    <img src="/icons/transmission.png" alt="Transmission" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-[11px] sm:text-sm font-bold truncate">{car.transmission}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate">Transmission</span>
                </div>

                {/* Ownership */}
                <div className="flex flex-col items-center px-0.5">
                  <div className="flex items-center gap-1 mb-0.5 text-slate-800">
                    <img src="/icons/ownership.png" alt="Ownership" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-[11px] sm:text-sm font-bold truncate">{car.ownership}</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate">Ownership</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Rendered on mobile, matches Image 2) */}
            <div className="md:hidden grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onBookTestDrive(car)}
                className="py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-xs"
              >
                <Calendar className="w-4 h-4 text-slate-700" />
                <span>Book Test Drive</span>
              </button>

              <button
                onClick={() => onOpenWhatsApp(car)}
                className="py-3 rounded-xl bg-[#111827] hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-slate-200" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            {/* About this car Section (Matches Image 2) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                About this car
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {readMore ? car.aboutFull : car.aboutSummary}
              </p>
              <button
                onClick={() => setReadMore(!readMore)}
                className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 mt-2 transition"
              >
                <span>{readMore ? 'Read Less' : 'Read More'}</span>
                {readMore ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Key Features Section (2x4 Grid on mobile, expands on desktop, matches Image 2) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Key Features
                </h2>
                <button
                  onClick={onOpenInspection}
                  className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-600 inline-flex items-center gap-1 transition"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                {car.keyFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className="rounded-2xl p-2.5 sm:p-3 bg-[#f8fafc] border border-slate-100 flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 transition hover:bg-slate-50 hover:shadow-xs"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                      {feat.iconUrl ? (
                        <img src={feat.iconUrl} alt={feat.name} className="w-6 h-6 sm:w-7 sm:h-7 object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      ) : (
                        featureIconMap[feat.iconName] || (
                          <Sun className="w-5 h-5 text-slate-700" />
                        )
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-tight">
                      {feat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Condition & History Section (2x2 Grid, matches Image 2) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3">
                Condition & History
              </h2>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {/* Card 1: Inspected */}
                <div
                  onClick={onOpenInspection}
                  className="p-3 sm:p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-start gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img src="/icons/quality-check-140.png" alt="Inspected" className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Inspected</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">200+ point check</p>
                  </div>
                </div>

                {/* Card 2: Service History */}
                <div
                  onClick={onOpenInspection}
                  className="p-3 sm:p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-start gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img src="/icons/service-icon.svg" alt="Service History" className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Service History</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Available</p>
                  </div>
                </div>

                {/* Card 3: No Major Accidents */}
                <div
                  onClick={onOpenInspection}
                  className="p-3 sm:p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-start gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img src="/icons/verified-seller.png" alt="Verified" className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">No Major Accidents</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Verified</p>
                  </div>
                </div>

                {/* Card 4: RC Verified */}
                <div
                  onClick={onOpenInspection}
                  className="p-3 sm:p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-start gap-3 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img src="/icons/rc-icon.svg" alt="RC Verified" className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">RC Verified</p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Valid till 2028</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dealer Card (Matches Image 2) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={car?.dealer?.image || '/nova/dealer-thumb.jpg'}
                  alt={car?.dealer?.name || 'Authorized Dealer'}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-slate-100 shadow-xs"
                />
                <div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 leading-snug">
                    {car.dealer.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{car.dealer.location}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] sm:text-xs text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                    <span>{car.dealer.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({car.dealer.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenDealer}
                className="py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold text-xs sm:text-sm inline-flex items-center gap-1 transition"
              >
                <span>View Dealer</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column (Desktop Sticky Booking & Pricing Panel) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-5">
              {/* Inspected Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
                  <ShieldCheck className="w-4 h-4 text-white" /> Inspected & Verified
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: NM-409</span>
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {car.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{car.variant}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-900 font-mono">
                    {car.priceFormatted}
                  </p>
                  <span className="text-xs text-slate-500">Fixed Transparent Price</span>
                </div>
              </div>

              {/* EMI Box */}
              <div
                onClick={onOpenEmi}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
              >
                <div>
                  <p className="text-[11px] text-slate-600 font-semibold">Easy Monthly EMI</p>
                  <p className="text-sm font-bold text-slate-950 font-mono mt-0.5">
                    {car.emi}
                  </p>
                </div>
                <button className="text-xs font-bold text-slate-900 inline-flex items-center gap-1">
                  Customize <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onBookTestDrive(car)}
                  className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Free Doorstep Test Drive</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenWhatsApp(car)}
                    className="py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 text-slate-200" />
                    <span>WhatsApp Chat</span>
                  </button>
                  <button
                    onClick={onOpenCall}
                    className="py-3 rounded-2xl border border-slate-300 text-slate-900 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Concierge</span>
                  </button>
                </div>
              </div>

              {/* Guarantee bullets */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>7-Day 100% Money Back Return Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>1-Year Comprehensive Warranty Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  <span>Free RTO Registration & Paperwork Transfer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (ONLY visible on mobile, exactly matching Image 2!) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 md:hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Price & EMI */}
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight font-mono">
              {car.priceFormatted}
            </p>
            <p
              onClick={onOpenEmi}
              className="text-[11px] text-slate-500 font-medium cursor-pointer hover:text-slate-900"
            >
              {car.emi}
            </p>
          </div>

          {/* Action Buttons: Call & Book Test Drive */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCall}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs flex items-center gap-1.5 active:scale-[0.99] transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-slate-700" />
              <span>Call</span>
            </button>

            <button
              onClick={() => onBookTestDrive(car)}
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 active:scale-[0.99] transition shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Book Test Drive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

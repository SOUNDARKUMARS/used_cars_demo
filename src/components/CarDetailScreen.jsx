import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
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
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Maximize2,
  ArrowLeft,
  Car,
  LayoutDashboard,
  Layers,
  X,
} from 'lucide-react'
import { renderFeatureIcon, getFeatureById } from '../data/featuresBank'
import { formatINR, formatTenureLabel, resolveCarEmi } from '../data/carStorage'
import { trackCarView } from '../lib/analytics'
import BrandLogo from './BrandLogo'
import { BRAND_NAME } from '../config/brand'

export const PHOTO_CATEGORY_CONFIG = {
  interior: {
    id: 'interior',
    title: 'Interior & Dashboard',
    shortTitle: 'Interior',
    icon: LayoutDashboard,
  },
  cabin: {
    id: 'cabin',
    title: 'Seats & Cabin',
    shortTitle: 'Cabin & Seats',
    icon: Armchair,
  },
  mechanical: {
    id: 'mechanical',
    title: 'Engine & Boot Space',
    shortTitle: 'Engine & Boot',
    icon: Gauge,
  },
  exterior: {
    id: 'exterior',
    title: 'Exterior Views',
    shortTitle: 'Exterior',
    icon: Car,
  },
}

export const CATEGORY_ORDER = ['exterior', 'interior', 'cabin', 'mechanical']

function CarEmiOffer({ car }) {
  const offer = resolveCarEmi(car)

  if (!offer.available) {
    return (
      <div
        className="rounded-2xl border border-slate-200 p-4"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e5e7eb 100%)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Finance</p>
        <p className="text-sm font-bold text-slate-950 mt-1">EMI not available</p>
        <p className="text-xs text-slate-600 mt-1">This car is offered for full payment only.</p>
        {offer.note ? <p className="text-xs text-slate-800 mt-2 leading-relaxed">{offer.note}</p> : null}
      </div>
    )
  }

  if (offer.legacy) {
    return (
      <div
        className="rounded-2xl border border-slate-200 p-4"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Monthly EMI</p>
        <p className="text-sm font-bold text-slate-950 font-mono mt-1">{offer.label}</p>
        {offer.note ? <p className="text-xs text-slate-700 mt-2 leading-relaxed">{offer.note}</p> : null}
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-slate-200 p-4"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%)' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Monthly EMI</p>
      <p className="text-lg font-bold text-slate-950 font-mono mt-0.5">
        {formatINR(offer.monthly)}
        <span className="text-xs font-semibold text-slate-500"> / month</span>
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-3 text-xs">
        <div>
          <p className="text-slate-500">Upfront payment</p>
          <p className="font-semibold text-slate-950 font-mono">{formatINR(offer.upfront)}</p>
        </div>
        <div>
          <p className="text-slate-500">Loan amount</p>
          <p className="font-semibold text-slate-950 font-mono">{formatINR(offer.loan)}</p>
        </div>
        <div>
          <p className="text-slate-500">Interest</p>
          <p className="font-semibold text-slate-950">{Number(offer.rate)}% per year</p>
        </div>
        <div>
          <p className="text-slate-500">Tenure</p>
          <p className="font-semibold text-slate-950">{formatTenureLabel(offer.tenureMonths)}</p>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-3">
        Total you pay: <span className="font-semibold text-slate-950 font-mono">{formatINR(offer.totalPayable)}</span>
        <span className="text-slate-500"> (upfront plus all installments)</span>
      </p>
      {offer.note ? <p className="text-xs text-slate-800 mt-2 leading-relaxed">{offer.note}</p> : null}
    </div>
  )
}

export default function CarDetailScreen({
  car = null,
  onBack,
  onBookTestDrive,
  onOpenWhatsApp,
  onOpenCall,
  onOpenDealer,
  onOpenInspection,
  wishlist = [],
  onToggleWishlist,
}) {
  const [readMore, setReadMore] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)

  // Normalize gallery: handle missing categories, ensure proper labels and icons
  const normalizedGallery = useMemo(() => {
    const rawList = Array.isArray(car?.gallery) && car.gallery.length > 0
      ? car.gallery
      : (car?.image || car?.detailHeroImage
          ? [{ id: 'hero-cover', label: 'Exterior Front', category: 'exterior', image: car.image || car.detailHeroImage, thumb: car.image || car.detailHeroImage }]
          : [{ id: 'hero-cover', label: 'Exterior Front', category: 'exterior', image: '/mock_cars/honda_city_front.jpg', thumb: '/mock_cars/honda_city_front.jpg' }])

    return rawList.map((item, idx) => {
      let category = item?.category
      if (!category) {
        const l = (item?.label || '').toLowerCase()
        if (l.includes('interior') || l.includes('cockpit') || l.includes('dashboard') || l.includes('steering') || l.includes('infotainment')) {
          category = 'interior'
        } else if (l.includes('seat') || l.includes('cabin') || l.includes('sunroof') || l.includes('legroom')) {
          category = 'cabin'
        } else if (l.includes('engine') || l.includes('boot') || l.includes('trunk') || l.includes('tyre') || l.includes('wheel') || l.includes('mechanical')) {
          category = 'mechanical'
        } else {
          category = 'exterior'
        }
      }
      const config = PHOTO_CATEGORY_CONFIG[category] || PHOTO_CATEGORY_CONFIG.exterior

      return {
        ...item,
        id: item?.id || `photo-${idx}-${Date.now()}`,
        category,
        categoryTitle: config.title,
        categoryShortTitle: config.shortTitle,
        categoryIcon: config.icon,
        label: item?.label || `${config.shortTitle} View ${idx + 1}`,
        image: item?.image || item?.thumb || '',
        thumb: item?.thumb || item?.image || '',
      }
    })
  }, [car?.gallery, car?.image, car?.detailHeroImage])

  // Category counts computed from vehicle's photos
  const categoryCounts = useMemo(() => {
    const counts = { exterior: 0, interior: 0, cabin: 0, mechanical: 0 }
    normalizedGallery.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++
      } else {
        counts.exterior++
      }
    })
    return counts
  }, [normalizedGallery])

  // Listing thumbnail first, then exterior, interior, cabin, and mechanical.
  const orderedGallery = useMemo(() => {
    const listingImage = car?.image || ''
    const copy = [...normalizedGallery]
    copy.sort((a, b) => {
      const thumbRank = (item) => {
        if (listingImage && item.image === listingImage) return 0
        if (item.isCover) return 1
        return 2
      }
      const thumbDiff = thumbRank(a) - thumbRank(b)
      if (thumbDiff !== 0) return thumbDiff
      const orderA = CATEGORY_ORDER.indexOf(a.category)
      const orderB = CATEGORY_ORDER.indexOf(b.category)
      const rankA = orderA === -1 ? 99 : orderA
      const rankB = orderB === -1 ? 99 : orderB
      return rankA - rankB
    })
    return copy
  }, [normalizedGallery, car?.image])

  // Available Category Tabs: Only display actual categories that contain photos (NO "All Photos")
  const availableCategories = useMemo(() => {
    const tabs = []
    CATEGORY_ORDER.forEach((catId) => {
      const count = categoryCounts[catId] || 0
      if (count > 0 && PHOTO_CATEGORY_CONFIG[catId]) {
        tabs.push({
          ...PHOTO_CATEGORY_CONFIG[catId],
          count,
        })
      }
    })
    return tabs
  }, [categoryCounts])

  const [activePhotoIndex, setActivePhotoIndex] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('photo')
    return p !== null ? Number(p) : 0
  })

  const currentPhoto = orderedGallery[activePhotoIndex] || orderedGallery[0] || null
  const activeCategory = currentPhoto?.category || availableCategories[0]?.id || 'exterior'

  // Pan gesture & horizontal swipe gallery state
  const galleryScrollRef = useRef(null)
  const thumbnailsScrollRef = useRef(null)
  const categoryTabsRef = useRef(null)
  const studioStageRef = useRef(null)
  const studioTrackRef = useRef(null)
  const studioDragRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollStart, setScrollStart] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)

  const galleryLength = orderedGallery.length

  useEffect(() => {
    if (!car) return
    trackCarView(car, { screen: 'detail' })
  }, [car?.id])

  useEffect(() => {
    if (!car) return
    const p = new URLSearchParams(window.location.search).get('photo')
    if (p !== null) {
      const idx = Number(p)
      if (idx >= 0 && idx < galleryLength) {
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
  }, [car, galleryLength])

  // Keep active thumbnail centered in view
  useEffect(() => {
    if (!thumbnailsScrollRef.current) return
    const activeThumb = thumbnailsScrollRef.current.children[activePhotoIndex]
    if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [activePhotoIndex])

  // Keep active category tab visible as user scrolls through gallery
  useEffect(() => {
    if (!categoryTabsRef.current) return
    const activeTabEl = categoryTabsRef.current.querySelector('[data-active="true"]')
    if (activeTabEl && typeof activeTabEl.scrollIntoView === 'function') {
      activeTabEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest',
      })
    }
  }, [activeCategory])

  // Fullscreen modal keyboard navigation
  useEffect(() => {
    if (!isFullscreenOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => Math.min(orderedGallery.length - 1, prev + 1))
      } else if (e.key === 'Escape') {
        setIsFullscreenOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreenOpen, orderedGallery.length])

  // After a swipe commits, the track's middle slide is the new photo.
  // Reset before paint so the strip does not jump to the wrong frame.
  useLayoutEffect(() => {
    const track = studioTrackRef.current
    if (!track || studioDragRef.current) return
    track.style.transition = 'none'
    track.style.transform = 'translateX(-33.333%)'
  }, [activePhotoIndex, isFullscreenOpen])

  if (!car) {
    return (
      <div className="w-full min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Car className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Vehicle Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested vehicle listing is not available or has been updated in our inventory.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-hover transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory</span>
          </button>
        </div>
      </div>
    )
  }

  const handleCategoryTabClick = (categoryId) => {
    const targetIdx = orderedGallery.findIndex((p) => p.category === categoryId)
    if (targetIdx !== -1) {
      scrollToPhoto(targetIdx)
    }
  }

  const handleScroll = () => {
    if (!galleryScrollRef.current) return
    const { scrollLeft, clientWidth } = galleryScrollRef.current
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth)
      if (idx >= 0 && idx < orderedGallery.length && idx !== activePhotoIndex) {
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

  const onStudioPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return
    if (e.target.closest('button')) return
    const stage = studioStageRef.current
    const track = studioTrackRef.current
    if (!stage || !track) return
    track.style.transition = 'none'
    studioDragRef.current = { id: e.pointerId, x: e.clientX, t: Date.now(), dx: 0 }
    try {
      stage.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is unavailable for this event. Move events still update the strip.
    }
  }

  const onStudioPointerMove = (e) => {
    const drag = studioDragRef.current
    if (!drag || drag.id !== e.pointerId) return
    const stage = studioStageRef.current
    const track = studioTrackRef.current
    if (!stage || !track) return
    let dx = e.clientX - drag.x
    const last = orderedGallery.length - 1
    if ((activePhotoIndex <= 0 && dx > 0) || (activePhotoIndex >= last && dx < 0)) {
      dx *= 0.32
    }
    drag.dx = dx
    track.style.transform = `translateX(calc(-33.333% + ${dx}px))`
  }

  const onStudioPointerUp = (e) => {
    const drag = studioDragRef.current
    if (!drag || drag.id !== e.pointerId) return
    studioDragRef.current = null
    const stage = studioStageRef.current
    const track = studioTrackRef.current
    if (!stage || !track) return
    const width = stage.clientWidth || 1
    const dx = drag.dx || 0
    const velocity = dx / Math.max(1, Date.now() - drag.t)
    const last = orderedGallery.length - 1
    const commitNext = activePhotoIndex < last && (dx < -width * 0.18 || velocity < -0.45)
    const commitPrev = activePhotoIndex > 0 && (dx > width * 0.18 || velocity > 0.45)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      track.style.transition = 'none'
      track.style.transform = 'translateX(-33.333%)'
      if (commitNext) setActivePhotoIndex((prev) => Math.min(last, prev + 1))
      else if (commitPrev) setActivePhotoIndex((prev) => Math.max(0, prev - 1))
      return
    }
    const shift = commitNext ? -66.666 : commitPrev ? 0 : -33.333
    track.style.transition = 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)'
    track.style.transform = `translateX(${shift}%)`
    if (!commitNext && !commitPrev) return
    const onDone = () => {
      track.removeEventListener('transitionend', onDone)
      setActivePhotoIndex((prev) => {
        if (commitNext) return Math.min(last, prev + 1)
        return Math.max(0, prev - 1)
      })
    }
    track.addEventListener('transitionend', onDone)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (galleryScrollRef.current) {
      const { scrollLeft, clientWidth } = galleryScrollRef.current
      if (clientWidth > 0) {
        const targetIndex = Math.round(scrollLeft / clientWidth)
        const clampedIndex = Math.max(0, Math.min(orderedGallery.length - 1, targetIndex))
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
    const clampedIndex = Math.max(0, Math.min(orderedGallery.length - 1, idx))
    setActivePhotoIndex(clampedIndex)
    if (galleryScrollRef.current) {
      const width = galleryScrollRef.current.clientWidth
      galleryScrollRef.current.scrollTo({
        left: clampedIndex * width,
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
    const nextIdx = Math.min(orderedGallery.length - 1, activePhotoIndex + 1)
    scrollToPhoto(nextIdx)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${car.title} ${car.variant} - ${BRAND_NAME}`,
        text: `Check out this verified ${car.title} on ${BRAND_NAME} for ${car.priceFormatted}`,
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

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 min-h-screen pb-36 md:pb-16 selection:bg-brand selection:text-white">
      {/* Mobile Top Navigation Bar (Shown on Mobile to match Image 2 exactly) */}
      <header className="md:hidden sticky top-0 z-30 flex min-h-[3.75rem] items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 shadow-2xs">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-900 transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Center Logo */}
        <div className="flex min-w-0 flex-1 items-center justify-center px-1">
          <BrandLogo imgClassName="h-10 w-auto max-w-[min(240px,calc(100vw-6.5rem))] object-contain" />
        </div>

        {/* Right Icons: Heart & Share */}
        <div className="flex w-[4.75rem] shrink-0 items-center justify-end gap-2">
          <button
            onClick={() => onToggleWishlist(car?.id)}
            className="p-1 text-slate-900 hover:text-red-500 transition"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-5 h-5 ${
                wishlist.includes(car?.id)
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
              <span className="absolute -bottom-7 right-0 bg-slate-900 text-white text-xs px-2 py-0.5 rounded-lg shadow">
                Copied!
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Responsive Container */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        {/* Desktop Breadcrumbs & Top Bar */}
        <div className="hidden md:flex items-center justify-between pb-6 border-b border-slate-200/80 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={onBack} className="hover:text-slate-900 font-medium">
              Home
            </button>
            <span>/</span>
            <span className="text-slate-400">Inventory</span>
            <span>/</span>
            <span className="text-slate-400">{car?.make}</span>
            <span>/</span>
            <span className="font-semibold text-slate-900">{car?.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleWishlist(car?.id)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-xs"
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlist.includes(car?.id) ? 'fill-red-500 text-red-500' : 'text-slate-700'
                }`}
              />
              <span>{wishlist.includes(car?.id) ? 'Saved' : 'Save to Wishlist'}</span>
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
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Gallery, thumbs, and title share one block. The photo uses the column width. */}
            <div>
              {availableCategories.length > 1 && (
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div
                    ref={categoryTabsRef}
                    className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5"
                  >
                    {availableCategories.map((tab) => {
                      const TabIcon = tab.icon
                      const isActive = activeCategory === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          data-active={isActive ? 'true' : 'false'}
                          onClick={() => handleCategoryTabClick(tab.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-brand text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 border border-slate-200/60'
                          }`}
                        >
                          <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          <span>{tab.shortTitle}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Fullscreen Expand Button (Themed) */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-950 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition shrink-0 cursor-pointer"
                    title="Open Fullscreen Studio"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Studio</span>
                  </button>
                </div>
              )}

              <div className="group relative -mx-4 aspect-[16/10] w-[calc(100%+2rem)] select-none overflow-hidden bg-slate-100 sm:-mx-6 sm:aspect-[16/9] sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full lg:rounded-2xl">
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
                  {orderedGallery.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        if (!hasMoved) setIsFullscreenOpen(true)
                      }}
                      className="w-full min-w-full h-full snap-center shrink-0 relative bg-slate-100 flex items-center justify-center select-none cursor-pointer"
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
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition shadow-lg active:scale-90 z-20 cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* Right Arrow Button (Desktop hover) */}
                {activePhotoIndex < orderedGallery.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md transition shadow-lg active:scale-90 z-20 cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.2]" />
                  </button>
                )}

                {/* Inspected & Verified Badge */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenInspection()
                  }}
                  className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10.5px] sm:text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-black/90 transition z-20"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{car.inspectedBadge || 'Inspected & Verified'}</span>
                </div>

                {/* Top-Right: Category & Perspective Badge (Themed monochrome) */}
                {currentPhoto && (
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white text-[10.5px] sm:text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md z-20 pointer-events-none max-w-[65%] sm:max-w-none">
                    {React.createElement(currentPhoto.categoryIcon || Car, {
                      className: 'w-3.5 h-3.5 text-white/80 shrink-0',
                    })}
                    <span className="font-semibold text-white whitespace-nowrap">{currentPhoto.categoryShortTitle}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/90 truncate">{currentPhoto.label}</span>
                  </div>
                )}

                {/* Bottom-Left: Expand Studio Button */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="absolute bottom-3 left-3 bg-black/60 hover:bg-black/85 backdrop-blur-md text-white/90 text-[10.5px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition z-20 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3 text-white" />
                  <span className="hidden sm:inline">Studio</span>
                </button>

                {/* Photo Counter 1/N (Accurate based on total vehicle gallery length!) */}
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-0.5 rounded-xl shadow-sm z-20 pointer-events-none flex items-center gap-1.5">
                  <span>{activePhotoIndex + 1} / {orderedGallery.length}</span>
                </div>
              </div>

              <div className="relative -mx-4 mt-1.5 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full">
                <div
                  ref={thumbnailsScrollRef}
                  className="scrollbar-none flex snap-x items-center gap-2 overflow-x-auto px-4 py-1.5 sm:gap-2.5 lg:px-0"
                >
                  {orderedGallery.map((item, idx) => {
                    const isSelected = activePhotoIndex === idx
                    return (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => scrollToPhoto(idx)}
                        className={`relative aspect-[16/10] w-[24%] sm:w-[18%] md:w-[16%] min-w-[80px] sm:min-w-[104px] max-w-[130px] rounded-xl overflow-hidden bg-slate-100 transition-all duration-200 border-2 cursor-pointer shrink-0 snap-center group ${
                          isSelected
                            ? 'border-slate-950 shadow-md opacity-100'
                            : 'border-slate-200/80 opacity-70 hover:opacity-100 hover:border-slate-400'
                        }`}
                        title={`${item.categoryShortTitle}: ${item.label}`}
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

              <div className="pt-2 lg:hidden">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="min-w-0 text-lg font-bold leading-snug tracking-tight text-slate-900">
                    {car.title}
                  </h1>
                  <p className="shrink-0 whitespace-nowrap font-mono text-lg font-bold tracking-tight text-slate-900">
                    {car.priceFormatted && car.priceFormatted !== '₹ 0' ? car.priceFormatted : (car.price ? formatINR(car.price) : '₹ 0')}
                  </p>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xs font-medium text-slate-500">{car.variant}</p>
                  <p className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-600">
                    {resolveCarEmi(car).label}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <CarEmiOffer car={car} />
            </div>

            {/* 5 Key Specs Row (Exact match to Image 2) */}
            <div className="ui-inset-surface overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 hidden sm:block">
                Vehicle Overview
              </h3>
              <div className="grid grid-cols-5 divide-x divide-slate-100 text-center">
                {[
                  { icon: '/icons/reg-year.png', alt: 'Year', value: car?.year, label: 'Year' },
                  { icon: '/icons/odometer.png', alt: 'Odometer', value: car?.km ? String(car.km).replace(' km', '') : '', label: 'Driven' },
                  { icon: '/icons/fuel.png', alt: 'Fuel', value: car?.fuel, label: 'Fuel' },
                  { icon: '/icons/transmission.png', alt: 'Transmission', value: car?.transmission, label: 'Gearbox' },
                  { icon: '/icons/ownership.png', alt: 'Ownership', value: car?.ownership, label: 'Owner' },
                ].map((spec) => (
                  <div key={spec.label} className="flex flex-col items-center gap-1.5 px-1 py-1 min-w-0">
                    <img src={spec.icon} alt={spec.alt} className="w-5 h-5 object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight min-h-[2lh] flex items-center justify-center text-balance break-words max-w-full">{spec.value}</span>
                    <span className="text-[11px] text-slate-500 font-medium leading-none">{spec.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons (Rendered on mobile, matches Image 2) */}
            <div className="md:hidden grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onBookTestDrive(car)}
                className="ui-inset-surface flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 py-3 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4 text-slate-700" />
                <span>Book Test Drive</span>
              </button>

              <button
                onClick={() => onOpenWhatsApp(car)}
                className="ui-btn-whatsapp flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-slate-950 transition active:scale-[0.99]"
              >
                <MessageCircle className="h-4 w-4 text-slate-950" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>

            {/* About this car Section (Matches Image 2) */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                About this car
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {readMore
                  ? (car?.aboutFull || car?.aboutSummary || 'Detailed 200-point inspection completed with verified systems.')
                  : (car?.aboutSummary || car?.aboutFull || 'Certified pre-owned vehicle with comprehensive quality inspection passed.')}
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
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

              <div className="grid grid-cols-2 gap-x-4">
                {(car.keyFeatures || []).map((feat, idx) => {
                  const featObj =
                    typeof feat === 'string'
                      ? getFeatureById(feat) || { id: feat, name: feat, iconName: 'Sparkles' }
                      : feat
                  const iconName = featObj.iconName || 'Sparkles'
                  const displayName = featObj.name || featObj.id || 'Feature'

                  return (
                    <div
                      key={featObj.id || idx}
                      className="flex min-h-12 items-center gap-2.5 py-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        {featObj.iconUrl ? (
                          <img
                            src={featObj.iconUrl}
                            alt=""
                            className="h-4 w-4 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          featureIconMap[iconName] ||
                          renderFeatureIcon(iconName, 'h-4 w-4 text-slate-700')
                        )}
                      </span>
                      <span className="min-w-0 text-[13px] font-medium leading-snug text-slate-800 text-balance">
                        {displayName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Condition & History Section (2x2 Grid, matches Image 2) */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
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
                    <p className="text-xs text-slate-500 mt-0.5">200+ point check</p>
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
                    <p className="text-xs text-slate-500 mt-0.5">Available</p>
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
                    <p className="text-xs text-slate-500 mt-0.5">Verified</p>
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
                    <p className="text-xs text-slate-500 mt-0.5">Valid till 2028</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop Sticky Booking & Pricing Panel) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xl space-y-5">
              {/* Inspected Badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand text-white">
                  <ShieldCheck className="w-4 h-4 text-white" /> Inspected & Verified
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: NM-409</span>
              </div>

              {/* Title & Price */}
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {car?.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{car?.variant}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-slate-900 font-mono">
                    {car?.priceFormatted && car?.priceFormatted !== '₹ 0' ? car.priceFormatted : (car?.price ? formatINR(car.price) : '₹ 0')}
                  </p>
                  <span className="text-xs text-slate-500">Fixed Transparent Price</span>
                </div>
              </div>

              <CarEmiOffer car={car} />

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onBookTestDrive(car)}
                  className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md hover:shadow-xl transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Free Doorstep Test Drive</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenWhatsApp(car)}
                    className="ui-btn-whatsapp flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-semibold text-slate-950 transition active:scale-[0.99]"
                  >
                    <MessageCircle className="h-4 w-4 text-slate-950" />
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
      <div className="ui-inset-bar-top fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Price & EMI */}
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight font-mono">
              {car.priceFormatted && car.priceFormatted !== '₹ 0' ? car.priceFormatted : (car.price ? formatINR(car.price) : '₹ 0')}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {resolveCarEmi(car).label}
            </p>
          </div>

          {/* Action Buttons: Call & Book Test Drive */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCall}
              className="ui-inset-surface flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99]"
            >
              <Phone className="w-3.5 h-3.5 text-slate-700" />
              <span>Call</span>
            </button>

            <button
              onClick={() => onBookTestDrive(car)}
              className="py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs flex items-center gap-1.5 active:scale-[0.99] transition shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-white" />
              <span>Book Test Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Studio Lightbox Modal */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none"
          >
            {/* Lightbox Header */}
            <div className="flex w-full max-w-6xl items-center justify-between gap-3 mx-auto text-white">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                  {car.title}
                </h3>
                {car.variant && !String(car.title || '').toLowerCase().includes(String(car.variant).toLowerCase()) && (
                  <p className="truncate text-xs font-normal text-white/55">{car.variant}</p>
                )}
                {currentPhoto && (
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-white/80">
                    {React.createElement(currentPhoto.categoryIcon || Car, { className: 'h-3.5 w-3.5 shrink-0 text-white/80' })}
                    <span className="truncate">
                      {currentPhoto.categoryTitle}
                      <span className="text-white/30"> • </span>
                      <span className="text-white/60">{currentPhoto.label}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                  {activePhotoIndex + 1} / {orderedGallery.length}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  aria-label="Close fullscreen view"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Main Image & Prev/Next */}
            <div
              ref={studioStageRef}
              onPointerDown={onStudioPointerDown}
              onPointerMove={onStudioPointerMove}
              onPointerUp={onStudioPointerUp}
              onPointerCancel={onStudioPointerUp}
              className="relative my-4 flex w-full max-w-6xl flex-1 cursor-grab touch-none items-center overflow-hidden active:cursor-grabbing"
            >
              <div
                ref={studioTrackRef}
                className="flex h-full w-[300%] shrink-0"
                style={{ transform: 'translateX(-33.333%)' }}
              >
                {[-1, 0, 1].map((offset) => {
                  const photo = orderedGallery[activePhotoIndex + offset]
                  return (
                    <div key={offset} className="flex h-full w-1/3 shrink-0 items-center justify-center">
                      {photo ? (
                        <img
                          src={photo.image}
                          alt={photo.label}
                          draggable={false}
                          className="max-h-[75vh] max-w-full select-none rounded-xl object-contain"
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
              {activePhotoIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIndex((prev) => Math.max(0, prev - 1))
                  }}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition shadow-xl cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {activePhotoIndex < orderedGallery.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActivePhotoIndex((prev) => Math.min(orderedGallery.length - 1, prev + 1))
                  }}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition shadow-xl cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

            </div>

            {/* Lightbox Bottom Strip: Categories & Thumbnails */}
            <div className="w-full max-w-4xl mx-auto space-y-3">
              {/* Categories Bar in Modal */}
              <div className="scrollbar-none overflow-x-auto pb-1">
                <div className="mx-auto flex w-max min-w-full items-center justify-center gap-1.5 px-1">
                {availableCategories.map((tab) => {
                  const TabIcon = tab.icon
                  const isActive = activeCategory === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleCategoryTabClick(tab.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-md'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.shortTitle}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-slate-900 text-white' : 'bg-white/20 text-white'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
                </div>
              </div>

              {/* Thumbnails in Modal */}
              <div className="scrollbar-none overflow-x-auto py-2">
                <div className="mx-auto flex w-max min-w-full items-center justify-center gap-2 px-1">
                {orderedGallery.map((item, idx) => {
                  const isSelected = activePhotoIndex === idx
                  return (
                    <button
                      key={item.id || idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative aspect-[16/10] w-16 sm:w-20 rounded-lg overflow-hidden bg-slate-800 transition border-2 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'border-white opacity-100 shadow-md'
                          : 'border-white/20 opacity-50 hover:opacity-90 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={item.thumb}
                        alt={item.label}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    </button>
                  )
                })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

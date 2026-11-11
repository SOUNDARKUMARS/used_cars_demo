import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  X,
  Check,
  Calendar,
  Gauge,
  Sparkles,
  UploadCloud,
  Camera,
  Trash2,
  Plus,
  Eye,
  Award,
  Clock,
  Banknote,
  FileCheck,
} from 'lucide-react'

export default function SellScreen({ onBack }) {
  const [regNumber, setRegNumber] = useState('')
  const [km, setKm] = useState('30000')
  const [year, setYear] = useState('2022')
  const [activeModal, setActiveModal] = useState(null) // null | 'year' | 'mileage'
  const [estimatedValue, setEstimatedValue] = useState(null)

  // Photos State
  const [photos, setPhotos] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const fileInputRef = useRef(null)

  const yearOptions = ['2024', '2023', '2022', '2021', '2020', '2019', '2018 & Older']

  const mileageOptions = [
    { label: 'Under 20,000 km', value: '15000', subtitle: 'Like New / Minimal Usage' },
    { label: '20,000 - 40,000 km', value: '30000', subtitle: 'Standard City / Highway' },
    { label: '40,000 - 70,000 km', value: '50000', subtitle: 'Moderate Daily Commute' },
    { label: 'Above 70,000 km', value: '80000', subtitle: 'High Mileage / Well Driven' },
  ]

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    addFiles(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const addFiles = (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const defaultTags = [
      'Front Angle',
      'Rear Angle',
      'Interior Dashboard',
      'Odometer Reading',
      'Side Profile',
      'Engine Bay',
    ]

    const newItems = imageFiles.map((file, idx) => {
      const tagIndex = (photos.length + idx) % defaultTags.length
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        tag: defaultTags[tagIndex],
      }
    })
    setPhotos((prev) => [...prev, ...newItems])
  }

  const handleRemovePhoto = (id, e) => {
    e.stopPropagation()
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const handleLoadSamplePhotos = () => {
    setPhotos([
      {
        id: 'sample-1',
        url: '/nova/gallery-1.jpg',
        name: 'front_exterior_angle.jpg',
        size: '1.4 MB',
        tag: 'Front Angle',
      },
      {
        id: 'sample-2',
        url: '/nova/gallery-2.jpg',
        name: 'rear_tail_exterior.jpg',
        size: '1.2 MB',
        tag: 'Rear Angle',
      },
      {
        id: 'sample-3',
        url: '/nova/gallery-3.jpg',
        name: 'cockpit_dashboard.jpg',
        size: '1.8 MB',
        tag: 'Interior Dashboard',
      },
      {
        id: 'sample-4',
        url: '/nova/gallery-4.jpg',
        name: 'odometer_console.jpg',
        size: '1.1 MB',
        tag: 'Odometer Reading',
      },
    ])
  }

  const handleClearPhotos = () => {
    setPhotos([])
  }

  const handleCalculate = (e) => {
    e.preventDefault()
    const baseMin = 840000
    const baseMax = 920000
    const photoBonus = photos.length > 0 ? 25000 : 0
    const finalMin = baseMin + photoBonus
    const finalMax = baseMax + photoBonus
    const formatted = `₹ ${finalMin.toLocaleString('en-IN')} - ₹ ${finalMax.toLocaleString('en-IN')}`

    setEstimatedValue({
      range: formatted,
      hasPhotos: photos.length > 0,
      photoCount: photos.length,
      bonus: photoBonus ? '₹ 25,000' : null,
    })
  }

  const selectedMileageLabel =
    mileageOptions.find((opt) => opt.value === km)?.label || '20,000 - 40,000 km'

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sell Your Car in 24 Hours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Free doorstep physical evaluation • Instant bank transfer payment • Zero RC transfer fee
          </p>
        </div>

        {/* Valuation Hero Banner */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-950 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
            Nova Instant Auto Valuation Engine
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-snug">
            Get the Highest Guaranteed Price for Your Car
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
            We evaluate real-time Tamil Nadu resale market data across 50,000+ transactions to guarantee you get up to 15% more than local dealer trade-in rates.
          </p>
        </div>

        {/* Valuation Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Calculate Instant Car Value</h3>

          <form onSubmit={handleCalculate} className="space-y-5">
            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Vehicle Registration Number (RTO)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TN 39 CZ 8899"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                className="w-full uppercase font-mono tracking-wider text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Year & Mileage Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registration Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registration Year
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('year')}
                  className="w-full text-xs sm:text-sm px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50 hover:bg-slate-100/60 transition flex items-center justify-between text-slate-900 font-medium text-left shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">{year}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Odometer Mileage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Odometer Mileage
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal('mileage')}
                  className="w-full text-xs sm:text-sm px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50 hover:bg-slate-100/60 transition flex items-center justify-between text-slate-900 font-medium text-left shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">{selectedMileageLabel}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Photos Uploading Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-slate-900">
                    Upload Car Photos <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Adding photos unlocks an instant visual appraisal bonus of up to ₹ 25,000.
                  </p>
                </div>

                {photos.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleLoadSamplePhotos}
                    className="text-[11px] font-semibold text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1 rounded-xl transition"
                  >
                    + Load Demo Photos
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {photos.length} photo{photos.length > 1 ? 's' : ''} added
                    </span>
                    <button
                      type="button"
                      onClick={handleClearPhotos}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${
                  isDragging
                    ? 'border-slate-950 bg-slate-100 scale-[1.01]'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700">
                    <UploadCloud className="w-6 h-6 stroke-[1.8] text-slate-700" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Click to upload photos or drag & drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Front, Rear, Interior, Odometer • Supports PNG, JPG, WEBP (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Photo Angles Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10.5px] font-semibold text-slate-400">Suggested:</span>
                {['Front Angle', 'Rear Angle', 'Interior Dashboard', 'Odometer Reading'].map(
                  (angle) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition flex items-center gap-1 shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-slate-400" />
                      <span>{angle}</span>
                    </button>
                  )
                )}
              </div>

              {/* Uploaded Photos Grid Preview */}
              {photos.length > 0 && (
                <div className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs"
                      >
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top Badge: Cover or Tag */}
                        <div className="absolute top-2 left-2 z-10">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[9.5px] font-bold bg-slate-950/80 text-white backdrop-blur-md shadow-xs">
                              Cover Photo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[9.5px] font-medium bg-black/60 text-white backdrop-blur-md">
                              {photo.tag || `Photo #${idx + 1}`}
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay with Action Buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(photo)}
                            className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md transition active:scale-90"
                            aria-label="View photo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemovePhoto(photo.id, e)}
                            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition active:scale-90"
                            aria-label="Delete photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add More Photo Tile */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 transition text-slate-500 hover:text-slate-800"
                    >
                      <Plus className="w-5 h-5 text-slate-400" />
                      <span className="text-[11px] font-semibold">Add More</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Get Instant Price Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Valuation Result Card */}
          {estimatedValue && (
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center animate-in fade-in">
              <span className="text-[10px] uppercase font-bold text-slate-900 tracking-wider">
                Instant Valuation Quote
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950 mt-1">
                {estimatedValue.range}
              </p>

              {estimatedValue.hasPhotos ? (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>
                    {estimatedValue.photoCount} Photos Appraised • Visual Valuation Bonus Applied (
                    {estimatedValue.bonus})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5">
                  Quote locked for 7 days. Free doorstep evaluation available at your address in
                  Tiruppur / Coimbatore.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition shadow-xs active:scale-95"
                >
                  Schedule Free Doorstep Inspection
                </button>
                <a
                  href="tel:+919488212044"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold transition inline-flex items-center gap-1.5"
                >
                  Call Valuation Specialist
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 3 Steps to Sell */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">How Nova Motors Car Selling Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex sm:flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Instant Price Quote</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Share registration number and vehicle photos to get a transparent data-backed offer.
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Doorstep Inspection</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Our certified engineer visits your home or office for a quick 30-min physical evaluation.
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Instant Bank Payout</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Receive 100% full payment in your bank account before handing over the car keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <Banknote className="w-6 h-6 text-slate-900 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Instant Spot Payout</p>
              <p className="text-[11px] text-slate-500">Immediate IMPS/RTGS bank transfer</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-slate-900 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Free RC Transfer</p>
              <p className="text-[11px] text-slate-500">100% legal paperwork handled by us</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <Clock className="w-6 h-6 text-slate-900 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">24-Hour Completion</p>
              <p className="text-[11px] text-slate-500">Fastest vehicle sale in Tamil Nadu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter-Style Modal UI for Year & Mileage Dropdowns */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 shadow-2xl relative max-h-[85vh] overflow-y-auto z-10 border-t sm:border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  {activeModal === 'year' ? (
                    <Calendar className="w-5 h-5 text-slate-900" />
                  ) : (
                    <Gauge className="w-5 h-5 text-slate-900" />
                  )}
                  <h3 className="text-base font-bold text-slate-900">
                    {activeModal === 'year' ? 'Select Registration Year' : 'Select Odometer Mileage'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Year Options Grid */}
              {activeModal === 'year' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {yearOptions.map((yr) => {
                    const isSelected = year === yr
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setYear(yr)
                          setActiveModal(null)
                        }}
                        className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{yr}</span>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Mileage Options List */}
              {activeModal === 'mileage' && (
                <div className="space-y-2">
                  {mileageOptions.map((opt) => {
                    const isSelected = km === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setKm(opt.value)
                          setActiveModal(null)
                        }}
                        className={`w-full py-3.5 px-4 rounded-2xl border text-left flex items-center justify-between transition active:scale-[0.99] ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs sm:text-sm font-bold ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p
                            className={`text-[11px] mt-0.5 ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {opt.subtitle}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Preview Modal for Uploaded Photos */}
      <AnimatePresence>
        {previewPhoto && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewPhoto(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-10 border border-slate-800"
            >
              <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
                <div>
                  <p className="text-xs font-bold">{previewPhoto.name}</p>
                  <p className="text-[10px] text-slate-400">{previewPhoto.tag} • {previewPhoto.size}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="aspect-[16/10] bg-black flex items-center justify-center">
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

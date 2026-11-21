import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  X,
  Check,
  Calendar,
  Gauge,
  Trash2,
  Plus,
  Clock,
  Banknote,
  FileCheck,
} from 'lucide-react'
import { addSellRequest, deleteSellRequest, buildValuationUpdateMessage } from '../data/carStorage'
import { addSellRequestToSupabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SELL_PHOTO_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left side' },
  { id: 'right', label: 'Right side' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rear-seat', label: 'Rear seat' },
]

function registrationYears() {
  const newest = new Date().getFullYear()
  const years = []
  for (let year = newest; year >= 1990; year -= 1) years.push(String(year))
  return years
}

function compressImageFile(file, meta) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the photo'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxEdge = 1280
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({
          url: canvas.toDataURL('image/jpeg', 0.72),
          name: meta?.name || file.name,
          tag: meta?.tag || '',
        })
      }
      img.onerror = () => reject(new Error('Could not read the photo'))
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

async function photoToStoredRecord(photo) {
  if (photo.file) return compressImageFile(photo.file, photo)
  if (!photo.url || photo.url.startsWith('blob:')) return null
  const response = await fetch(photo.url)
  if (!response.ok) return null
  const blob = await response.blob()
  const file = new File([blob], photo.name || 'photo.jpg', { type: blob.type || 'image/jpeg' })
  return compressImageFile(file, photo)
}

export default function SellScreen({ onBack }) {
  const { user, requireAuth } = useAuth()
  const [regNumber, setRegNumber] = useState('')
  const [km, setKm] = useState('')
  const [phone, setPhone] = useState('')
  const [year, setYear] = useState('2022')
  const [activeModal, setActiveModal] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitNotice, setSubmitNotice] = useState(null)

  // Photos State
  const [photos, setPhotos] = useState([])
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const fileInputRef = useRef(null)
  const pendingSlotRef = useRef(null)

  const yearOptions = registrationYears()

  const openSlotPicker = (slotId) => {
    pendingSlotRef.current = slotId
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (e) => {
    const file = Array.from(e.target.files || []).find((item) => item.type.startsWith('image/'))
    const slotId = pendingSlotRef.current
    e.target.value = ''
    if (!file || !slotId) return
    const slot = SELL_PHOTO_SLOTS.find((item) => item.id === slotId)
    if (!slot) return
    const next = {
      id: slot.id,
      slot: slot.id,
      url: URL.createObjectURL(file),
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tag: slot.label,
    }
    setPhotos((prev) => [...prev.filter((photo) => photo.slot !== slot.id), next])
  }

  const handleRemovePhoto = (slotId, e) => {
    e.stopPropagation()
    setPhotos((prev) => prev.filter((photo) => photo.slot !== slotId))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    const kmDigits = String(km).replace(/[^\d]/g, '')
    const kmNumber = Number(kmDigits)
    if (!kmDigits || !Number.isFinite(kmNumber) || kmNumber <= 0) {
      setFormError('Enter the exact odometer reading in kilometres.')
      return
    }

    const phoneDigits = phone.replace(/[^\d]/g, '')
    if (phoneDigits.length < 10) {
      setFormError('Enter a phone number so the team can reach you with the valuation.')
      return
    }

    const missingSlots = SELL_PHOTO_SLOTS.filter((slot) => !photos.some((photo) => photo.slot === slot.id))
    if (missingSlots.length > 0) {
      setFormError(`Add one photo for each angle: ${missingSlots.map((slot) => slot.label).join(', ')}.`)
      return
    }

    requireAuth(
      async (authUser) => {
        setIsSubmitting(true)
        setFormError('')
        try {
          const storedPhotos = []
          for (const photo of photos) {
            const stored = await photoToStoredRecord(photo)
            if (stored?.url) storedPhotos.push({ ...stored, slot: photo.slot, tag: photo.tag })
          }
          if (storedPhotos.length < SELL_PHOTO_SLOTS.length) {
            throw new Error('One of the photos could not be saved. Add it again and resubmit.')
          }

          const quoteMessage = buildValuationUpdateMessage(new Date())
          const created = addSellRequest({
            regNumber: regNumber.toUpperCase(),
            year,
            km: kmNumber,
            quoteMessage,
            photos: storedPhotos,
            customerName: authUser?.name || user?.name || 'Car owner',
            email: authUser?.email || user?.email || '',
            phone: phoneDigits,
            city: 'Tiruppur',
          })

          try {
            await addSellRequestToSupabase(created)
          } catch (err) {
            deleteSellRequest(created.id)
            throw err
          }

          setSubmitNotice({ id: created.id, message: quoteMessage })
        } catch (err) {
          setFormError(err?.message || 'Could not submit the request. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      },
      {
        title: 'Sign in to request a valuation',
        description: 'Sign in with your Google account so we can send the valuation update to you.',
      }
    )
  }

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
        <div className="p-6 sm:p-10 rounded-2xl bg-slate-950 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
            Harsha Instant Auto Valuation Engine
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold leading-snug">
            Get the Highest Guaranteed Price for Your Car
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
            We evaluate real-time Tamil Nadu resale market data across 50,000+ transactions to guarantee you get up to 15% more than local dealer trade-in rates.
          </p>
        </div>

        {/* Valuation Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Request a valuation</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone number
              </label>
              <input
                type="tel"
                required
                inputMode="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Year & exact mileage */}
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Exact odometer reading (km)
                </label>
                <div className="flex items-center gap-2 w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-900 bg-slate-50/50">
                  <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="e.g. 45230"
                    value={km}
                    onChange={(e) => setKm(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-slate-400">km</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-900">
                  Photos <span className="text-slate-500 font-normal">({photos.length} of {SELL_PHOTO_SLOTS.length})</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add one photo for each angle. Tap a box to choose it.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SELL_PHOTO_SLOTS.map((slot) => {
                  const photo = photos.find((item) => item.slot === slot.id)
                  if (!photo) {
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => openSlotPicker(slot.id)}
                        className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 flex flex-col items-center justify-center gap-1 text-slate-600 transition active:scale-[0.98]"
                      >
                        <Plus className="w-5 h-5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-900">{slot.label}</span>
                        <span className="text-[11px] text-slate-400">Required</span>
                      </button>
                    )
                  }
                  return (
                    <div key={slot.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(photo)}
                        className="absolute inset-0"
                        aria-label={`View ${slot.label}`}
                      >
                        <img src={photo.url} alt={slot.label} className="w-full h-full object-cover" />
                      </button>
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/80 text-white">
                          {slot.label}
                        </span>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openSlotPicker(slot.id)}
                          className="h-7 px-2 rounded-lg bg-white text-[11px] font-semibold text-slate-900 shadow-sm"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(slot.id, e)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-900 flex items-center justify-center shadow-sm"
                          aria-label={`Remove ${slot.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calculate Button */}
            {formError && (
              <p className="text-xs font-semibold text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Submitting request...' : 'Request Instant Valuation'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 3 Steps to Sell */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">How Harsha cars Car Selling Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex sm:flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Send your car details</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Share the registration number, exact kilometres, and photos. The team reviews the request and sends the valuation.
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
              <p className="text-xs text-slate-500">Immediate IMPS/RTGS bank transfer</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-slate-900 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Free RC Transfer</p>
              <p className="text-xs text-slate-500">100% legal paperwork handled by us</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <Clock className="w-6 h-6 text-slate-900 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">24-Hour Completion</p>
              <p className="text-xs text-slate-500">Fastest vehicle sale in Tamil Nadu</p>
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
              className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 pb-8 sm:pb-6 shadow-2xl relative max-h-[85vh] overflow-y-auto z-10 border-t sm:border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-900" />
                  <h3 className="text-base font-bold text-slate-900">
                    Select Registration Year
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
                            ? 'bg-brand text-white border-brand shadow-md ring-1 ring-brand'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{yr}</span>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitNotice && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl z-10 border border-slate-200"
            >
              <h3 className="text-base font-bold text-slate-900">Request submitted</h3>
              <p className="text-sm text-slate-600 mt-2">{submitNotice.message}</p>
              <p className="text-xs font-mono font-bold text-slate-900 mt-3">
                Request ID: {submitNotice.id}
              </p>
              <button
                type="button"
                onClick={() => setSubmitNotice(null)}
                className="mt-5 w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition"
              >
                Done
              </button>
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
              className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl z-10 border border-slate-800"
            >
              <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
                <div>
                  <p className="text-xs font-bold">{previewPhoto.name}</p>
                  <p className="text-xs text-slate-400">{previewPhoto.tag} • {previewPhoto.size}</p>
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

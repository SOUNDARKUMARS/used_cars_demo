import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Bell,
  CheckCircle2,
  Car,
  Calendar,
  Fuel,
  SlidersHorizontal,
  Mail,
  User,
  Phone,
  Sparkles,
  Info,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatINR, addStoredReminder } from '../data/carStorage'
import { addReminderToSupabase } from '../lib/supabase'
import BrandSelector from './BrandSelector'
import CustomSelect from './CustomSelect'
import DualThumbSlider from './DualThumbSlider'

const FUEL_TYPES = ['Any', 'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']
const TRANSMISSIONS = ['Any', 'Automatic', 'Manual']
const YEAR_MIN = 2010
const YEAR_MAX = 2026
const PRICE_MIN = 0
const PRICE_MAX = 5000000
const PRICE_STEP = 50000

export default function SetCarAlertModal({
  isOpen,
  onClose,
  initialValues = {},
  onSuccess,
}) {
  const { user, saveAccountPhone } = useAuth()

  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [make, setMake] = useState('')
  const [customMake, setCustomMake] = useState('')
  const [model, setModel] = useState('')
  const [minYear, setMinYear] = useState('2018')
  const [maxYear, setMaxYear] = useState('2026')
  const [minPrice, setMinPrice] = useState('400000') // 4 Lakhs
  const [maxPrice, setMaxPrice] = useState('2500000') // 25 Lakhs
  const [fuelType, setFuelType] = useState('Any')
  const [transmission, setTransmission] = useState('Any')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  // Pre-fill user profile info and incoming search filter values
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false)
      setFormError('')

      if (user) {
        setCustomerName(user.name || '')
        setEmail(user.email || '')
        if (user.phone) setPhone(String(user.phone))
      }

      const incomingMake = initialValues.make || initialValues.brand || ''
      if (!incomingMake || incomingMake === 'Any' || incomingMake === 'Any Brand') {
        setMake('')
        setCustomMake('')
      } else {
        setMake(incomingMake)
        setCustomMake('')
      }

      if (initialValues.model) {
        setModel(initialValues.model)
      } else if (initialValues.query) {
        setModel(initialValues.query)
      }

      if (initialValues.minPrice != null) {
        const min = Math.min(PRICE_MAX, Math.max(0, Number(initialValues.minPrice) || 0))
        setMinPrice(String(min))
      }
      if (initialValues.maxPrice != null) {
        const max = Math.min(PRICE_MAX, Math.max(0, Number(initialValues.maxPrice) || PRICE_MAX))
        setMaxPrice(String(max))
      }
      if (initialValues.fuelType || initialValues.fuel) {
        setFuelType(initialValues.fuelType || initialValues.fuel)
      }
      if (initialValues.transmission) setTransmission(initialValues.transmission)
    }
  }, [isOpen, user, initialValues])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!customerName.trim()) {
      setFormError('Please provide your name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address to receive matching alerts')
      return
    }

    const phoneDigits = phone.replace(/\D/g, '').slice(-10)
    const savedPhone = String(user?.phone || '').replace(/\D/g, '').slice(-10)
    const effectivePhone = savedPhone.length === 10 ? savedPhone : phoneDigits
    if (effectivePhone.length !== 10) {
      setFormError('Enter your 10-digit mobile number so we can reach you about this alert.')
      return
    }
    if (user?.email && savedPhone.length !== 10) {
      const saved = saveAccountPhone(effectivePhone)
      if (!saved) {
        setFormError('Could not save your mobile number. Try again.')
        return
      }
    }

    setIsSubmitting(true)

    const effectiveMake =
      make === 'Other' ? customMake.trim() || 'Any' : make.trim() || 'Any'
    const effectiveModel = model.trim() || 'Any'

    const reminderPayload = {
      id: `rem-${Date.now()}`,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: effectivePhone,
      make: effectiveMake,
      model: effectiveModel,
      minYear: Number(minYear) || 2015,
      maxYear: Number(maxYear) || 2026,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 5000000,
      fuelType,
      transmission,
      bodyType: 'Any',
      notes: notes.trim(),
      status: 'active',
      userId: user?.id || user?.sub || null,
      notificationCount: 0,
      lastNotifiedAt: null,
      createdAt: new Date().toISOString(),
    }

    try {
      const saved = await addReminderToSupabase(reminderPayload)
      addStoredReminder(saved)
      setIsSubmitted(true)
      if (onSuccess) {
        onSuccess(saved)
      }
    } catch (err) {
      console.error('Failed to create vehicle reminder:', err)
      setFormError('Could not save reminder. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative my-4 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Set Vehicle Alert Reminder
              </h2>
              <p className="text-xs text-slate-300">
                We'll email you immediately when a matching car arrives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Vehicle Alert Activated!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We've saved your requirement for{' '}
              <strong className="text-slate-900">
                {make === 'Other' ? customMake || 'Any brand' : make || 'Any brand'}{' '}
                {model ? model : 'Vehicles'}
              </strong>{' '}
              ({minYear}–{maxYear}) within budget{' '}
              <strong className="text-slate-900">
                {formatINR(minPrice)} – {formatINR(maxPrice)}
              </strong>
              .
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 flex items-start gap-3 text-left">
              <Sparkles className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <span>
                As soon as our dealership team publishes a car matching your
                criteria, our notification engine will automatically dispatch an
                email alert to <strong>{email}</strong>!
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Customer Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (For Alerts) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                {String(user?.phone || '').replace(/\D/g, '').length >= 10 ? null : (
                  <>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Vehicle Preferences */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-900" />
                <span>Car Requirement Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <BrandSelector
                    allowAny
                    selectedBrand={make}
                    onSelectBrand={(brandName) => {
                      setMake(brandName)
                      if (brandName !== 'Other') setCustomMake('')
                    }}
                    customBrandValue={customMake}
                    onCustomBrandChange={setCustomMake}
                    placeholder="Any brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Model or Keyword
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Fortuner, Creta, City (or leave blank)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <DualThumbSlider
                  title="Year range"
                  min={YEAR_MIN}
                  max={YEAR_MAX}
                  step={1}
                  low={minYear}
                  high={maxYear}
                  lowLabel="Minimum year"
                  highLabel="Maximum year"
                  onChange={(nextMin, nextMax) => {
                    setMinYear(String(nextMin))
                    setMaxYear(String(nextMax))
                  }}
                  scale={
                    <>
                      <span>{YEAR_MIN}</span>
                      <span>{YEAR_MAX}</span>
                    </>
                  }
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <DualThumbSlider
                  title="Budget range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  low={minPrice}
                  high={maxPrice}
                  lowLabel="Minimum budget"
                  highLabel="Maximum budget"
                  formatLow={(v) => formatINR(v)}
                  formatHigh={(v) => formatINR(v)}
                  onChange={(nextMin, nextMax) => {
                    setMinPrice(String(nextMin))
                    setMaxPrice(String(nextMax))
                  }}
                  scale={
                    <>
                      <span>₹ 0</span>
                      <span>₹ 10L</span>
                      <span>₹ 25L</span>
                      <span>₹ 50L</span>
                    </>
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Fuel</label>
                  <CustomSelect
                    uiVariant="storefront"
                    size="sm"
                    value={fuelType}
                    onChange={setFuelType}
                    options={FUEL_TYPES}
                    placeholder="Any"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Transmission
                  </label>
                  <CustomSelect
                    uiVariant="storefront"
                    size="sm"
                    value={transmission}
                    onChange={setTransmission}
                    options={TRANSMISSIONS}
                    placeholder="Any"
                  />
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Requirements or Features (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Single owner, panoramic sunroof, white or silver color, under 40k km"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Activating Alert...</span>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-white" />
                    <span>Set Vehicle Alert & Notify Me</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, SlidersHorizontal, RotateCcw, IndianRupee, Gauge, ShieldCheck } from 'lucide-react'

export default function FilterModal({ isOpen, onClose, filters, setFilters, onApply }) {
  const currentMinBudget = filters.minBudget ?? 200000
  const currentMaxBudget = filters.maxBudget ?? 3500000
  const currentMinKm = filters.minKm ?? 0
  const currentMaxKm = filters.maxKm ?? 100000

  const formatBudgetLabel = (minVal, maxVal) => {
    if (minVal <= 200000 && maxVal >= 3500000) return 'Any Budget'
    const minL = (minVal / 100000).toFixed(minVal % 100000 === 0 ? 0 : 1)
    const maxL = (maxVal / 100000).toFixed(maxVal % 100000 === 0 ? 0 : 1)
    if (minVal <= 200000) return `Up to ₹ ${maxL} Lakhs`
    if (maxVal >= 3500000) return `₹ ${minL}L & Above`
    return `₹ ${minL}L - ₹ ${maxL}L`
  }

  const formatKmLabel = (minVal, maxVal) => {
    if (minVal <= 0 && maxVal >= 100000) return 'Any Mileage'
    if (minVal <= 0) return `Up to ${maxVal.toLocaleString('en-IN')} km`
    if (maxVal >= 100000) return `${minVal.toLocaleString('en-IN')}+ km`
    return `${minVal.toLocaleString('en-IN')} - ${maxVal.toLocaleString('en-IN')} km`
  }

  const budgetPresets = [
    { label: 'All Budgets', min: 200000, max: 3500000 },
    { label: 'Under ₹ 5L', min: 200000, max: 500000 },
    { label: '₹ 5L - ₹ 10L', min: 500000, max: 1000000 },
    { label: '₹ 10L - ₹ 20L', min: 1000000, max: 2000000 },
    { label: 'Above ₹ 20L', min: 2000000, max: 3500000 },
  ]

  const kmPresets = [
    { label: 'Any Mileage', min: 0, max: 100000 },
    { label: 'Under 20k km', min: 0, max: 20000 },
    { label: '20k - 50k km', min: 20000, max: 50000 },
    { label: '50k - 80k km', min: 50000, max: 80000 },
    { label: 'Above 80k km', min: 80000, max: 100000 },
  ]

  const fuelOptions = ['All Fuels', 'Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid']
  const yearOptions = ['All Years', '2024', '2023', '2022', '2021', '2020 & Older']

  const transmissionOptions = [
    { label: 'All Transmissions', value: 'all' },
    { label: 'Automatic (CVT/AT)', value: 'automatic' },
    { label: 'Manual', value: 'manual' },
  ]

  const ownershipOptions = [
    { label: 'All Owners', value: 'all' },
    { label: '1st Owner Only', value: '1st' },
    { label: '2nd Owner', value: '2nd' },
    { label: '3rd Owner & More', value: '3rd' },
  ]

  const bodyTypeOptions = [
    { label: 'All Bodies', value: 'all' },
    { label: 'Sedan', value: 'sedan' },
    { label: 'SUV', value: 'suv' },
    { label: 'Hatchback', value: 'hatchback' },
    { label: 'MPV', value: 'mpv' },
  ]

  const getActiveFilterCount = () => {
    let count = 0
    if (currentMinBudget > 200000 || currentMaxBudget < 3500000) count++
    if (currentMinKm > 0 || currentMaxKm < 100000) count++
    if (filters.fuel && filters.fuel !== 'All Fuels') count++
    if (filters.year && filters.year !== 'All Years') count++
    if (filters.transmission && filters.transmission !== 'all') count++
    if (filters.ownership && filters.ownership !== 'all') count++
    if (filters.bodyType && filters.bodyType !== 'all') count++
    return count
  }

  const activeCount = getActiveFilterCount()

  const handleReset = () => {
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

  // Budget slider progress percentages (min 200k, max 3500k)
  const budgetMin = 200000
  const budgetMax = 3500000
  const minBudgetPercent = Math.min(
    100,
    Math.max(0, ((currentMinBudget - budgetMin) / (budgetMax - budgetMin)) * 100)
  )
  const maxBudgetPercent = Math.min(
    100,
    Math.max(0, ((currentMaxBudget - budgetMin) / (budgetMax - budgetMin)) * 100)
  )

  // KM slider progress percentages (min 0, max 100k)
  const kmMin = 0
  const kmMax = 100000
  const minKmPercent = Math.min(
    100,
    Math.max(0, ((currentMinKm - kmMin) / (kmMax - kmMin)) * 100)
  )
  const maxKmPercent = Math.min(
    100,
    Math.max(0, ((currentMaxKm - kmMin) / (kmMax - kmMin)) * 100)
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: '100%', scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[88vh] overflow-y-auto z-10 border-t sm:border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5 sticky top-0 bg-white z-20 -mx-6 px-6 -mt-6 pt-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">Filter Pre-Owned Cars</h3>
                {activeCount > 0 && (
                  <span className="text-[11px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full ml-1">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 pb-2">
              {/* 1. Double Thumb Budget Range Slider */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-700" />
                    <span>Budget Range</span>
                  </label>
                  <span className="text-xs font-extrabold font-mono text-slate-950 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {formatBudgetLabel(currentMinBudget, currentMaxBudget)}
                  </span>
                </div>

                {/* Double Thumb Range Slider Track */}
                <div className="pt-2 pb-1">
                  <div className="relative w-full h-7 flex items-center">
                    {/* Background Track */}
                    <div className="absolute left-0 right-0 h-2 rounded-full bg-slate-200" />

                    {/* Active Range Highlight */}
                    <div
                      className="absolute h-2 rounded-full bg-slate-900 transition-all duration-75"
                      style={{
                        left: `${minBudgetPercent}%`,
                        width: `${Math.max(0, maxBudgetPercent - minBudgetPercent)}%`,
                      }}
                    />

                    {/* Min Budget Range Input */}
                    <input
                      type="range"
                      min={budgetMin}
                      max={budgetMax}
                      step={50000}
                      value={currentMinBudget}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), currentMaxBudget - 50000)
                        setFilters({
                          ...filters,
                          minBudget: val,
                          budget: 'custom',
                        })
                      }}
                      className={`dual-range-input ${
                        currentMinBudget > budgetMax - 500000 ? 'z-20' : 'z-10'
                      }`}
                      aria-label="Minimum Budget"
                    />

                    {/* Max Budget Range Input */}
                    <input
                      type="range"
                      min={budgetMin}
                      max={budgetMax}
                      step={50000}
                      value={currentMaxBudget}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), currentMinBudget + 50000)
                        setFilters({
                          ...filters,
                          maxBudget: val,
                          budget: 'custom',
                        })
                      }}
                      className="dual-range-input z-10"
                      aria-label="Maximum Budget"
                    />
                  </div>

                  {/* Scale Labels */}
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-1">
                    <span>₹ 2 Lakhs</span>
                    <span>₹ 10L</span>
                    <span>₹ 20L</span>
                    <span>₹ 35L+ (Any)</span>
                  </div>
                </div>

                {/* Quick Budget Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                  {budgetPresets.map((preset) => {
                    const isSelected =
                      currentMinBudget === preset.min && currentMaxBudget === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minBudget: preset.min,
                            maxBudget: preset.max,
                            budget: 'custom',
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Double Thumb KMs Driven Slider */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-700" />
                    <span>KMs Driven (Odometer)</span>
                  </label>
                  <span className="text-xs font-extrabold font-mono text-slate-950 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {formatKmLabel(currentMinKm, currentMaxKm)}
                  </span>
                </div>

                {/* Double Thumb Range Slider Track */}
                <div className="pt-2 pb-1">
                  <div className="relative w-full h-7 flex items-center">
                    {/* Background Track */}
                    <div className="absolute left-0 right-0 h-2 rounded-full bg-slate-200" />

                    {/* Active Range Highlight */}
                    <div
                      className="absolute h-2 rounded-full bg-slate-900 transition-all duration-75"
                      style={{
                        left: `${minKmPercent}%`,
                        width: `${Math.max(0, maxKmPercent - minKmPercent)}%`,
                      }}
                    />

                    {/* Min KM Range Input */}
                    <input
                      type="range"
                      min={kmMin}
                      max={kmMax}
                      step={5000}
                      value={currentMinKm}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), currentMaxKm - 5000)
                        setFilters({
                          ...filters,
                          minKm: val,
                          km: 'custom',
                        })
                      }}
                      className={`dual-range-input ${
                        currentMinKm > kmMax - 20000 ? 'z-20' : 'z-10'
                      }`}
                      aria-label="Minimum Kilometers"
                    />

                    {/* Max KM Range Input */}
                    <input
                      type="range"
                      min={kmMin}
                      max={kmMax}
                      step={5000}
                      value={currentMaxKm}
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), currentMinKm + 5000)
                        setFilters({
                          ...filters,
                          maxKm: val,
                          km: 'custom',
                        })
                      }}
                      className="dual-range-input z-10"
                      aria-label="Maximum Kilometers"
                    />
                  </div>

                  {/* Scale Labels */}
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-1">
                    <span>0 km</span>
                    <span>25,000 km</span>
                    <span>50,000 km</span>
                    <span>1,00,000+ (Any)</span>
                  </div>
                </div>

                {/* Quick KM Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/60">
                  {kmPresets.map((preset) => {
                    const isSelected =
                      currentMinKm === preset.min && currentMaxKm === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minKm: preset.min,
                            maxKm: preset.max,
                            km: 'custom',
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Number of Owners */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Number of Owners
                </label>
                <div className="flex flex-wrap gap-2">
                  {ownershipOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters({ ...filters, ownership: opt.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                        (filters.ownership || 'all') === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Transmission */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Transmission</label>
                <div className="flex flex-wrap gap-2">
                  {transmissionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters({ ...filters, transmission: opt.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                        (filters.transmission || 'all') === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Fuel Type */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Fuel Type</label>
                <div className="flex flex-wrap gap-2">
                  {fuelOptions.map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setFilters({ ...filters, fuel })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                        (filters.fuel || 'All Fuels') === fuel
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Manufacturing Year */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Manufacturing Year
                </label>
                <div className="flex flex-wrap gap-2">
                  {yearOptions.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setFilters({ ...filters, year: yr })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                        (filters.year || 'All Years') === yr
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Body Type */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">Body Type</label>
                <div className="flex flex-wrap gap-2">
                  {bodyTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters({ ...filters, bodyType: opt.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                        (filters.bodyType || 'all') === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-4 pb-6 -mb-6 -mx-6 px-6 mt-4 border-t border-slate-100 sticky bottom-0 bg-white z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onApply) onApply()
                  onClose()
                }}
                className="flex-[2] py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black shadow-md transition active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

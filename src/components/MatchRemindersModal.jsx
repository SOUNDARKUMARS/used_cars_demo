import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Check,
  Send,
  Bell,
  Car,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { formatINR, checkCarMatchesReminder } from '../data/carStorage'

export default function MatchRemindersModal({
  isOpen,
  car,
  reminders = [],
  onClose,
  onPublishWithoutEmails,
  onConfirmPublishAndRemind,
  isSubmitting = false,
}) {
  const [activeFilter, setActiveFilter] = useState('relevant') // 'relevant' | 'all'
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [sendStatusText, setSendStatusText] = useState('')

  // Compute matching analysis for every reminder against the car being published
  const { fullMatches, nameMatches, reminderAnalysis } = useMemo(() => {
    const full = []
    const nameOnly = []
    const analysis = new Map()

    for (const rem of reminders) {
      const matchResult = checkCarMatchesReminder(car, rem)
      analysis.set(rem.id, matchResult)
      if (matchResult.matchLevel === 'full') {
        full.push(rem)
      } else if (matchResult.matchLevel === 'name') {
        nameOnly.push(rem)
      }
    }

    const byScore = (a, b) => (analysis.get(b.id)?.matchScore || 0) - (analysis.get(a.id)?.matchScore || 0)
    full.sort(byScore)
    nameOnly.sort(byScore)

    return {
      fullMatches: full,
      nameMatches: nameOnly,
      reminderAnalysis: analysis,
    }
  }, [car, reminders])

  const relevantReminders = useMemo(
    () => [...fullMatches, ...nameMatches],
    [fullMatches, nameMatches]
  )

  const fullMatchKey = fullMatches.map((rem) => rem.id).join('|')

  // Pre-select only full matches. Name-only buyers stay visible and unchecked
  // so the admin decides whether a partial fit should still get an email.
  const [selectedIds, setSelectedIds] = useState(() => new Set(fullMatches.map((rem) => rem.id)))

  React.useEffect(() => {
    setSelectedIds(new Set(fullMatchKey ? fullMatchKey.split('|') : []))
  }, [fullMatchKey])

  if (!isOpen || !car) return null

  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleSelectFull = () => {
    const next = new Set(selectedIds)
    for (const r of fullMatches) {
      next.add(r.id)
    }
    setSelectedIds(next)
  }

  const handleSelectNameMatches = () => {
    const next = new Set(selectedIds)
    for (const r of nameMatches) {
      next.add(r.id)
    }
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    const next = new Set()
    for (const r of reminders) {
      next.add(r.id)
    }
    setSelectedIds(next)
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleRemindAndPublish = async () => {
    const selectedReminders = reminders.filter((r) => selectedIds.has(r.id))
    setSendStatusText(
      selectedReminders.length > 0
        ? `Dispatching emails to ${selectedReminders.length} buyer(s) via send-email edge function...`
        : 'Publishing vehicle...'
    )
    await onConfirmPublishAndRemind(selectedReminders)
  }

  const displayedReminders = activeFilter === 'relevant' ? relevantReminders : reminders
  const selectedNameCount = nameMatches.filter((rem) => selectedIds.has(rem.id)).length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  Buyer alerts for this car
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-900">
                  {fullMatches.length} full
                </span>
                {nameMatches.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/40 text-slate-100 border border-slate-300/40">
                    {nameMatches.length} name only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Full matches are selected. Same-name alerts stay listed so you can include them yourself.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Preview Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 shrink-0 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {car.image ? (
              <img
                src={car.image}
                alt={car.title}
                className="w-14 h-12 rounded-xl object-cover bg-slate-200 border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <Car className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {car.year} {car.make} {car.model} {car.variant || ''}
              </h3>
              <p className="text-[11px] text-slate-600">
                <strong className="text-blue-600 font-bold">{formatINR(car.price)}</strong> •{' '}
                {car.kmNumeric ? Number(car.kmNumeric).toLocaleString('en-IN') + ' km' : car.km || '0 km'} •{' '}
                {car.fuel || 'Petrol'} • {car.transmission || 'Automatic'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEmailPreview(!showEmailPreview)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>{showEmailPreview ? 'Hide Preview' : 'Email Preview'}</span>
            {showEmailPreview ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>

        {/* Collapsible Email Template Preview */}
        {showEmailPreview && (
          <div className="p-4 bg-slate-100/80 border-b border-slate-200 max-h-56 overflow-y-auto text-xs shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Email Subject Preview:</span>
              <span className="text-slate-500 text-[11px]">
                Sent from omnioplay@gmail.com via Supabase 'send-email' edge function
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-semibold text-slate-800">
              Vehicle match found: {car.year} {car.make} {car.model} is now available!
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <p className="mb-1 font-bold text-slate-800">HTML Template Highlights:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Harsha cars branded banner with hero vehicle photo</li>
                <li>Clear price tag: {formatINR(car.price)} with EMI estimates</li>
                <li>Specs table: {car.fuel}, {car.transmission}, {car.km || 'Verified mileage'}</li>
                <li>Direct CTA button: "View Vehicle & Book Doorstep Test Drive"</li>
              </ul>
            </div>
          </div>
        )}

        {/* Reminders List & Filter Tabs */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFilter('relevant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === 'relevant'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This car ({relevantReminders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All reminders ({reminders.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <button
                type="button"
                onClick={handleSelectFull}
                className="text-slate-800 hover:text-slate-950 font-semibold"
              >
                Select full matches
              </button>
              {nameMatches.length > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleSelectNameMatches}
                    className="text-slate-800 hover:text-slate-950 font-semibold"
                  >
                    Add name matches
                  </button>
                </>
              )}
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-slate-600 hover:text-slate-900 font-semibold"
              >
                Select all
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-slate-500 hover:text-slate-800 font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Reminders Cards List */}
          {displayedReminders.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {activeFilter === 'relevant'
                  ? 'No buyer has asked for this make or model.'
                  : 'No customer reminders saved yet.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeFilter === 'relevant'
                  ? 'Year, budget, fuel, and transmission are ignored only when the car name matches. You can still pick any buyer below.'
                  : 'Choose the buyers who should get this car by email.'}
              </p>
              {activeFilter === 'relevant' && reminders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-xs text-slate-800 font-semibold hover:underline"
                >
                  Review all {reminders.length} reminders
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeFilter === 'relevant' && fullMatches.length > 0 && nameMatches.length > 0 && (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-1">
                  Ready to email
                </p>
              )}
              {displayedReminders.map((rem, index) => {
                const analysis = reminderAnalysis.get(rem.id) || {}
                const isSelected = selectedIds.has(rem.id)
                const level = analysis.matchLevel || (analysis.isMatch ? 'full' : analysis.nameMatches ? 'name' : 'none')
                const showNameHeading =
                  activeFilter === 'relevant' &&
                  level === 'name' &&
                  (index === 0 || (reminderAnalysis.get(displayedReminders[index - 1].id)?.matchLevel || 'full') !== 'name')

                return (
                  <div key={rem.id}>
                    {showNameHeading && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 px-1 pt-2">
                        Same name, other details differ — tick to email anyway
                      </p>
                    )}
                    <div
                      onClick={() => toggleSelect(rem.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 shadow-xs'
                          : level === 'name'
                          ? 'border-slate-300 bg-white hover:border-slate-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-brand border-brand text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {rem.customerName}
                            </span>
                            {level === 'full' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                                All details match
                              </span>
                            ) : level === 'name' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                                Name matches
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                Different car
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400">
                            {rem.email}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 mb-1">
                          <strong>Requested:</strong>{' '}
                          {rem.make === 'Any' ? 'Any make' : rem.make}{' '}
                          {rem.model && rem.model !== 'Any' ? rem.model : 'any model'} (
                          {rem.minYear || 2015}–{rem.maxYear || 2026}) ·{' '}
                          {formatINR(rem.minPrice || 0)} – {formatINR(rem.maxPrice || 5000000)} ·{' '}
                          {rem.fuelType || 'Any fuel'} · {rem.transmission || 'Any transmission'}
                        </p>

                        {level === 'name' && (
                          <p className="text-[11px] text-slate-700 mb-1">
                            Left unchecked. Include this buyer if you still want them notified.
                          </p>
                        )}

                        {analysis.reasons && analysis.reasons.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-700">
                            {analysis.reasons.slice(0, 3).map((r, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {analysis.mismatches && analysis.mismatches.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-600 mt-1">
                            {analysis.mismatches.slice(0, 3).map((m, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-white border border-slate-300"
                              >
                                Differs: {m}
                              </span>
                            ))}
                          </div>
                        )}

                        {rem.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            Note: "{rem.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            {isSubmitting ? (
              <span className="font-bold text-slate-800 animate-pulse">
                {sendStatusText || 'Sending emails...'}
              </span>
            ) : (
              <span>
                <strong>{selectedIds.size}</strong> selected
                {selectedNameCount > 0 ? ` (${selectedNameCount} name-only)` : ''}
                {nameMatches.length > selectedNameCount
                  ? ` · ${nameMatches.length - selectedNameCount} name match${nameMatches.length - selectedNameCount === 1 ? '' : 'es'} waiting`
                  : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onPublishWithoutEmails}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
            >
              Publish Without Emails
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRemindAndPublish}
              className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending & Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {selectedIds.size > 0
                      ? `Email ${selectedIds.size} and publish`
                      : 'Publish vehicle'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

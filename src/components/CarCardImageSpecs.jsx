import React from 'react'
import { Calendar, Gauge, Fuel, SlidersHorizontal } from 'lucide-react'

function shortenTransmission(value) {
  if (!value) return '—'
  const t = String(value).trim()
  if (t.length <= 10) return t
  if (/cvt|automatic|amt|dct|imt/i.test(t)) return 'Auto'
  if (/manual/i.test(t)) return 'Manual'
  return t
}

export default function CarCardImageSpecs({ car, compact = false }) {
  const km = (car?.km || '').replace(/\s*km/i, '').trim()
  const allItems = [
    { Icon: Calendar, label: car?.year || '—' },
    { Icon: Gauge, label: km || '—' },
    { Icon: Fuel, label: car?.fuel || '—' },
    { Icon: SlidersHorizontal, label: shortenTransmission(car?.transmission) },
  ]
  const items = compact
    ? [
        { Icon: Calendar, label: car?.year || '—' },
        { Icon: Fuel, label: car?.fuel || '—' },
        { Icon: Gauge, label: km || '—' },
      ]
    : allItems

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent ${
        compact ? 'pt-7 pb-1.5 px-1.5 sm:pt-12 sm:pb-2.5 sm:px-2.5' : 'pt-12 pb-2.5 px-2.5'
      }`}
      aria-hidden
    >
      <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-sm">
        {items.map(({ Icon, label }, index) => (
          <div
            key={label + index}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 ${
              compact ? 'px-1 py-1 sm:px-1.5 sm:py-2' : 'px-1.5 py-2'
            } ${index > 0 ? 'border-l border-white/10' : ''}`}
          >
            <Icon className={`${compact ? 'h-2.5 w-2.5 sm:h-3 sm:w-3' : 'h-3 w-3'} shrink-0 text-white/75`} strokeWidth={2.2} />
            <span className={`truncate ${compact ? 'text-[9px] sm:text-[11px]' : 'text-[10px] sm:text-[11px]'} font-semibold text-white`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
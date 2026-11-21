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

export default function CarCardImageSpecs({ car }) {
  const km = (car?.km || '').replace(/\s*km/i, '').trim()
  const items = [
    { Icon: Calendar, label: car?.year || '—' },
    { Icon: Gauge, label: km || '—' },
    { Icon: Fuel, label: car?.fuel || '—' },
    { Icon: SlidersHorizontal, label: shortenTransmission(car?.transmission) },
  ]

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-transparent pt-12 pb-2.5 px-2.5"
      aria-hidden
    >
      <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-sm">
        {items.map(({ Icon, label }, index) => (
          <div
            key={label + index}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 px-1.5 py-2 ${
              index > 0 ? 'border-l border-white/10' : ''
            }`}
          >
            <Icon className="h-3 w-3 shrink-0 text-white/75" strokeWidth={2.2} />
            <span className="truncate text-[10px] font-semibold text-white sm:text-[11px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
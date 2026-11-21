import React, { useState } from 'react'

export default function DualThumbSlider({
  title,
  min,
  max,
  step,
  low,
  high,
  onChange,
  lowLabel,
  highLabel,
  formatLow = (v) => String(v),
  formatHigh = (v) => String(v),
  scale,
}) {
  const [activeThumb, setActiveThumb] = useState(null)
  const lowValue = Number(low)
  const highValue = Number(high)
  const span = max - min || 1
  const left = Math.min(100, Math.max(0, ((lowValue - min) / span) * 100))
  const right = Math.min(100, Math.max(0, ((highValue - min) / span) * 100))

  const lowZ =
    activeThumb === 'low'
      ? 'z-30'
      : activeThumb === 'high'
        ? 'z-10'
        : lowValue > max - step * 8
          ? 'z-20'
          : 'z-10'
  const highZ = activeThumb === 'high' ? 'z-30' : 'z-10'

  const lowThumbClass =
    activeThumb === 'low' ? 'dual-range-input dual-range-thumb-active' : 'dual-range-input'
  const highThumbClass =
    activeThumb === 'high' ? 'dual-range-input dual-range-thumb-active' : 'dual-range-input'

  return (
    <div className="space-y-3">
      {(title || formatLow || formatHigh) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {title ? (
            <span className="shrink-0 text-xs font-bold text-slate-900">{title}</span>
          ) : null}
          <div
            className="flex w-full min-w-0 items-stretch gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 text-[11px] font-bold leading-tight text-slate-950 sm:ml-auto sm:w-auto sm:max-w-[72%]"
            role="group"
            aria-label="Selected range"
          >
            <button
              type="button"
              onClick={() => setActiveThumb('low')}
              className={`min-w-0 flex-1 truncate rounded-[10px] px-2 py-1.5 text-left transition active:scale-[0.99] sm:flex-none sm:whitespace-nowrap ${
                activeThumb === 'low'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-950 hover:bg-slate-50'
              }`}
              aria-pressed={activeThumb === 'low'}
              aria-label={`Adjust ${lowLabel || 'minimum'}`}
            >
              {formatLow(lowValue)}
            </button>
            <span
              className="flex shrink-0 items-center px-0.5 font-semibold text-slate-300"
              aria-hidden
            >
              –
            </span>
            <button
              type="button"
              onClick={() => setActiveThumb('high')}
              className={`min-w-0 flex-1 truncate rounded-[10px] px-2 py-1.5 text-right transition active:scale-[0.99] sm:flex-none sm:whitespace-nowrap sm:text-left ${
                activeThumb === 'high'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-950 hover:bg-slate-50'
              }`}
              aria-pressed={activeThumb === 'high'}
              aria-label={`Adjust ${highLabel || 'maximum'}`}
            >
              {formatHigh(highValue)}
            </button>
          </div>
        </div>
      )}

      <div className="pt-2 pb-1">
        <div className="relative flex h-9 w-full items-center">
          <div className="absolute left-0 right-0 h-2 rounded-full bg-slate-200" />
          <div
            className="absolute h-2 rounded-full bg-slate-900"
            style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lowValue}
            onPointerDown={() => setActiveThumb('low')}
            onChange={(e) => onChange(Math.min(Number(e.target.value), highValue - step), highValue)}
            className={`${lowThumbClass} ${lowZ}`}
            aria-label={lowLabel}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={highValue}
            onPointerDown={() => setActiveThumb('high')}
            onChange={(e) => onChange(lowValue, Math.max(Number(e.target.value), lowValue + step))}
            className={`${highThumbClass} ${highZ}`}
            aria-label={highLabel}
          />
        </div>
      </div>

      {scale ? <div className="flex items-center justify-between text-xs font-semibold text-slate-500">{scale}</div> : null}
    </div>
  )
}
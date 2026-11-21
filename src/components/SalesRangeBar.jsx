const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: '3m', label: 'Last 3 months' },
  { id: '6m', label: 'Last 6 months' },
  { id: '1y', label: '1 year' },
  { id: 'custom', label: 'Custom' },
]

export default function SalesRangeBar({ preset, onPreset, from, to, onFrom, onTo }) {
  return (
    <div className="sales-range">
      <div className="sales-range-track" role="tablist" aria-label="Sales period">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={preset === item.id}
            className={preset === item.id ? 'is-active' : ''}
            onClick={() => onPreset(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="sales-range-custom">
          <label>
            From
            <input type="date" value={from} max={to || undefined} onChange={(event) => onFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} min={from || undefined} onChange={(event) => onTo(event.target.value)} />
          </label>
        </div>
      )}
    </div>
  )
}

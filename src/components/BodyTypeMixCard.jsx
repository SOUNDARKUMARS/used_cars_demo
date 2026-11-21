import React, { useMemo, useState } from 'react'
import { formatINRLakhsOrCrore } from '../data/carStorage.js'

const TONES = [1, 0.72, 0.5, 0.34, 0.2]

export default function BodyTypeMixCard({ bodyStats = [] }) {
  const [viewBy, setViewBy] = useState('count')
  const rows = useMemo(
    () => (bodyStats || []).filter((item) => item.count > 0),
    [bodyStats]
  )
  const totalValue = rows.reduce((sum, item) => sum + (item.combinedValue || 0), 0) || 1
  const totalCount = rows.reduce((sum, item) => sum + (item.count || 0), 0) || 1

  return (
    <div className="card h-100 border-0 shadow-sm sales-panel">
      <div className="card-header bg-transparent border-0 sales-panel-head">
        <div>
          <h2 className="sales-panel-title">Body type mix</h2>
          <p className="sales-panel-note">Stock on hand, plus sales in this period</p>
        </div>
        <div className="sales-segment" role="group" aria-label="Body type metric">
          <button type="button" className={viewBy === 'count' ? 'is-active' : ''} onClick={() => setViewBy('count')}>
            Cars
          </button>
          <button type="button" className={viewBy === 'revenue' ? 'is-active' : ''} onClick={() => setViewBy('revenue')}>
            Value
          </button>
        </div>
      </div>

      <div className="card-body sales-panel-body">
        {rows.length === 0 ? (
          <p className="sales-empty">Nothing in stock or sold in this period.</p>
        ) : (
          <>
            <div className="sales-mix-bar" aria-hidden="true">
              {rows.map((item, index) => {
                const pct = viewBy === 'count'
                  ? (item.count / totalCount) * 100
                  : ((item.combinedValue || 0) / totalValue) * 100
                return <span key={item.name} style={{ width: `${pct}%`, opacity: TONES[index % TONES.length] }} />
              })}
            </div>
            <ul className="sales-mix-list">
              {rows.map((item, index) => {
                const pct = viewBy === 'count'
                  ? Math.round((item.count / totalCount) * 100)
                  : Math.round(((item.combinedValue || 0) / totalValue) * 100)
                const primary = viewBy === 'count'
                  ? `${item.count} ${item.count === 1 ? 'car' : 'cars'}`
                  : formatINRLakhsOrCrore(item.combinedValue || 0)
                return (
                  <li key={item.name}>
                    <div className="sales-mix-row">
                      <span className="sales-mix-name">
                        <i style={{ opacity: TONES[index % TONES.length] }} />
                        {item.name}
                      </span>
                      <span className="sales-mix-value">{primary} · {pct}%</span>
                    </div>
                    <div className="sales-mix-track">
                      <span style={{ width: `${pct}%`, opacity: TONES[index % TONES.length] }} />
                    </div>
                    <p>Sold {item.soldCount || 0} · Stock {item.availableCount || 0} · {item.revenueFormatted || formatINRLakhsOrCrore(item.revenue || 0)}</p>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

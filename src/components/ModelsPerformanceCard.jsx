import React, { useMemo, useState } from 'react'
import { formatINRLakhsOrCrore } from '../data/carStorage.js'

export default function ModelsPerformanceCard({ modelsData = [], onViewInventory }) {
  const [metric, setMetric] = useState('revenue')
  const rows = useMemo(() => {
    const list = Array.isArray(modelsData) ? [...modelsData] : []
    return list.sort((a, b) => (metric === 'units' ? b.soldCars - a.soldCars : b.totalRevenue - a.totalRevenue))
  }, [modelsData, metric])
  const maxValue = Math.max(...rows.map((item) => (metric === 'units' ? item.soldCars : item.totalRevenue)), 1)

  return (
    <div className="card h-100 border-0 shadow-sm sales-panel">
      <div className="card-header bg-transparent border-0 sales-panel-head">
        <div>
          <h2 className="sales-panel-title">Models</h2>
          <p className="sales-panel-note">What sold in this period, and what is still in stock</p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="sales-segment" role="group" aria-label="Model metric">
            <button type="button" className={metric === 'revenue' ? 'is-active' : ''} onClick={() => setMetric('revenue')}>
              Revenue
            </button>
            <button type="button" className={metric === 'units' ? 'is-active' : ''} onClick={() => setMetric('units')}>
              Cars sold
            </button>
          </div>
          {onViewInventory && (
            <button type="button" className="sales-quiet-btn" onClick={onViewInventory}>
              Inventory
            </button>
          )}
        </div>
      </div>
      <div className="card-body sales-panel-body">
        {rows.length === 0 ? (
          <p className="sales-empty">No models to show for this period.</p>
        ) : (
          <div className="table-responsive">
            <table className="sales-model-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Body</th>
                  <th>Sold / stock</th>
                  <th>{metric === 'units' ? 'Cars sold' : 'Revenue'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((item) => {
                  const amount = metric === 'units' ? item.soldCars : item.totalRevenue
                  const width = Math.min(100, Math.round((amount / maxValue) * 100))
                  return (
                    <tr key={item.fullName}>
                      <td>
                        <strong>{item.fullName}</strong>
                        <span>{item.fuel}</span>
                      </td>
                      <td>{item.bodyType}</td>
                      <td>{item.soldCars} sold · {item.availableCars} in stock</td>
                      <td>
                        <div className="sales-model-meter">
                          <span>{metric === 'units' ? item.soldCars : (item.revenueFormatted || formatINRLakhsOrCrore(item.totalRevenue || 0))}</span>
                          <i><b style={{ width: `${width}%` }} /></i>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

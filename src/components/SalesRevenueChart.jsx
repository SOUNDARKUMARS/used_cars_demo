import React, { useMemo, useState } from 'react'

export default function SalesRevenueChart({ salesData, onRecordSaleClick }) {
  const [viewMode, setViewMode] = useState('revenue')
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const monthly = salesData?.monthly || []
  const chartWidth = 600
  const chartHeight = 220
  const paddingLeft = 8
  const paddingRight = 8
  const paddingTop = 28
  const paddingBottom = 12
  const plotWidth = chartWidth - paddingLeft - paddingRight
  const plotHeight = chartHeight - paddingTop - paddingBottom
  const baselineY = chartHeight - paddingBottom

  const maxRevenueLakhs = useMemo(() => {
    const max = Math.max(...monthly.map((item) => item.revenueLakhs || 0), 1)
    return Math.ceil(max / 10) * 10
  }, [monthly])

  const maxUnits = useMemo(() => {
    const max = Math.max(...monthly.map((item) => item.unitsSold || 0), 1)
    return Math.ceil(max)
  }, [monthly])

  const points = useMemo(() => {
    if (monthly.length === 0) return []
    const step = monthly.length === 1 ? 0 : plotWidth / (monthly.length - 1)
    return monthly.map((item, index) => {
      const x = monthly.length === 1 ? chartWidth / 2 : paddingLeft + index * step
      const revRatio = Math.min(1, Math.max(0, (item.revenueLakhs || 0) / (maxRevenueLakhs || 1)))
      const unitRatio = Math.min(1, Math.max(0, (item.unitsSold || 0) / (maxUnits || 1)))
      return {
        ...item,
        x,
        yRev: baselineY - revRatio * plotHeight,
        yUnit: baselineY - unitRatio * plotHeight,
      }
    })
  }, [monthly, plotWidth, plotHeight, baselineY, maxRevenueLakhs, maxUnits])

  const lineFor = (key) => points.map((point) => `${point.x.toFixed(1)},${point[key].toFixed(1)}`).join(' ')
  const areaFor = (key) => {
    if (points.length === 0) return ''
    return `${points[0].x.toFixed(1)},${baselineY} ${lineFor(key)} ${points[points.length - 1].x.toFixed(1)},${baselineY}`
  }

  const yTicks = [1, 0.5, 0].map((pct) => ({
    pct,
    label: viewMode === 'units'
      ? `${Math.round(pct * maxUnits)}`
      : `₹${Math.round(pct * maxRevenueLakhs)}L`,
  }))

  const activePoint = hoveredIndex != null ? points[hoveredIndex] : null
  const showPointLabels = points.length > 0 && points.length <= 8
  const hasSales = points.some((point) => point.revenue > 0 || point.unitsSold > 0)

  return (
    <div className="card h-100 border-0 shadow-sm sales-panel">
      <div className="card-header bg-transparent border-0 sales-panel-head">
        <div>
          <h2 className="sales-panel-title">Sales trend</h2>
          <p className="sales-panel-note">{salesData?.rangeLabel || 'Selected period'}</p>
        </div>
        <div className="sales-chart-tools">
          <div className="sales-segment" role="group" aria-label="Chart metric">
            {[
              ['revenue', 'Revenue'],
              ['units', 'Cars'],
              ['combined', 'Both'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={viewMode === id ? 'is-active' : ''}
                onClick={() => setViewMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {onRecordSaleClick && (
            <button type="button" className="sales-quiet-btn" onClick={onRecordSaleClick}>
              Record sale
            </button>
          )}
        </div>
      </div>

      <div className="card-body sales-panel-body">
        <div className="sales-chart-summary">
          <div>
            <span>Revenue</span>
            <strong>{salesData?.totalRevenueFormatted || '₹ 0'}</strong>
          </div>
          <div>
            <span>Sold</span>
            <strong>{salesData?.totalUnitsSold || 0}</strong>
          </div>
          <div>
            <span>Avg. deal</span>
            <strong>{salesData?.avgDealSizeFormatted || '₹ 0'}</strong>
          </div>
        </div>

        <div className="sales-chart">
          <div className="sales-chart-yaxis" aria-hidden="true">
            {yTicks.map((tick) => (
              <span key={tick.pct}>{tick.label}</span>
            ))}
          </div>
          <div className="sales-chart-plot">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label="Sales trend">
              <defs>
                <linearGradient id="salesInkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {yTicks.map((tick) => (
                <line
                  key={tick.pct}
                  x1="0"
                  x2={chartWidth}
                  y1={baselineY - tick.pct * plotHeight}
                  y2={baselineY - tick.pct * plotHeight}
                  stroke="currentColor"
                  strokeOpacity={tick.pct === 0 ? 0.2 : 0.08}
                />
              ))}
              {(viewMode === 'revenue' || viewMode === 'combined') && areaFor('yRev') && (
                <polygon points={areaFor('yRev')} fill="url(#salesInkFill)" />
              )}
              {(viewMode === 'revenue' || viewMode === 'combined') && (
                <polyline points={lineFor('yRev')} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
              )}
              {(viewMode === 'units' || viewMode === 'combined') && (
                <polyline
                  points={lineFor('yUnit')}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={viewMode === 'combined' ? 0.45 : 1}
                  strokeWidth="2.5"
                  strokeDasharray={viewMode === 'combined' ? '5 4' : 'none'}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {points.map((point, index) => {
                const cy = viewMode === 'units' ? point.yUnit : point.yRev
                const active = hoveredIndex === index
                return (
                  <g key={point.key || point.month}>
                    <circle cx={point.x} cy={cy} r={active ? 5 : 3.5} fill="var(--bs-body-bg, #fff)" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <rect
                      x={point.x - (plotWidth / Math.max(points.length, 1)) / 2}
                      y="0"
                      width={plotWidth / Math.max(points.length, 1)}
                      height={chartHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                )
              })}
            </svg>
            {showPointLabels && points.map((point, index) => (
              <span
                key={`label-${point.key || index}`}
                className="sales-chart-value"
                style={{ left: `${(point.x / chartWidth) * 100}%`, top: `${((viewMode === 'units' ? point.yUnit : point.yRev) / chartHeight) * 100}%` }}
              >
                {viewMode === 'units' ? point.unitsSold : point.revenueFormatted}
              </span>
            ))}
            {activePoint && (
              <div
                className="sales-chart-tip"
                style={{ left: `${Math.min(78, Math.max(18, (activePoint.x / chartWidth) * 100))}%` }}
              >
                <strong>{activePoint.month}</strong>
                <span>{activePoint.revenueFormatted} · {activePoint.unitsSold} sold</span>
                {activePoint.topModel ? <span>{activePoint.topModel}</span> : null}
              </div>
            )}
            {!hasSales && <p className="sales-chart-empty">No sales recorded in this period.</p>}
          </div>
        </div>
        <div className="sales-chart-xaxis">
          {points.map((point, index) => {
            const step = points.length > 16 ? 5 : points.length > 8 ? 2 : 1
            if (index % step !== 0 && index !== points.length - 1) return null
            return (
              <button
                key={point.key || point.month}
                type="button"
                className={hoveredIndex === index ? 'is-active' : ''}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                {point.month}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

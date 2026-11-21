import React, { useState, useMemo } from 'react'
import {
  FEATURES_BANK,
  FEATURE_CATEGORIES,
  CATEGORY_ICONS,
  renderFeatureIcon,
  getFeatureById,
} from '../data/featuresBank'
import { Search, Check, X, Sparkles, Plus } from 'lucide-react'

/**
 * Clean & Deduplicated Features Bank Selector for Admin Dashboard & Vehicle Forms
 * Eliminates redundant/duplicate features and provides a simple, modern selection UI.
 */
export default function FeaturesSelector({
  selectedFeatures = [],
  onChange,
  maxHighlights = 12,
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [customFeatureName, setCustomFeatureName] = useState('')

  // Selected feature IDs / names set with alias resolution
  const selectedIds = useMemo(() => {
    const set = new Set()
    selectedFeatures.forEach((f) => {
      if (!f) return
      const rawId = typeof f === 'string' ? f : (f.id || f.name)
      const def = getFeatureById(rawId)
      if (def) {
        set.add(def.id.toLowerCase())
      }
      set.add(String(rawId).toLowerCase())
    })
    return set
  }, [selectedFeatures])

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts = { All: FEATURES_BANK.length }
    FEATURE_CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = FEATURES_BANK.filter((f) => f.category === cat).length
      }
    })
    return counts
  }, [])

  // Filter features based on search & category
  const filteredFeatures = useMemo(() => {
    return FEATURES_BANK.filter((f) => {
      if (category !== 'All' && f.category !== category) return false
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        return (
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, category])

  // Toggle a feature
  const toggleFeature = (feature) => {
    const featureKey = (feature.id || feature.name).toLowerCase()
    let next
    if (selectedIds.has(featureKey)) {
      next = selectedFeatures.filter((f) => {
        const raw = typeof f === 'string' ? f : (f.id || f.name)
        const def = getFeatureById(raw)
        const canonicalKey = def ? def.id.toLowerCase() : String(raw).toLowerCase()
        return canonicalKey !== featureKey && String(raw).toLowerCase() !== featureKey
      })
    } else {
      const newFeatureObj = {
        id: feature.id,
        name: feature.name,
        iconName: feature.iconName,
        category: feature.category,
      }
      next = [...selectedFeatures, newFeatureObj]
    }
    onChange(next)
  }

  // Add custom feature
  const handleAddCustomFeature = (nameToAdd) => {
    const trimmed = (nameToAdd || customFeatureName).trim()
    if (!trimmed) return
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const newFeatureObj = {
      id: slug,
      name: trimmed,
      iconName: 'Sparkles',
      category: category !== 'All' ? category : 'Comfort & Convenience',
    }
    onChange([...selectedFeatures, newFeatureObj])
    setCustomFeatureName('')
    setSearch('')
  }

  // Quick preset: popular top features
  const handleSelectPopular = () => {
    const popularList = FEATURES_BANK.filter((f) => f.popular).slice(0, 8)
    const formatted = popularList.map((f) => ({
      id: f.id,
      name: f.name,
      iconName: f.iconName,
      category: f.category,
    }))
    onChange(formatted)
  }

  // Clear all
  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className="features-selector-box border rounded-3 p-3 bg-body-tertiary">
      {/* Header & Counter */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-warning" />
              <span>Features Bank & Vehicle Highlights</span>
            </h6>
            <span
              className={`badge rounded-pill ${
                selectedFeatures.length >= 4 && selectedFeatures.length <= maxHighlights
                  ? 'bg-success'
                  : selectedFeatures.length > maxHighlights
                  ? 'bg-warning text-dark'
                  : selectedFeatures.length > 0
                  ? 'bg-primary'
                  : 'bg-secondary'
              }`}
              style={{ fontSize: '11px', padding: '3.5px 8px' }}
            >
              {selectedFeatures.length} / {maxHighlights} Selected
            </span>
          </div>
          <small className="text-muted d-block mt-0.5" style={{ fontSize: '11.5px' }}>
            Choose distinct car highlights to showcase on vehicle cards and specification sheet.
          </small>
        </div>

        <div className="d-flex align-items-center gap-1.5">
          <button
            type="button"
            className="btn btn-xs btn-outline-primary rounded-pill"
            onClick={handleSelectPopular}
            style={{ fontSize: '11px', padding: '3.5px 10px' }}
          >
            Recommended Top 8
          </button>
          {selectedFeatures.length > 0 && (
            <button
              type="button"
              className="btn btn-xs btn-outline-danger rounded-pill"
              onClick={handleClearAll}
              style={{ fontSize: '11px', padding: '3.5px 10px' }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Selected Highlights Preview Chips */}
      {selectedFeatures.length > 0 ? (
        <div className="mb-3 p-2.5 rounded-3 bg-body border shadow-2xs">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <small className="fw-bold text-uppercase text-secondary" style={{ fontSize: '10.5px', letterSpacing: '0.5px' }}>
              Selected Car Highlights ({selectedFeatures.length})
            </small>
            <small className="text-muted" style={{ fontSize: '11px' }}>
              Click ✕ to remove
            </small>
          </div>
          <div className="d-flex flex-wrap gap-1.5">
            {selectedFeatures.map((feat) => {
              const featId = typeof feat === 'string' ? feat : feat.id
              const fullDef = getFeatureById(featId) || feat
              const displayName = fullDef.name || (typeof feat === 'string' ? feat : featId)
              const iconName = fullDef.iconName || 'Sparkles'

              return (
                <span
                  key={fullDef.id || displayName}
                  className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1.5 py-1.5 px-2.5 rounded-pill shadow-2xs"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                >
                  <span className="d-inline-flex align-items-center">
                    {renderFeatureIcon(iconName, 'w-3.5 h-3.5')}
                  </span>
                  <span>{displayName}</span>
                  <button
                    type="button"
                    onClick={() => toggleFeature(fullDef)}
                    className="btn btn-link p-0 text-primary ms-1 d-inline-flex align-items-center hover-text-danger"
                    title="Remove highlight"
                    style={{ textDecoration: 'none' }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="alert alert-secondary py-2 px-3 small rounded-3 mb-3 d-flex align-items-center justify-content-between">
          <span>No highlights selected yet. Choose 4–{maxHighlights} features below to showcase with badges.</span>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none small fw-semibold"
            onClick={handleSelectPopular}
          >
            Auto-pick top 8
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="row g-2 align-items-center mb-3">
        {/* Search Input */}
        <div className="col-12 col-md-5">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-body border-end-0">
              <Search className="w-3.5 h-3.5 text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search features (sunroof, mileage, camera, airbags)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim() && filteredFeatures.length === 0) {
                  e.preventDefault()
                  handleAddCustomFeature(search)
                }
              }}
            />
            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearch('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Scrollable */}
        <div className="col-12 col-md-7">
          <div
            className="d-flex gap-1 overflow-x-auto pb-1 align-items-center"
            style={{
              scrollbarWidth: 'thin',
              whiteSpace: 'nowrap',
            }}
          >
            {FEATURE_CATEGORIES.map((cat) => {
              const isActive = category === cat
              const icon = CATEGORY_ICONS[cat] || '✨'
              const count = categoryCounts[cat] || 0

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`btn btn-xs rounded-pill d-inline-flex align-items-center gap-1.5 transition-all flex-shrink-0 ${
                    isActive
                      ? 'btn-dark text-white shadow-2xs'
                      : 'btn-outline-secondary bg-body text-body'
                  }`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  <span>{icon}</span>
                  <span className="fw-medium">{cat}</span>
                  <span
                    className={`badge rounded-pill ${
                      isActive ? 'bg-white text-dark' : 'bg-body-secondary text-secondary'
                    }`}
                    style={{ fontSize: '9.5px', padding: '2px 5px' }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Features Bank Grid */}
      <div
        className="features-bank-grid row g-2"
        style={{
          maxHeight: '340px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {filteredFeatures.map((feature) => {
          const isSelected = selectedIds.has(feature.id.toLowerCase())
          return (
            <div key={feature.id} className="col-12 col-sm-6 col-lg-4">
              <div
                onClick={() => toggleFeature(feature)}
                className={`p-2.5 rounded-3 border d-flex align-items-center gap-2.5 transition position-relative ${
                  isSelected
                    ? 'border-primary bg-primary-subtle text-primary shadow-xs'
                    : 'bg-body border-secondary-subtle text-body hover-border-primary'
                }`}
                style={{
                  cursor: 'pointer',
                  minHeight: '56px',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                {/* Feature Icon */}
                <div
                  className={`rounded-2 flex-shrink-0 d-flex align-items-center justify-content-center transition ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-body-secondary text-secondary'
                  }`}
                  style={{ width: '34px', height: '34px' }}
                >
                  {renderFeatureIcon(feature.iconName, 'w-4 h-4')}
                </div>

                {/* Feature Title & Description */}
                <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center justify-content-between gap-1">
                    <span
                      className={`text-truncate small d-block ${
                        isSelected ? 'fw-bold text-primary' : 'fw-semibold text-body'
                      }`}
                      title={feature.name}
                      style={{ fontSize: '12px', lineHeight: 1.25 }}
                    >
                      {feature.name}
                    </span>
                    <div className="flex-shrink-0 ms-1">
                      {isSelected ? (
                        <span
                          className="badge bg-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '17px', height: '17px' }}
                        >
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </span>
                      ) : (
                        <span
                          className="rounded-circle border border-secondary-subtle d-inline-block"
                          style={{ width: '15px', height: '15px', opacity: 0.4 }}
                        />
                      )}
                    </div>
                  </div>
                  <small
                    className="text-muted d-block text-truncate mt-0.5"
                    style={{ fontSize: '10.5px', lineHeight: 1.2 }}
                    title={feature.description}
                  >
                    {feature.description}
                  </small>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty state & Custom Add */}
        {filteredFeatures.length === 0 && (
          <div className="col-12 text-center py-4 bg-body rounded-3 border">
            <p className="text-muted small mb-2">No predefined feature found matching "{search}"</p>
            {search.trim() && (
              <button
                type="button"
                onClick={() => handleAddCustomFeature(search)}
                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 shadow-xs rounded-pill"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{search.trim()}" as Custom Feature</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Feature Quick-Add Row */}
      <div className="mt-3 pt-2.5 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
        <small className="text-muted" style={{ fontSize: '11px' }}>
          Need a specific feature not listed? Type custom name:
        </small>
        <div className="d-flex align-items-center gap-1.5" style={{ maxWidth: '340px', width: '100%' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="e.g. Dashcam / Ceramic Coating"
            value={customFeatureName}
            onChange={(e) => setCustomFeatureName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomFeature()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 flex-shrink-0 rounded-pill"
            onClick={() => handleAddCustomFeature()}
            disabled={!customFeatureName.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

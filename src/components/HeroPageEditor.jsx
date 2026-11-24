import React, { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_HERO_CONTENT,
  fetchHeroContentFromSupabase,
  saveHeroContentToSupabase,
  getCachedHeroContent,
} from '../lib/supabase'
import {
  getVehicleThumbnail,
  formatCreationDate,
  formatCreationTime,
} from '../data/carStorage'

function isHeroCandidate(car) {
  if (!car) return false
  if (car.showInHero) return true
  if (car.isDraft || car.listingStatus === 'Draft' || car.listingStatus === 'Sold') return false
  return true
}

export default function HeroPageEditor({ cars = [], onToggleHero }) {
  const [form, setForm] = useState(() => getCachedHeroContent() || DEFAULT_HERO_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [query, setQuery] = useState('')
  const [heroOverrides, setHeroOverrides] = useState({})

  useEffect(() => {
    let active = true
    fetchHeroContentFromSupabase()
      .then((content) => {
        if (active && content) setForm(content)
      })
      .catch((err) => {
        if (active) {
          setMessage({
            type: 'danger',
            text: err.message || 'Hero content table is not available yet. Run the hero page SQL, then reload.',
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    // When parent cars state updates, clear any matching overrides
    setHeroOverrides((prev) => {
      const next = { ...prev }
      let changed = false
      for (const [id, val] of Object.entries(prev)) {
        const matchingCar = cars.find((c) => String(c.id) === String(id))
        if (matchingCar && Boolean(matchingCar.showInHero) === val) {
          delete next[id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [cars])

  const handleToggle = (car) => {
    const current = heroOverrides[car.id] !== undefined ? heroOverrides[car.id] : Boolean(car.showInHero)
    const next = !current
    setHeroOverrides((prev) => ({ ...prev, [car.id]: next }))
    if (onToggleHero) onToggleHero(car, next)
  }

  const listedCars = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cars
      .filter(isHeroCandidate)
      .filter((car) => {
        if (!needle) return true
        const haystack = `${car.title || ''} ${car.make || ''} ${car.model || ''} ${car.variant || ''}`.toLowerCase()
        return haystack.includes(needle)
      })
      .sort((a, b) => {
        const aHero = heroOverrides[a.id] !== undefined ? heroOverrides[a.id] : Boolean(a.showInHero)
        const bHero = heroOverrides[b.id] !== undefined ? heroOverrides[b.id] : Boolean(b.showInHero)
        return Number(bHero) - Number(aHero)
      })
  }, [cars, query, heroOverrides])

  const markedCount = cars.filter((car) => {
    const isHero = heroOverrides[car.id] !== undefined ? heroOverrides[car.id] : Boolean(car.showInHero)
    return isHero && car.listingStatus !== 'Sold' && car.listingStatus !== 'Draft' && !car.isDraft
  }).length

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const saved = await saveHeroContentToSupabase(form)
      setForm(saved)
      setMessage({ type: 'success', text: 'Hero page content saved. It is live on the home page.' })
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message || 'Could not save. Run supabase/migrations/20261121000000_hero_page.sql first.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h4 mb-1 fw-bold">Hero Page</h1>
          <p className="text-muted small mb-0">
            Edit the headline and the three stats. Mark cars below to rotate them in the photo.
          </p>
        </div>
        <span className="badge bg-dark">{markedCount} on hero</span>
      </div>

      {message && (
        <div className={`alert alert-${message.type} py-2 small`} role="status">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="card border-0 shadow-sm p-4 mb-4">
        <h2 className="h6 fw-bold mb-3">Page copy</h2>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label small fw-semibold" htmlFor="hero-eyebrow">Line above the headline</label>
            <input id="hero-eyebrow" className="form-control" value={form.eyebrow} onChange={setField('eyebrow')} disabled={loading} />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="hero-headline">Headline</label>
            <input id="hero-headline" className="form-control" value={form.headline} onChange={setField('headline')} disabled={loading} required />
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-semibold" htmlFor="hero-accent">Headline second line</label>
            <input id="hero-accent" className="form-control" value={form.headlineAccent} onChange={setField('headlineAccent')} disabled={loading} />
          </div>
          <div className="col-12">
            <label className="form-label small fw-semibold" htmlFor="hero-description">Text under the headline</label>
            <textarea id="hero-description" className="form-control" rows="2" value={form.description} onChange={setField('description')} disabled={loading} />
          </div>
        </div>

        <h2 className="h6 fw-bold mt-4 mb-3">Three stats</h2>
        <div className="row g-3">
          {[1, 2, 3].map((n) => (
            <div className="col-md-4" key={n}>
              <div className="border rounded p-3 h-100">
                <div className="small text-muted mb-2">Stat {n}</div>
                <label className="form-label small fw-semibold" htmlFor={`hero-stat-${n}-value`}>Value</label>
                <input
                  id={`hero-stat-${n}-value`}
                  className="form-control mb-2"
                  value={form[`stat${n}Value`]}
                  onChange={setField(`stat${n}Value`)}
                  disabled={loading}
                />
                <label className="form-label small fw-semibold" htmlFor={`hero-stat-${n}-label`}>Label</label>
                <input
                  id={`hero-stat-${n}-label`}
                  className="form-control"
                  value={form[`stat${n}Label`]}
                  onChange={setField(`stat${n}Label`)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-dark" disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save hero content'}
          </button>
        </div>
      </form>

      <div className="card border-0 shadow-sm">
        <div className="card-body border-bottom d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
          <div>
            <h2 className="h6 fw-bold mb-1">Cars on the hero</h2>
            <p className="text-muted small mb-0">Turn a car on and it appears in the home page carousel, using its own photo, price, and specs.</p>
          </div>
          <input
            type="search"
            className="form-control"
            style={{ maxWidth: 280 }}
            placeholder="Search inventory"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 90 }}>Hero</th>
                <th>Vehicle</th>
                <th style={{ minWidth: 130 }}>Created</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {listedCars.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">No cars match.</td>
                </tr>
              ) : (
                listedCars.map((car) => {
                  const isChecked = heroOverrides[car.id] !== undefined ? heroOverrides[car.id] : Boolean(car.showInHero)
                  return (
                    <tr key={car.id}>
                      <td>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`hero-car-${car.id}`}
                            checked={isChecked}
                            onChange={() => handleToggle(car)}
                            aria-label={`Show ${car.title} on the hero`}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <img
                            src={getVehicleThumbnail(car)}
                            alt={car.title}
                            className="rounded border flex-shrink-0"
                            style={{ width: 68, height: 48, objectFit: 'contain', background: '#f8fafc' }}
                            onError={(e) => {
                              e.target.src = '/mock_cars/honda_city_front.jpg'
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold small text-truncate" style={{ maxWidth: 280 }}>{car.title}</div>
                            <div className="text-muted text-truncate" style={{ fontSize: 12, maxWidth: 280 }}>
                              {car.km} · {car.fuel} · {car.transmission}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="small text-nowrap">
                        <div className="fw-semibold text-dark">{formatCreationDate(car.createdAt || car.created_at)}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {formatCreationTime(car.createdAt || car.created_at)}
                        </div>
                      </td>
                      <td className="small fw-semibold">{car.priceFormatted}</td>
                      <td className="small">
                        <span className={`badge rounded-pill ${car.listingStatus === 'Available' || !car.listingStatus ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}>
                          {car.listingStatus || 'Available'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_HERO_CONTENT,
  fetchHeroContentFromSupabase,
  saveHeroContentToSupabase,
} from '../lib/supabase'

function isHeroCandidate(car) {
  if (!car) return false
  if (car.showInHero) return true
  if (car.isDraft || car.listingStatus === 'Draft' || car.listingStatus === 'Sold') return false
  return true
}

export default function HeroPageEditor({ cars = [], onToggleHero }) {
  const [form, setForm] = useState(DEFAULT_HERO_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [query, setQuery] = useState('')

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

  const listedCars = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return cars
      .filter(isHeroCandidate)
      .filter((car) => {
        if (!needle) return true
        const haystack = `${car.title || ''} ${car.make || ''} ${car.model || ''} ${car.variant || ''}`.toLowerCase()
        return haystack.includes(needle)
      })
      .sort((a, b) => Number(b.showInHero) - Number(a.showInHero))
  }, [cars, query])

  const markedCount = cars.filter((car) => car.showInHero && car.listingStatus !== 'Sold' && car.listingStatus !== 'Draft' && !car.isDraft).length

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
                <th style={{ width: 110 }}>Hero</th>
                <th>Vehicle</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {listedCars.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">No cars match.</td>
                </tr>
              ) : (
                listedCars.map((car) => (
                  <tr key={car.id}>
                    <td>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`hero-car-${car.id}`}
                          checked={Boolean(car.showInHero)}
                          onChange={() => onToggleHero(car)}
                          aria-label={`Show ${car.title} on the hero`}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={car.image || '/mock_cars/honda_city_front.jpg'}
                          alt=""
                          className="rounded border"
                          style={{ width: 64, height: 44, objectFit: 'cover' }}
                        />
                        <div>
                          <div className="fw-semibold small">{car.title}</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {car.km} · {car.fuel} · {car.transmission}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="small fw-semibold">{car.priceFormatted}</td>
                    <td className="small">{car.listingStatus || 'Available'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

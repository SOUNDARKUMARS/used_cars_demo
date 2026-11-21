import React, { useState, useMemo } from 'react'
import {
  Bell,
  Search,
  Filter,
  Plus,
  Trash2,
  Send,
  Mail,
  User,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  Car,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  X,
} from 'lucide-react'
import {
  formatINR,
  getStoredReminders,
  saveStoredReminders,
  addStoredReminder,
  updateStoredReminder,
  deleteStoredReminder,
  checkCarMatchesReminder,
} from '../data/carStorage'
import {
  fetchRemindersFromSupabase,
  addReminderToSupabase,
  updateReminderInSupabase,
  deleteReminderFromSupabase,
  sendMatchingCarEmails,
} from '../lib/supabase'

export default function AdminRemindersView({
  cars = [],
  showToast = () => {},
}) {
  const [reminders, setReminders] = useState(getStoredReminders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'notified' | 'matched'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedReminderForSend, setSelectedReminderForSend] = useState(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Sync reminders from Supabase on mount
  React.useEffect(() => {
    let isMounted = true
    async function syncReminders() {
      try {
        const cloudReminders = await fetchRemindersFromSupabase()
        if (isMounted && Array.isArray(cloudReminders) && cloudReminders.length > 0) {
          setReminders(cloudReminders)
          saveStoredReminders(cloudReminders)
        }
      } catch (err) {
        console.warn('Notice syncing reminders from cloud:', err.message)
      }
    }
    syncReminders()

    const handleRemindersUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setReminders(e.detail)
      }
    }
    window.addEventListener('nova_reminders_updated', handleRemindersUpdated)
    return () => {
      isMounted = false
      window.removeEventListener('nova_reminders_updated', handleRemindersUpdated)
    }
  }, [])

  // Analyze every reminder against available cars in inventory
  const availableCars = useMemo(() => {
    return (cars || []).filter(
      (c) =>
        c.listingStatus === 'Available' ||
        (!c.isDraft && c.listingStatus !== 'Draft')
    )
  }, [cars])

  const reminderStockMatches = useMemo(() => {
    const matchesMap = new Map()
    for (const rem of reminders) {
      const matchingCars = []
      for (const car of availableCars) {
        const res = checkCarMatchesReminder(car, rem)
        if (res.isMatch) {
          matchingCars.push({ car, analysis: res })
        }
      }
      matchesMap.set(rem.id, matchingCars)
    }
    return matchesMap
  }, [reminders, availableCars])

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      // Status filter
      if (statusFilter === 'active' && rem.status !== 'active') return false
      if (statusFilter === 'notified' && rem.status !== 'notified') return false
      if (statusFilter === 'matched') {
        const matched = reminderStockMatches.get(rem.id) || []
        if (matched.length === 0) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (rem.customerName || '').toLowerCase().includes(q)
        const matchEmail = (rem.email || '').toLowerCase().includes(q)
        const matchPhone = (rem.phone || '').toLowerCase().includes(q)
        const matchMake = (rem.make || '').toLowerCase().includes(q)
        const matchModel = (rem.model || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchMake && !matchModel) {
          return false
        }
      }

      return true
    })
  }, [reminders, statusFilter, searchQuery, reminderStockMatches])

  // KPIs
  const totalCount = reminders.length
  const activeCount = reminders.filter((r) => r.status === 'active').length
  const notifiedCount = reminders.filter((r) => r.status === 'notified').length
  const matchedInStockCount = reminders.filter((r) => {
    const matches = reminderStockMatches.get(r.id) || []
    return matches.length > 0
  }).length

  // Delete reminder
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete car reminder for ${name}?`)) return
    const updated = deleteStoredReminder(id)
    setReminders(updated)
    deleteReminderFromSupabase(id).catch((e) =>
      console.warn('Notice deleting reminder in Supabase:', e.message)
    )
    showToast(`Reminder for ${name} removed`, 'info')
  }

  // Toggle status
  const handleToggleStatus = async (rem) => {
    const nextStatus = rem.status === 'active' ? 'notified' : 'active'
    const updated = updateStoredReminder(rem.id, { status: nextStatus })
    setReminders(updated)
    updateReminderInSupabase(rem.id, { status: nextStatus }).catch((e) =>
      console.warn('Notice updating status in Supabase:', e.message)
    )
    showToast(`Reminder marked as ${nextStatus}`, 'success')
  }

  // Send email to a customer with a specific matching car
  const handleSendMatchingEmail = async (rem, car) => {
    setIsSendingEmail(true)
    try {
      const res = await sendMatchingCarEmails({
        reminders: [rem],
        car,
      })
      if (!res.sent) {
        throw new Error(res.results?.[0]?.error || 'send-email did not accept this message')
      }

      showToast(`Reminder email sent to ${rem.email}!`, 'success')
      setReminders(getStoredReminders())
      setSelectedReminderForSend(null)
    } catch (err) {
      console.error('Failed sending reminder email:', err)
      showToast(`Could not send email: ${err.message}`, 'error')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-bell-fill text-primary"></i>
            <span>Car Reminders & Buyer Stock Alerts</span>
          </h2>
          <p className="text-muted small mb-0">
            Track user car requirement reminders and send email alerts when matching vehicles arrive in stock.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 fw-bold px-3 shadow-sm"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Buyer Reminder</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Total Reminders</span>
              <span className="badge bg-primary-subtle text-primary rounded-pill p-1.5">
                <i className="bi bi-bell"></i>
              </span>
            </div>
            <h3 className="h4 fw-bold mb-0 text-dark">{totalCount}</h3>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Actively Looking</span>
              <span className="badge bg-success-subtle text-success rounded-pill p-1.5">
                <i className="bi bi-check-circle"></i>
              </span>
            </div>
            <h3 className="h4 fw-bold mb-0 text-success">{activeCount}</h3>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Matched in Stock</span>
              <span className="badge bg-warning-subtle text-warning rounded-pill p-1.5">
                <i className="bi bi-sparkles"></i>
              </span>
            </div>
            <h3 className="h4 fw-bold mb-0 text-warning">{matchedInStockCount}</h3>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted fw-semibold">Already Notified</span>
              <span className="badge bg-info-subtle text-info rounded-pill p-1.5">
                <i className="bi bi-envelope-check"></i>
              </span>
            </div>
            <h3 className="h4 fw-bold mb-0 text-info">{notifiedCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3">
        <div className="row g-2 align-items-center justify-content-between">
          {/* Status Buttons */}
          <div className="col-12 col-md-auto">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`btn ${statusFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`btn ${statusFilter === 'active' ? 'btn-dark' : 'btn-outline-secondary'}`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('matched')}
                className={`btn ${statusFilter === 'matched' ? 'btn-dark' : 'btn-outline-secondary'}`}
              >
                🎯 In Stock Matches ({matchedInStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('notified')}
                className={`btn ${statusFilter === 'notified' ? 'btn-dark' : 'btn-outline-secondary'}`}
              >
                Notified ({notifiedCount})
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by buyer name, email, brand, model..."
                className="form-control border-start-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn btn-outline-secondary border-start-0"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reminders Cards / Table */}
      {filteredReminders.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 p-5 text-center">
          <i className="bi bi-bell-slash text-muted fs-1 mb-2"></i>
          <h5 className="fw-bold text-dark">No Reminders Found</h5>
          <p className="text-muted small mb-3">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'No buyer alert reminders registered under this filter.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm mx-auto d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Buyer Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((rem) => {
            const stockMatches = reminderStockMatches.get(rem.id) || []
            const hasMatches = stockMatches.length > 0

            return (
              <div
                key={rem.id}
                className={`card border-0 shadow-sm rounded-3 p-3 p-md-4 transition ${
                  hasMatches ? 'border-start border-primary border-4' : ''
                }`}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                  {/* Left: Customer & Car Requirement */}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <h4 className="h6 fw-bold text-dark mb-0">{rem.customerName}</h4>
                      <span
                        className={`badge rounded-pill ${
                          rem.status === 'active'
                            ? 'bg-success-subtle text-success'
                            : 'bg-info-subtle text-info'
                        }`}
                      >
                        {rem.status === 'active' ? 'Active Alert' : 'Notified'}
                      </span>
                      {hasMatches && (
                        <span className="badge bg-warning text-dark rounded-pill fw-bold d-flex align-items-center gap-1">
                          <i className="bi bi-lightning-charge-fill"></i>
                          <span>{stockMatches.length} Matching Car(s) in Stock!</span>
                        </span>
                      )}
                    </div>

                    {/* Contact Pills */}
                    <div className="d-flex align-items-center gap-3 text-muted small mb-2 flex-wrap">
                      <span className="d-flex align-items-center gap-1">
                        <i className="bi bi-envelope"></i>
                        <a href={`mailto:${rem.email}`} className="text-muted text-decoration-none">
                          {rem.email}
                        </a>
                      </span>
                      {rem.phone && (
                        <span className="d-flex align-items-center gap-1">
                          <i className="bi bi-telephone"></i>
                          <a href={`tel:${rem.phone}`} className="text-muted text-decoration-none">
                            {rem.phone}
                          </a>
                        </span>
                      )}
                      <span className="text-muted">
                        Added {new Date(rem.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Requirement Specs Badges */}
                    <div className="p-2.5 bg-light rounded-3 d-flex flex-wrap gap-2 text-dark small mb-2">
                      <span className="badge bg-white text-dark border">
                        <strong>Brand:</strong> {rem.make || 'Any'}
                      </span>
                      <span className="badge bg-white text-dark border">
                        <strong>Model:</strong> {rem.model || 'Any'}
                      </span>
                      <span className="badge bg-white text-dark border">
                        <strong>Year:</strong> {rem.minYear || 2015} – {rem.maxYear || 2026}
                      </span>
                      <span className="badge bg-white text-primary border border-primary-subtle fw-bold">
                        <strong>Budget:</strong> {formatINR(rem.minPrice || 0)} –{' '}
                        {formatINR(rem.maxPrice || 5000000)}
                      </span>
                      {rem.fuelType && rem.fuelType !== 'Any' && (
                        <span className="badge bg-white text-dark border">
                          <strong>Fuel:</strong> {rem.fuelType}
                        </span>
                      )}
                      {rem.transmission && rem.transmission !== 'Any' && (
                        <span className="badge bg-white text-dark border">
                          <strong>Trans:</strong> {rem.transmission}
                        </span>
                      )}
                      {rem.bodyType && rem.bodyType !== 'Any' && (
                        <span className="badge bg-white text-dark border">
                          <strong>Style:</strong> {rem.bodyType}
                        </span>
                      )}
                    </div>

                    {rem.notes && (
                      <p className="small text-muted fst-italic mb-2">
                        <i className="bi bi-chat-left-quote me-1"></i>
                        "{rem.notes}"
                      </p>
                    )}

                    {/* In-Stock Matching Vehicles Preview */}
                    {hasMatches && (
                      <div className="mt-2 p-2 bg-warning-subtle rounded-3 border border-warning">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="small fw-bold text-dark d-flex align-items-center gap-1">
                            <i className="bi bi-car-front text-warning"></i>
                            <span>Live Inventory Vehicles Matching This Reminder:</span>
                          </span>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {stockMatches.map(({ car, analysis }) => (
                            <div
                              key={car.id}
                              className="d-flex align-items-center gap-2 bg-white px-2.5 py-1.5 rounded-2xl border shadow-2xs small"
                            >
                              <span className="fw-bold text-dark">
                                {car.year} {car.make} {car.model}
                              </span>
                              <span className="text-primary fw-bold">
                                {formatINR(car.price)}
                              </span>
                              <button
                                type="button"
                                disabled={isSendingEmail}
                                onClick={() => handleSendMatchingEmail(rem, car)}
                                className="btn btn-primary btn-xs py-0 px-2 fw-bold text-white rounded-pill d-flex align-items-center gap-1"
                                title="Send email notification for this car"
                              >
                                <i className="bi bi-send-fill text-[10px]"></i>
                                <span>Email Now</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="d-flex align-items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rem)}
                      className={`btn btn-sm ${
                        rem.status === 'active' ? 'btn-outline-success' : 'btn-outline-secondary'
                      }`}
                      title="Toggle active or notified status"
                    >
                      {rem.status === 'active' ? 'Mark Notified' : 'Reactivate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(rem.id, rem.customerName)}
                      className="btn btn-outline-danger btn-sm"
                      title="Delete reminder"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Footer details */}
                {rem.lastNotifiedAt && (
                  <div className="mt-2 pt-2 border-top text-muted small d-flex align-items-center gap-3">
                    <span>
                      <i className="bi bi-clock-history me-1"></i>
                      Last notified:{' '}
                      {new Date(rem.lastNotifiedAt).toLocaleDateString()} at{' '}
                      {new Date(rem.lastNotifiedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>
                      Total emails sent: <strong>{rem.notificationCount || 1}</strong>
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add Buyer Reminder Manually */}
      {isAddModalOpen && (
        <AdminAddReminderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(newRem) => {
            setReminders(getStoredReminders())
            setIsAddModalOpen(false)
            showToast(`Reminder for ${newRem.customerName} created!`, 'success')
          }}
        />
      )}
    </div>
  )
}

function AdminAddReminderModal({ isOpen, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [make, setMake] = useState('Any')
  const [model, setModel] = useState('')
  const [minYear, setMinYear] = useState('2018')
  const [maxYear, setMaxYear] = useState('2026')
  const [minPrice, setMinPrice] = useState('500000')
  const [maxPrice, setMaxPrice] = useState('2500000')
  const [fuelType, setFuelType] = useState('Any')
  const [transmission, setTransmission] = useState('Any')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerName.trim() || !email.trim()) {
      alert('Please fill out customer name and email')
      return
    }

    setIsSubmitting(true)

    const payload = {
      id: `rem-${Date.now()}`,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      make: make.trim() || 'Any',
      model: model.trim() || 'Any',
      minYear: Number(minYear) || 2015,
      maxYear: Number(maxYear) || 2026,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 5000000,
      fuelType,
      transmission,
      bodyType: 'Any',
      notes: notes.trim(),
      status: 'active',
      notificationCount: 0,
      lastNotifiedAt: null,
      createdAt: new Date().toISOString(),
    }

    try {
      addStoredReminder(payload)
      addReminderToSupabase(payload).catch((e) =>
        console.warn('Notice saving reminder to Supabase:', e.message)
      )
      onSuccess(payload)
    } catch (err) {
      console.error('Failed creating reminder:', err)
      alert('Could not save reminder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content rounded-3 border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title h6 fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-bell-fill text-warning"></i>
              <span>Add Buyer Car Reminder</span>
            </h5>
            <button
              type="button"
              onClick={onClose}
              className="btn-close btn-close-white"
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 space-y-3">
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <hr className="my-2" />

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Make / Brand</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Toyota, Hyundai, Any"
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Model Keyword</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Fortuner, Creta"
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Min Year</label>
                  <input
                    type="number"
                    value={minYear}
                    onChange={(e) => setMinYear(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Max Year</label>
                  <input
                    type="number"
                    value={maxYear}
                    onChange={(e) => setMaxYear(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>

                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="form-select form-select-sm"
                  >
                    <option value="Any">Any Fuel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="form-select form-select-sm"
                  >
                    <option value="Any">Any Transmission</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold mb-1">Customer Notes / Trims</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Requires 4x4 automatic, single owner, under 50,000 km"
                    className="form-control form-control-sm"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light p-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-sm fw-bold px-3"
              >
                {isSubmitting ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

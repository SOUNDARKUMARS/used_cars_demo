import React, { useState, useEffect } from 'react'
import { formatINR } from '../data/carStorage.js'

export default function RecordSaleModal({ isOpen, car, onClose, onConfirm }) {
  const [soldPrice, setSoldPrice] = useState('')
  const [soldDate, setSoldDate] = useState('')
  const [soldTo, setSoldTo] = useState('')
  const [soldNotes, setSoldNotes] = useState('')
  const [paymentMode, setPaymentMode] = useState('Bank Transfer / NEFT')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (car) {
      setSoldPrice(car.price ? String(car.price) : '')
      const today = new Date().toISOString().split('T')[0]
      setSoldDate(today)
      setSoldTo(car.soldTo || '')
      setSoldNotes(car.soldNotes || '')
      setPaymentMode('Bank Transfer / NEFT')
    }
  }, [car, isOpen])

  if (!isOpen || !car) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const finalPrice = Number(soldPrice) || Number(car.price) || 0
    const finalDate = soldDate ? new Date(soldDate).toISOString() : new Date().toISOString()
    const fullNotes = paymentMode ? `[${paymentMode}] ${soldNotes}`.trim() : soldNotes

    try {
      await onConfirm({
        soldPrice: finalPrice,
        revenue: finalPrice,
        soldAt: finalDate,
        soldTo: soldTo.trim() || 'Showroom Customer',
        soldNotes: fullNotes,
        listingStatus: 'Sold',
      })
      onClose()
    } catch (err) {
      console.error('Failed recording sale:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickSaleAtListingPrice = async () => {
    setIsSubmitting(true)
    const finalPrice = Number(car.price) || 0
    try {
      await onConfirm({
        soldPrice: finalPrice,
        revenue: finalPrice,
        soldAt: new Date().toISOString(),
        soldTo: 'Direct Customer',
        soldNotes: 'Sold at showroom listing price',
        listingStatus: 'Sold',
      })
      onClose()
    } catch (err) {
      console.error('Quick sale error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-success text-white px-4 py-3 border-0">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-cash-coin fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-white">Record Vehicle Sale</h5>
                <small className="text-white text-opacity-80">Track dealership revenue & units sold</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Vehicle Summary Card */}
              <div className="card bg-body-tertiary border-0 rounded-3 p-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={car.image || '/hero-fortuner.png'}
                    alt={car.title}
                    className="rounded-2 object-fit-cover shadow-sm"
                    style={{ width: '70px', height: '52px' }}
                    onError={(e) => { e.currentTarget.src = '/hero-fortuner.png' }}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <h6 className="fw-bold mb-1 text-truncate">{car.title}</h6>
                    <div className="small text-muted d-flex align-items-center gap-2 flex-wrap">
                      <span>{car.year}</span>
                      <span>&bull;</span>
                      <span>{car.fuel}</span>
                      <span>&bull;</span>
                      <span>{car.km || `${car.kmNumeric?.toLocaleString('en-IN') || 0} km`}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-secondary-subtle text-secondary small mb-1 d-block">Listed Price</span>
                    <span className="fw-bold text-success">{formatINR(car.price)}</span>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="row g-3">
                {/* Final Sold Price */}
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">
                    Final Sold Price (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-bold text-muted">₹</span>
                    <input
                      type="number"
                      className="form-control fw-bold"
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                      placeholder={car.price || '0'}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-text small text-muted">
                    {soldPrice ? formatINR(soldPrice) : 'Enter final realized price'}
                  </div>
                </div>

                {/* Sold Date */}
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">
                    Sale Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    required
                  />
                  <div className="form-text small text-muted">Determines the month in revenue charts</div>
                </div>

                {/* Buyer / Customer Name */}
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Buyer Name / Contact</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Anand Kumar (+91...)"
                    value={soldTo}
                    onChange={(e) => setSoldTo(e.target.value)}
                  />
                </div>

                {/* Payment Mode */}
                <div className="col-sm-6">
                  <label className="form-label small fw-semibold">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="Auto Loan / Finance">Auto Loan / Finance</option>
                    <option value="Cash + Online">Cash + Online</option>
                    <option value="Car Exchange + Cash">Car Exchange + Cash</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-12">
                  <label className="form-label small fw-semibold">Sale Remarks / Invoice Ref</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Invoice #INV-2026-88, RC transfer initiated"
                    value={soldNotes}
                    onChange={(e) => setSoldNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Informative Alert */}
              <div className="alert alert-success bg-success bg-opacity-10 border-0 rounded-3 mt-3 mb-0 p-2.5 small d-flex align-items-center gap-2">
                <i className="bi bi-graph-up-arrow text-success fs-5"></i>
                <div className="text-success-emphasis">
                  Recording this sale will update the <strong>Sales Revenue Graph</strong>, increase monthly unit count, and record revenue under <strong>{car.bodyType || 'SUV'}</strong> and <strong>{car.model || 'Model'}</strong>.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-body-tertiary px-4 py-3 border-0 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-sm btn-link text-muted text-decoration-none"
                onClick={handleQuickSaleAtListingPrice}
                disabled={isSubmitting}
              >
                Quick Sale at {formatINR(car.price)}
              </button>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-success px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle"></i>
                      Confirm Sale & Update Revenue
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

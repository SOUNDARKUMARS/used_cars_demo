import React from 'react'
import { FolderCheck, Edit3, Trash2, CheckCircle2, Clock, Car, Sparkles, Image, X } from 'lucide-react'
import { formatINR } from '../data/carStorage'

/**
 * Drafts Folder Modal
 * Displays all unpublished vehicle drafts saved in the database.
 * Allows the admin to continue editing from any draft, publish it, or discard it.
 */
export default function DraftsModal({
  isOpen,
  onClose,
  drafts = [],
  onContinueDraft,
  onPublishDraft,
  onDiscardDraft,
}) {
  if (!isOpen) return null

  const formatTimestamp = (iso) => {
    if (!iso) return 'Recently saved'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently saved'
    }
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1070,
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow-xl border-0 rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-body-tertiary px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="bg-warning-subtle text-warning-emphasis rounded-3 p-2 d-flex align-items-center justify-content-center shadow-2xs"
                style={{ width: '38px', height: '38px' }}
              >
                <FolderCheck className="w-5 h-5 text-warning-emphasis" />
              </div>
              <div>
                <h5 className="modal-title fw-bold fs-6 mb-0 text-body d-flex align-items-center gap-2">
                  <span>Drafts Folder</span>
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-0.5" style={{ fontSize: '11px' }}>
                    {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
                  </span>
                </h5>
                <small className="text-muted" style={{ fontSize: '11.5px' }}>
                  Unpublished listings saved in DB. Resume editing or discard them anytime.
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-muted hover-text-danger"
              onClick={onClose}
              title="Close drafts"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Drafts List */}
          <div className="modal-body p-3 p-md-4 bg-body">
            {drafts.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="rounded-circle bg-body-tertiary text-muted d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  <FolderCheck className="w-8 h-8 text-secondary" />
                </div>
                <h6 className="fw-bold mb-1 text-body">No Saved Drafts in Folder</h6>
                <p className="text-muted small mb-0" style={{ maxWidth: '360px', margin: '0 auto' }}>
                  When creating a car in "Add Vehicle", click <strong>"Save as Draft"</strong> to store your work in progress here in the database.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {drafts.map((draft) => {
                  const coverImg = draft.image || (Array.isArray(draft.gallery) && draft.gallery[0]?.image) || '/mock_cars/honda_city_front.jpg'
                  const keyFeatsCount = Array.isArray(draft.keyFeatures) ? draft.keyFeatures.length : 0
                  const photosCount = Array.isArray(draft.gallery) ? draft.gallery.length : (draft.totalPhotos || 0)
                  const priceText = draft.price ? formatINR(draft.price) : 'Price not set'

                  return (
                    <div
                      key={draft.id}
                      className="card border rounded-3 p-3 transition-all hover-border-primary bg-body shadow-2xs"
                    >
                      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
                        {/* Left: Thumbnail & Details */}
                        <div className="d-flex align-items-center gap-3 overflow-hidden flex-grow-1">
                          {/* Vehicle Photo Thumbnail */}
                          <div
                            className="position-relative rounded-2 overflow-hidden bg-light border flex-shrink-0"
                            style={{ width: '84px', height: '64px' }}
                          >
                            <img
                              src={coverImg}
                              alt={draft.title || draft.make}
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/mock_cars/honda_city_front.jpg'
                              }}
                            />
                            {photosCount > 0 && (
                              <span
                                className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white px-1 py-0.5 rounded-start"
                                style={{ fontSize: '9px' }}
                              >
                                <Image className="w-2.5 h-2.5 d-inline me-0.5" />
                                {photosCount}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="overflow-hidden" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center gap-2 mb-0.5 flex-wrap">
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle py-0.5 px-1.5" style={{ fontSize: '10px' }}>
                                📁 Draft
                              </span>
                              <h6 className="fw-bold mb-0 text-truncate text-body" style={{ fontSize: '14.5px' }}>
                                {draft.title || `${draft.year || 2023} ${draft.make || 'Draft Car'} ${draft.model || ''}`}
                              </h6>
                            </div>

                            <div className="d-flex align-items-center gap-2 text-muted small mb-1 flex-wrap" style={{ fontSize: '12px' }}>
                              <span className="fw-semibold text-primary">{priceText}</span>
                              <span>•</span>
                              <span>{draft.fuel || 'Petrol'}</span>
                              <span>•</span>
                              <span>{draft.transmission || 'Manual'}</span>
                              {keyFeatsCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-secondary d-inline-flex align-items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-warning" />
                                    {keyFeatsCount} features
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '11px' }}>
                              <Clock className="w-3 h-3 text-secondary flex-shrink-0" />
                              <span>Last saved: {formatTimestamp(draft.lastSavedAt || draft.updatedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="d-flex align-items-center gap-2 flex-shrink-0 w-100 w-sm-auto justify-content-end pt-2 pt-sm-0 border-top border-sm-top-0">
                          {/* Discard Draft */}
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to discard draft "${draft.title || draft.make}"? This cannot be undone.`)) {
                                onDiscardDraft(draft.id)
                              }
                            }}
                            title="Permanently discard draft"
                            style={{ fontSize: '12px' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Discard</span>
                          </button>

                          {/* Publish Now */}
                          {onPublishDraft && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                              onClick={() => onPublishDraft(draft)}
                              title="Publish this draft directly to store"
                              style={{ fontSize: '12px' }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </button>
                          )}

                          {/* Continue Editing */}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 shadow-2xs"
                            onClick={() => onContinueDraft(draft)}
                            title="Continue editing this draft"
                            style={{ fontSize: '12px' }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Continue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-body-tertiary px-4 py-2.5 border-top d-flex justify-content-between align-items-center">
            <small className="text-muted" style={{ fontSize: '11px' }}>
              Drafts remain unpublished until you click <strong>"Publish Vehicle to Store"</strong>.
            </small>
            <button
              type="button"
              className="btn btn-secondary btn-sm px-3"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

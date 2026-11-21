import React, { useState, useRef } from 'react'
import RemoteCameraModal from './RemoteCameraModal'
import {
  Car,
  LayoutDashboard,
  Armchair,
  Gauge,
  Camera,
  UploadCloud,
  Trash2,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
} from 'lucide-react'

/**
 * 4 Essential Vehicle Photography Categories
 * Min: 1 image per category
 * Max: 5 images per category
 */
export const PHOTO_CATEGORIES = [
  {
    id: 'exterior',
    title: 'Exterior Views',
    shortTitle: 'Exterior',
    subtitle: 'Front 3/4, Rear angle, Side profiles, Wheels & Grille',
    icon: Car,
    min: 1,
    max: 5,
    recommendedTag: 'Exterior Front (Main)',
  },
  {
    id: 'interior',
    title: 'Interior & Dashboard',
    shortTitle: 'Interior',
    subtitle: 'Dashboard, Steering, Instrument cluster, Infotainment & Console',
    icon: LayoutDashboard,
    min: 1,
    max: 5,
    recommendedTag: 'Cockpit Dashboard',
  },
  {
    id: 'cabin',
    title: 'Seats & Cabin',
    shortTitle: 'Cabin & Seats',
    subtitle: 'Front seats, Rear seating row, Legroom, Upholstery & Sunroof',
    icon: Armchair,
    min: 1,
    max: 5,
    recommendedTag: 'Cabin Seats',
  },
  {
    id: 'mechanical',
    title: 'Engine & Boot Space',
    shortTitle: 'Engine & Boot',
    subtitle: 'Engine bay, Trunk / Luggage boot, Spare tyre & Toolkit',
    icon: Gauge,
    min: 1,
    max: 5,
    recommendedTag: 'Engine Bay',
  },
]

export default function CategorizedPhotoUploader({
  photos = [],
  onPhotosChange,
  onStartCamera,
  isProcessing = false,
  showToast,
  onPreviewPhoto,
}) {
  const [activeCategory, setActiveCategory] = useState('exterior')
  const [isRemoteCameraOpen, setIsRemoteCameraOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Get photos belonging to a specific category
  const getCategoryPhotos = (catId) => {
    return photos.filter((p) => p.category === catId)
  }

  // Active category definition
  const currentCategoryDef =
    PHOTO_CATEGORIES.find((c) => c.id === activeCategory) || PHOTO_CATEGORIES[0]
  const currentCategoryPhotos = getCategoryPhotos(activeCategory)

  // Summary counts
  const categoryCounts = PHOTO_CATEGORIES.map((c) => ({
    ...c,
    count: getCategoryPhotos(c.id).length,
    isComplete: getCategoryPhotos(c.id).length >= c.min,
  }))
  const completedCategoriesCount = categoryCounts.filter((c) => c.isComplete).length
  const allCategoriesComplete = completedCategoriesCount === PHOTO_CATEGORIES.length

  // Find primary cover photo
  const primaryCoverPhoto = photos.find((p) => p.isCover) || photos[0]

  // Handle incoming file selection for active category
  const handleFilesSelected = (fileList) => {
    if (!fileList || fileList.length === 0) return
    const currentCount = currentCategoryPhotos.length
    const remainingSlots = currentCategoryDef.max - currentCount

    if (remainingSlots <= 0) {
      showToast?.(
        `Category "${currentCategoryDef.title}" already has maximum ${currentCategoryDef.max} photos.`,
        'warning'
      )
      return
    }

    const rawFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (rawFiles.length === 0) {
      showToast?.('Please choose valid image files (JPG, PNG, WEBP).', 'warning')
      return
    }

    const filesToProcess = rawFiles.slice(0, remainingSlots)
    if (rawFiles.length > remainingSlots) {
      showToast?.(
        `Maximum 5 photos per category. Uploading the first ${remainingSlots} photo(s).`,
        'info'
      )
    }

    // Process files into Data URLs
    Promise.all(
      filesToProcess.map((file, idx) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              id: `photo-${activeCategory}-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              category: activeCategory,
              dataUrl: e.target.result,
              name: file.name,
              sizeKb: Math.round(file.size / 1024),
              tag: currentCategoryDef.recommendedTag,
              isCover: photos.length === 0 && idx === 0, // Default first photo overall as cover
            })
          }
          reader.readAsDataURL(file)
        })
      })
    ).then((newPhotos) => {
      const updated = [...photos, ...newPhotos]
      // Ensure there is always a cover photo
      if (!updated.some((p) => p.isCover) && updated.length > 0) {
        updated[0].isCover = true
      }
      onPhotosChange(updated)
      showToast?.(
        `Added ${newPhotos.length} photo(s) to "${currentCategoryDef.title}"!`,
        'success'
      )
    })
  }

  // Set a specific photo as primary cover photo
  const handleSetCover = (photoId) => {
    const updated = photos.map((p) => ({
      ...p,
      isCover: p.id === photoId,
    }))
    onPhotosChange(updated)
    showToast?.('Primary cover photo updated for storefront listing!', 'success')
  }

  // Delete a photo
  const handleDeletePhoto = (photoId) => {
    const updated = photos.filter((p) => p.id !== photoId)
    // If deleted photo was cover, assign cover to first available
    if (updated.length > 0 && !updated.some((p) => p.isCover)) {
      updated[0].isCover = true
    }
    onPhotosChange(updated)
  }

  // Rearrange / Reorder photos within a category
  const handleMovePhoto = (photoId, direction) => {
    const catPhotos = [...currentCategoryPhotos]
    const idx = catPhotos.findIndex((p) => p.id === photoId)
    if (idx < 0) return

    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= catPhotos.length) return

    // Swap positions
    const temp = catPhotos[idx]
    catPhotos[idx] = catPhotos[newIdx]
    catPhotos[newIdx] = temp

    // Reconstruct global photos array preserving other categories
    const otherPhotos = photos.filter((p) => p.category !== activeCategory)
    const updated = [...otherPhotos, ...catPhotos]
    onPhotosChange(updated)
  }

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files) {
      handleFilesSelected(e.dataTransfer.files)
    }
  }

  return (
    <div className="categorized-photo-uploader">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files)
          e.target.value = ''
        }}
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="d-none"
      />

      {/* ============================================================
          1. HEADER & OVERALL VALIDATION STATUS BANNER
      ============================================================ */}
      <div className="bg-white border rounded-3 p-3.5 mb-3 shadow-2xs">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
            >
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h6 className="fw-bold mb-0 text-dark">Vehicle Photography & Media</h6>
              <small className="text-muted" style={{ fontSize: '11.5px' }}>
                4 mandatory showroom categories • Min 1, Max 5 photos each
              </small>
            </div>
          </div>

          {/* Validation Pill */}
          <div className="d-flex align-items-center gap-2">
            {allCategoriesComplete ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="fw-semibold">All 4 Categories Complete ({photos.length} photos)</span>
              </span>
            ) : (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill">
                <AlertCircle className="w-3.5 h-3.5 text-warning-emphasis" />
                <span>
                  {completedCategoriesCount} of 4 complete (Min 1 per category required)
                </span>
              </span>
            )}
          </div>
        </div>

        {/* ============================================================
            2. CATEGORY TABS / SWITCHER (HORIZONTAL)
        ============================================================ */}
        <div className="d-flex flex-wrap gap-2 pt-2 border-top">
          {categoryCounts.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 rounded-2 transition-all ${
                  isActive
                    ? 'btn-primary shadow-2xs fw-semibold'
                    : 'btn-outline-secondary border-light-subtle bg-body text-secondary hover-bg-light'
                }`}
                style={{ fontSize: '12.5px', padding: '6px 12px' }}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-secondary'}`} />
                <span>{cat.shortTitle}</span>
                <span
                  className={`badge rounded-pill ms-1 ${
                    isActive
                      ? 'bg-white text-dark'
                      : cat.isComplete
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                  }`}
                  style={{ fontSize: '10.5px' }}
                >
                  {cat.count}/{cat.max}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ============================================================
          3. ACTIVE CATEGORY CARD: ACTIONS & DROPZONE
      ============================================================ */}
      <div className="card border rounded-3 shadow-2xs overflow-hidden mb-3 bg-white">
        {/* Category Description & Status Header */}
        <div className="card-header bg-light bg-opacity-75 px-3.5 py-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-white rounded-2 p-1.5 border d-flex align-items-center justify-content-center shadow-2xs"
              style={{ width: '32px', height: '32px' }}
            >
              <currentCategoryDef.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark fs-6">{currentCategoryDef.title}</span>
                <span
                  className={`badge rounded-pill ${
                    currentCategoryPhotos.length >= currentCategoryDef.min
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {currentCategoryPhotos.length >= currentCategoryDef.min ? (
                    <span className="d-inline-flex align-items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {currentCategoryPhotos.length} / {currentCategoryDef.max} uploaded
                    </span>
                  ) : (
                    <span className="d-inline-flex align-items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      At least 1 photo required (0 / {currentCategoryDef.max})
                    </span>
                  )}
                </span>
              </div>
              <small className="text-muted d-block mt-0.5" style={{ fontSize: '11.5px' }}>
                {currentCategoryDef.subtitle}
              </small>
            </div>
          </div>

          {/* Action Buttons: HORIZONTAL SIDE-BY-SIDE (Clean & Compact) */}
          <div className="d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end flex-wrap">
            {/* Take Photo from Camera Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof onStartCamera === 'function') {
                  onStartCamera(activeCategory)
                } else {
                  setIsRemoteCameraOpen(true)
                }
              }}
              disabled={currentCategoryPhotos.length >= currentCategoryDef.max}
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1.5 shadow-2xs"
              style={{ fontSize: '12px' }}
              title="Capture photo from remote phone camera"
            >
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>Take Photo</span>
            </button>

            {/* Upload from Gallery Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={currentCategoryPhotos.length >= currentCategoryDef.max}
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 shadow-2xs"
              style={{ fontSize: '12px' }}
              title="Upload photos from computer or phone gallery"
            >
              <UploadCloud className="w-3.5 h-3.5 text-white" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>

        <div className="card-body p-3.5">
          {/* ============================================================
              COMPACT DRAG & DROP ZONE (If under 5 photos)
          ============================================================ */}
          {currentCategoryPhotos.length < currentCategoryDef.max ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3 p-3 text-center cursor-pointer transition-all mb-3 ${
                isDragging
                  ? 'border-primary bg-primary-subtle'
                  : 'border-secondary-subtle bg-light hover-bg-light'
              }`}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                <UploadCloud className="w-4 h-4 text-primary" />
                <span className="fw-semibold small text-dark">
                  Drag & drop photos for {currentCategoryDef.shortTitle}
                </span>
                <span className="text-muted small">or click to browse</span>
              </div>
              <small className="text-muted d-block" style={{ fontSize: '11px' }}>
                Can add up to {currentCategoryDef.max - currentCategoryPhotos.length} more photo(s)
                (Min 1, Max 5 per category)
              </small>
            </div>
          ) : (
            <div className="alert alert-info py-2 px-3 rounded-2 small mb-3 d-flex align-items-center justify-content-between">
              <span className="d-inline-flex align-items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-info flex-shrink-0" />
                <span>
                  Maximum 5 photos reached for <strong>{currentCategoryDef.title}</strong>.
                </span>
              </span>
              <span className="badge bg-info-subtle text-info border border-info-subtle">
                5 / 5 Max
              </span>
            </div>
          )}

          {/* ============================================================
              4. UPLOADED PHOTOS GRID (FULLY VISIBLE & REARRANGEABLE)
          ============================================================ */}
          {currentCategoryPhotos.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3 border">
              <div
                className="rounded-circle bg-body-tertiary text-muted d-inline-flex align-items-center justify-content-center mb-2"
                style={{ width: '48px', height: '48px' }}
              >
                <currentCategoryDef.icon className="w-6 h-6 text-secondary" />
              </div>
              <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: '13.5px' }}>
                No {currentCategoryDef.shortTitle} photos uploaded yet
              </h6>
              <p className="text-muted small mb-2" style={{ maxWidth: '340px', margin: '0 auto', fontSize: '11.5px' }}>
                Please add at least 1 photo for {currentCategoryDef.shortTitle}. Recommended: {currentCategoryDef.subtitle}
              </p>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '11.5px' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {currentCategoryPhotos.map((photo, index) => {
                const isFirst = index === 0
                const isLast = index === currentCategoryPhotos.length - 1

                return (
                  <div key={photo.id} className="col-12 col-sm-6 col-md-4 col-xxl-3">
                    <div
                      className={`card h-100 border rounded-3 overflow-hidden shadow-2xs transition-all ${
                        photo.isCover ? 'border-primary ring-2 ring-primary' : 'hover-border-primary'
                      }`}
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      {/* Fully Visible Photo Container with 16:10 Aspect Ratio */}
                      <div
                        className="position-relative bg-dark overflow-hidden cursor-pointer"
                        style={{
                          aspectRatio: '16 / 10',
                          minHeight: '130px',
                          cursor: 'pointer',
                        }}
                        onClick={() => onPreviewPhoto?.(photo.dataUrl)}
                        title="Click to view full photo"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name || 'Vehicle Photo'}
                          className="w-100 h-100"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                          }}
                        />

                        {/* Top Badges */}
                        <div className="position-absolute top-0 start-0 m-1.5 d-flex gap-1">
                          {photo.isCover ? (
                            <span
                              className="badge bg-primary text-white d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{ fontSize: '10px' }}
                            >
                              <Star className="w-2.5 h-2.5 fill-white" />
                              Primary Cover
                            </span>
                          ) : (
                            <span
                              className="badge bg-dark bg-opacity-75 text-white"
                              style={{ fontSize: '10px' }}
                            >
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Top Right Quick Actions */}
                        <div className="position-absolute top-0 end-0 m-1.5 d-flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onPreviewPhoto?.(photo.dataUrl)
                            }}
                            className="btn btn-dark btn-sm p-1 rounded-circle bg-opacity-75 d-flex align-items-center justify-content-center"
                            style={{ width: '24px', height: '24px' }}
                            title="Inspect full-size image"
                          >
                            <Eye className="w-3 h-3 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePhoto(photo.id)
                            }}
                            className="btn btn-danger btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                            style={{ width: '24px', height: '24px' }}
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Photo Bottom Bar: Rearrange Controls & Set Cover Button */}
                      <div className="p-2 border-top bg-light d-flex align-items-center justify-content-between gap-1">
                        {/* Rearrange Reorder Controls (< and >) */}
                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMovePhoto(photo.id, -1)}
                            className="btn btn-outline-secondary btn-sm p-1 d-flex align-items-center justify-content-center"
                            style={{ width: '24px', height: '24px' }}
                            title="Move earlier (rearrange order)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className="text-muted font-monospace"
                            style={{ fontSize: '10.5px' }}
                          >
                            {index + 1} of {currentCategoryPhotos.length}
                          </span>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMovePhoto(photo.id, 1)}
                            className="btn btn-outline-secondary btn-sm p-1 d-flex align-items-center justify-content-center"
                            style={{ width: '24px', height: '24px' }}
                            title="Move later (rearrange order)"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Set as Cover Button (HORIZONTAL, COMPACT, NOT full width!) */}
                        {!photo.isCover ? (
                          <button
                            type="button"
                            onClick={() => handleSetCover(photo.id)}
                            className="btn btn-outline-primary btn-sm py-0.5 px-2 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '11px', height: '24px' }}
                            title="Set as main cover photo for customer storefront"
                          >
                            <Star className="w-3 h-3 text-primary" />
                            <span>Set Cover</span>
                          </button>
                        ) : (
                          <span
                            className="text-primary fw-semibold d-inline-flex align-items-center gap-1 small"
                            style={{ fontSize: '11px' }}
                          >
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            <span>Cover Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          5. PRIMARY STOREFRONT HERO PREVIEW CARD
      ============================================================ */}
      {primaryCoverPhoto && (
        <div className="card border rounded-3 p-3 bg-white shadow-2xs mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-dark d-flex align-items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              <span>Primary Listing Cover (Customer Storefront Hero)</span>
            </span>
            <span className="badge bg-primary-subtle text-primary" style={{ fontSize: '10px' }}>
              Shows on Search Cards
            </span>
          </div>
          <div
            className="position-relative rounded-2 overflow-hidden border bg-dark cursor-pointer"
            style={{
              aspectRatio: '16 / 9',
              maxHeight: '220px',
              cursor: 'pointer',
            }}
            onClick={() => onPreviewPhoto?.(primaryCoverPhoto.dataUrl)}
          >
            <img
              src={primaryCoverPhoto.dataUrl}
              alt="Primary Cover Photo"
              className="w-100 h-100"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="position-absolute bottom-0 start-0 end-0 p-2 bg-dark bg-opacity-75 text-white d-flex justify-content-between align-items-center">
              <span className="small" style={{ fontSize: '11.5px' }}>
                Category: <strong>{primaryCoverPhoto.category ? primaryCoverPhoto.category.toUpperCase() : 'EXTERIOR'}</strong>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreviewPhoto?.(primaryCoverPhoto.dataUrl)
                }}
                className="btn btn-sm btn-link text-white p-0 text-decoration-none d-inline-flex align-items-center gap-1"
                style={{ fontSize: '11px' }}
              >
                <Eye className="w-3 h-3" />
                <span>View Full Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemoteCameraOpen && (
        <RemoteCameraModal
          isOpen={isRemoteCameraOpen}
          onClose={() => setIsRemoteCameraOpen(false)}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categories={PHOTO_CATEGORIES}
          photos={photos}
          onCapturePhoto={(file) => handleFilesSelected([file])}
        />
      )}
    </div>
  )
}

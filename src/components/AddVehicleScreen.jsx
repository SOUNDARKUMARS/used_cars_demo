import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  addCar,
  formatINR,
  formatTenureLabel,
  emiPayloadFromForm,
  saveDraftCar,
  getStoredDrafts,
  publishDraftCar,
  discardDraftCar,
  getStoredReminders,
  isCarDraft,
} from '../data/carStorage'
import {
  addCarToSupabase,
  saveDraftToSupabase,
  publishDraftInSupabase,
  discardDraftFromSupabase,
  fetchDraftsFromSupabase,
  fetchRemindersFromSupabase,
  sendMatchingCarEmails,
  updateCarInSupabase,
  fetchAiThumbnailQuota,
  consumeAiThumbnailQuota,
} from '../lib/supabase'
import { generateStudioThumbnail } from '../lib/studioThumbnail'
import BrandSelector from './BrandSelector'
import CustomSelect from './CustomSelect'
import { getBrandByName } from '../data/brandsData'
import FeaturesSelector from './FeaturesSelector'
import { getFeatureById } from '../data/featuresBank'
import DraftsModal from './DraftsModal'
import MatchRemindersModal from './MatchRemindersModal'
import CategorizedPhotoUploader, { PHOTO_CATEGORIES } from './CategorizedPhotoUploader'
import {
  FolderCheck,
  BookmarkCheck,
  CheckCircle2,
  Camera,
  AlertCircle,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldCheck,
  Calculator,
  Gauge,
  Car,
  Edit3,
} from 'lucide-react'

// Manufacturing years from 2026 down to 2000
const YEARS_UNTIL_2000 = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => String(2026 - i))

// Stepper steps configuration
const STEPS = [
  { id: 1, key: 'identity', title: 'Identity', subtitle: 'Make, model & year', icon: Car },
  { id: 2, key: 'specs', title: 'Specifications', subtitle: 'Powertrain & mileage', icon: Gauge },
  { id: 3, key: 'pricing', title: 'Pricing & Features', subtitle: 'Price & equipment', icon: Sparkles },
  { id: 4, key: 'photos', title: 'Photo Studio', subtitle: 'Categorized gallery', icon: Camera },
  { id: 5, key: 'preview', title: 'Review & Publish', subtitle: 'Buyer card & submit', icon: Eye },
]

// Standard exterior color swatches
const COLOR_OPTIONS = [
  { name: 'Pearl White', hex: '#FFFFFF', border: '#cbd5e1' },
  { name: 'Carbon Black', hex: '#1E293B', border: '#1E293B' },
  { name: 'Metallic Silver', hex: '#CBD5E1', border: '#94a3b8' },
  { name: 'Mineral Grey', hex: '#64748B', border: '#475569' },
  { name: 'Fiery Red', hex: '#DC2626', border: '#DC2626' },
  { name: 'Royal Blue', hex: '#2563EB', border: '#2563EB' },
  { name: 'Forest Green', hex: '#15803D', border: '#15803D' },
  { name: 'Sunset Orange', hex: '#EA580C', border: '#EA580C' },
  { name: 'Golden Bronze', hex: '#B45309', border: '#B45309' },
]

// Standard RTO options (Tamil Nadu & Regional staples)
const RTO_OPTIONS = [
  { value: '', label: 'Select RTO code...' },
  { value: 'TN-39 (Tiruppur)', label: 'TN-39 • Tiruppur' },
  { value: 'TN-38 (Coimbatore South)', label: 'TN-38 • Coimbatore South' },
  { value: 'TN-66 (Coimbatore North)', label: 'TN-66 • Coimbatore North' },
  { value: 'TN-37 (Coimbatore West)', label: 'TN-37 • Coimbatore West' },
  { value: 'TN-33 (Erode)', label: 'TN-33 • Erode' },
  { value: 'TN-40 (Mettupalayam)', label: 'TN-40 • Mettupalayam' },
  { value: 'TN-43 (Nilgiris / Ooty)', label: 'TN-43 • Nilgiris (Ooty)' },
  { value: 'TN-27 (Salem)', label: 'TN-27 • Salem' },
  { value: 'TN-01 (Chennai Central)', label: 'TN-01 • Chennai Central' },
  { value: 'TN-07 (Chennai South)', label: 'TN-07 • Chennai South' },
  { value: 'TN-45 (Tiruchirappalli)', label: 'TN-45 • Tiruchirappalli' },
  { value: 'TN-58 (Madurai)', label: 'TN-58 • Madurai' },
  { value: 'KA-01 (Bengaluru Central)', label: 'KA-01 • Bengaluru Central' },
  { value: 'KA-03 (Bengaluru East)', label: 'KA-03 • Bengaluru East' },
  { value: 'KL-07 (Kochi / Ernakulam)', label: 'KL-07 • Kochi / Ernakulam' },
  { value: '__custom__', label: '+ Other RTO Code...' },
]

// Ownership history options
const OWNERSHIP_OPTIONS = [
  { value: '', label: 'Select ownership history...' },
  { value: '1st Owner', label: '1st Owner (Single Owner)' },
  { value: '2nd Owner', label: '2nd Owner' },
  { value: '3rd Owner', label: '3rd Owner' },
  { value: '4th+ Owner', label: '4th+ Owner' },
]

// Clean Slate Form Data: starts unselected on Year and Ownership to prevent wrong default listings
export const getCleanSlateFormData = () => ({
  make: '',
  customMake: '',
  model: '',
  year: '',
  variant: '',
  title: '',
  color: '',
  bodyType: '',
  fuel: '',
  transmission: '',
  kmNumeric: '',
  price: '',
  location: 'Tiruppur, Tamil Nadu',
  rto: '',
  ownership: '',
  insurance: 'Valid Comprehensive',
  listingStatus: 'Available',
  inspected: true,
  inspectionGrade: 'A+',
  aboutSummary: '',
  aboutFull: '',
  selectedFeatures: [],
  emiAvailable: true,
  emiDownPayment: '',
  emiInterestRate: '9.5',
  emiTenureMonths: '60',
  emiNote: '',
})

// Maps a stored vehicle onto the add-vehicle form, including custom brand/model/color/RTO fields
export const getEditorFlags = (vehicle) => {
  if (!vehicle) {
    return {
      form: getCleanSlateFormData(),
      isCustomModel: false,
      isCustomColor: false,
      isCustomRto: false,
    }
  }

  const brand = getBrandByName(vehicle.make)
  const form = getDraftOrCleanFormData(vehicle)
  if (!brand && vehicle.make) {
    form.make = 'Other'
    form.customMake = vehicle.customMake || vehicle.make
  }

  const models = brand?.popularModels || []
  return {
    form,
    isCustomModel: Boolean(form.model) && (models.length === 0 || !models.includes(form.model)),
    isCustomColor: Boolean(form.color) && !COLOR_OPTIONS.some((color) => color.name === form.color),
    isCustomRto: Boolean(form.rto) && !RTO_OPTIONS.some((option) => option.value && option.value === form.rto),
  }
}

// Helper to convert draft into formData or return clean slate
export const getDraftOrCleanFormData = (draft) => {
  if (!draft) return getCleanSlateFormData()
  return {
    make: draft.make || '',
    customMake: draft.customMake || '',
    model: draft.model || '',
    year: draft.year ? String(draft.year) : '',
    variant: draft.variant || '',
    title: draft.title || '',
    color: draft.color || '',
    bodyType: draft.bodyType || '',
    fuel: draft.fuel || '',
    transmission: draft.transmission || '',
    kmNumeric: draft.kmNumeric !== undefined && draft.kmNumeric !== null && draft.kmNumeric !== '' ? draft.kmNumeric : '',
    price: draft.price !== undefined && draft.price !== null && draft.price !== '' ? draft.price : '',
    location: draft.location || 'Tiruppur, Tamil Nadu',
    rto: draft.rto || '',
    ownership: draft.ownership || '',
    insurance: draft.insurance || 'Valid Comprehensive',
    listingStatus: (draft.listingStatus && draft.listingStatus !== 'Draft') ? draft.listingStatus : 'Available',
    inspected: draft.inspected !== undefined ? draft.inspected : true,
    inspectionGrade: draft.inspectionGrade || 'A+',
    aboutSummary: draft.aboutSummary || '',
    aboutFull: draft.aboutFull || '',
    selectedFeatures: Array.isArray(draft.keyFeatures) ? draft.keyFeatures : [],
    emiAvailable: draft.emiAvailable !== false,
    emiDownPayment: draft.emiDownPayment === null || draft.emiDownPayment === undefined ? '' : draft.emiDownPayment,
    emiInterestRate: draft.emiInterestRate === null || draft.emiInterestRate === undefined ? '' : draft.emiInterestRate,
    emiTenureMonths: draft.emiTenureMonths ? String(draft.emiTenureMonths) : '',
    emiNote: draft.emiNote || '',
  }
}

const EMI_TENURE_CHOICES = [
  { value: '12', label: '12 months (1 year)' },
  { value: '24', label: '24 months (2 years)' },
  { value: '36', label: '36 months (3 years)' },
  { value: '48', label: '48 months (4 years)' },
  { value: '60', label: '60 months (5 years)' },
  { value: '72', label: '72 months (6 years)' },
  { value: '84', label: '84 months (7 years)' },
]

function emiFieldsForDraft(formData, baseline) {
  const result = emiPayloadFromForm(formData, baseline)
  if (result.ok) return result.value
  const blank = (value) => value === '' || value === null || value === undefined
  return {
    emiAvailable: Boolean(formData.emiAvailable),
    emiDownPayment: blank(formData.emiDownPayment) ? null : Number(formData.emiDownPayment),
    emiInterestRate: blank(formData.emiInterestRate) ? null : Number(formData.emiInterestRate),
    emiTenureMonths: blank(formData.emiTenureMonths) ? null : Number(formData.emiTenureMonths),
    emiNote: (formData.emiNote || '').trim(),
    emi: formData.emiAvailable ? (baseline?.emi || 'EMI terms not set') : 'EMI not available',
    emiNumeric: formData.emiAvailable ? (Number(baseline?.emiNumeric) || 0) : 0,
  }
}

// Helper to format gallery images from draft
export const formatGalleryToPhotos = (gallery) => {
  if (!Array.isArray(gallery) || gallery.length === 0) return []
  return gallery.map((g, idx) => {
    let cat = g.category
    if (!cat) {
      const l = (g.label || '').toLowerCase()
      if (l.includes('interior') || l.includes('cockpit') || l.includes('dashboard') || l.includes('steering')) cat = 'interior'
      else if (l.includes('seat') || l.includes('cabin')) cat = 'cabin'
      else if (l.includes('engine') || l.includes('boot') || l.includes('wheel')) cat = 'mechanical'
      else cat = 'exterior'
    }
    return {
      id: g.id || `photo-draft-${idx}-${Date.now()}`,
      category: cat,
      dataUrl: g.image || g.thumb || '',
      name: g.label || `Photo ${idx + 1}`,
      tag: g.label || `Photo ${idx + 1}`,
      isCover: Boolean(g.isCover || idx === 0),
    }
  })
}

export default function AddVehicleScreen({ onCancel, onSuccess, showToast, initialDraft = null, existingVehicle = null }) {
  const sourceVehicle = existingVehicle || initialDraft
  const editingPublishedListing = Boolean(existingVehicle?.id) && !isCarDraft(existingVehicle)
  const initialFlags = getEditorFlags(sourceVehicle)

  // Current active step in the stepper (1 through 5)
  const [currentStep, setCurrentStep] = useState(1)

  // Current draft identifier if editing an existing draft.
  // A published listing must not be stored as a draft id, or auto-save would unpublish it.
  const [currentDraftId, setCurrentDraftId] = useState(editingPublishedListing ? null : (initialDraft?.id || null))
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftsModalOpen, setDraftsModalOpen] = useState(false)
  const [draftsList, setDraftsList] = useState(getStoredDrafts)

  // 10s Automatic Background Draft Saving State & References
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const lastSavedSignatureRef = useRef('')

  // Buyer Reminders Matching Pop-up State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
  const [pendingCarPayload, setPendingCarPayload] = useState(null)
  const [availableReminders, setAvailableReminders] = useState([])

  // Form State initialized to clean slate, a draft, or the published vehicle being edited
  const [formData, setFormData] = useState(initialFlags.form)
  const [emiBaseline, setEmiBaseline] = useState(sourceVehicle)
  const emiBaselineRef = useRef(sourceVehicle)

  // UI state for custom overrides
  const [isCustomModel, setIsCustomModel] = useState(initialFlags.isCustomModel)
  const [isCustomColor, setIsCustomColor] = useState(initialFlags.isCustomColor)
  const [isCustomRto, setIsCustomRto] = useState(initialFlags.isCustomRto)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Uploaded Photos list
  const [photos, setPhotos] = useState(() => formatGalleryToPhotos(sourceVehicle?.gallery))
  const [thumbQuota, setThumbQuota] = useState({ used: 0, limit: 200 })
  const [thumbQuotaError, setThumbQuotaError] = useState('')
  const [generatingThumb, setGeneratingThumb] = useState(false)
  const [isProcessingPhotos] = useState(false)
  const [activePreviewPhoto, setActivePreviewPhoto] = useState(null)

  // Automatically compute listing title if user hasn't overridden it manually
  const [titleTouched, setTitleTouched] = useState(() => Boolean(sourceVehicle?.title))
  const effectiveMake = formData.make === 'Other' ? (formData.customMake || 'Custom') : formData.make

  // Popular models list for currently selected brand
  const brandInfo = useMemo(() => getBrandByName(formData.make), [formData.make])
  const popularModels = brandInfo?.popularModels || []

  // Form submission state & errors
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Stable references for recurring 10s auto-save timer
  const formDataRef = useRef(formData)
  formDataRef.current = formData
  emiBaselineRef.current = emiBaseline

  const photosRef = useRef(photos)
  photosRef.current = photos

  const currentDraftIdRef = useRef(currentDraftId)
  currentDraftIdRef.current = currentDraftId

  const isSubmittingRef = useRef(isSubmitting)
  isSubmittingRef.current = isSubmitting

  const isPublishedRef = useRef(false)
  const editingPublishedRef = useRef(editingPublishedListing)
  editingPublishedRef.current = editingPublishedListing

  // Synchronize when the draft or the published vehicle being edited changes
  useEffect(() => {
    const source = existingVehicle || initialDraft
    if (source) {
      const flags = getEditorFlags(source)
      const editingPublished = Boolean(existingVehicle?.id) && !isCarDraft(existingVehicle)
      setCurrentDraftId(editingPublished ? null : (source.id || null))
      setFormData(flags.form)
      setEmiBaseline(source)
      setPhotos(formatGalleryToPhotos(source.gallery))
      setTitleTouched(Boolean(source.title))
      setIsCustomModel(flags.isCustomModel)
      setIsCustomColor(flags.isCustomColor)
      setIsCustomRto(flags.isCustomRto)
      setCurrentStep(1)
    } else {
      setCurrentDraftId(null)
      setFormData(getCleanSlateFormData())
      setEmiBaseline(null)
      setPhotos([])
      setTitleTouched(false)
      setIsCustomModel(false)
      setIsCustomColor(false)
      setIsCustomRto(false)
      setCurrentStep(1)
    }
  }, [initialDraft, existingVehicle])

  // Synchronize drafts from Supabase database on mount
  useEffect(() => {
    let isMounted = true
    async function syncCloudDrafts() {
      try {
        const cloudDrafts = await fetchDraftsFromSupabase()
        if (isMounted && Array.isArray(cloudDrafts)) {
          const current = getStoredDrafts()
          const draftMap = new Map()
          cloudDrafts.forEach((d) => draftMap.set(d.id, d))
          current.forEach((d) => {
            if (!draftMap.has(d.id)) draftMap.set(d.id, d)
          })
          const merged = Array.from(draftMap.values())
          merged.forEach((d) => saveDraftCar(d))
          setDraftsList(merged)
        }
      } catch (err) {
        console.warn('Could not sync drafts from Supabase:', err.message)
      }
    }
    syncCloudDrafts()
    return () => {
      isMounted = false
    }
  }, [])

  // Automatically compute listing title if user hasn't overridden it manually
  useEffect(() => {
    if (!titleTouched) {
      if (!formData.model && !effectiveMake) {
        setFormData((prev) => (prev.title ? { ...prev, title: '' } : prev))
        return
      }
      const parts = [formData.year, effectiveMake, formData.model, formData.variant].filter(Boolean)
      setFormData((prev) => ({
        ...prev,
        title: parts.join(' ')
      }))
    }
  }, [formData.year, effectiveMake, formData.model, formData.variant, titleTouched])

  const emiPreview = useMemo(() => {
    return emiPayloadFromForm(formData, emiBaseline)
  }, [
    formData,
    emiBaseline,
  ])

  // Cover photo (primary cover photo uploaded by user)
  const primaryCoverPhoto = photos.find((p) => p.isCover) || photos[0]

  useEffect(() => {
    let active = true
    fetchAiThumbnailQuota()
      .then((quota) => {
        if (active) setThumbQuota(quota)
      })
      .catch((err) => {
        if (active) setThumbQuotaError(err.message || 'Thumbnail allowance is unavailable.')
      })
    return () => {
      active = false
    }
  }, [])

  const generateThumbnail = async () => {
    const exterior = photos.filter((photo) => photo.category === 'exterior' && photo.dataUrl).slice(0, 3)
    if (!exterior.length) {
      showToast?.('Upload an exterior photo first.', 'warning')
      return
    }
    if (thumbQuota.used >= thumbQuota.limit) {
      showToast?.('The monthly limit of 200 thumbnails has been used.', 'warning')
      return
    }

    setGeneratingThumb(true)
    try {
      const dataUrl = await generateStudioThumbnail(exterior.map((photo) => photo.dataUrl))
      const coverIndex = Math.max(
        0,
        photos.findIndex((photo) => photo.isCover)
      )
      const nextPhotos = photos.map((photo, index) => ({
        ...photo,
        isCover: index === coverIndex,
        ...(index === coverIndex
          ? { dataUrl, tag: 'Studio thumbnail', name: 'Studio thumbnail' }
          : {}),
      }))
      setPhotos(nextPhotos)

      const gallery = nextPhotos.map((photo, index) => ({
        id: index + 1,
        label: photo.tag || `Photo ${index + 1}`,
        category: photo.category || 'exterior',
        image: photo.dataUrl,
        thumb: photo.dataUrl,
        isCover: Boolean(photo.isCover),
      }))

      if (sourceVehicle?.id) {
        await updateCarInSupabase(sourceVehicle.id, {
          image: dataUrl,
          cutoutImage: dataUrl,
          detailHeroImage: dataUrl,
          gallery,
        })
      }

      const quota = await consumeAiThumbnailQuota()
      setThumbQuota(quota)
      setThumbQuotaError('')
      showToast?.('Studio thumbnail is set as the listing image.')
    } catch (err) {
      showToast?.(err?.message || 'The thumbnail could not be generated.', 'warning')
    } finally {
      setGeneratingThumb(false)
    }
  }

  // Photo categories status & readiness
  const categoryStats = useMemo(() => {
    return PHOTO_CATEGORIES.map((cat) => {
      const catPhotos = photos.filter((p) => p.category === cat.id)
      return {
        ...cat,
        count: catPhotos.length,
        isSatisfied: catPhotos.length >= cat.min,
      }
    })
  }, [photos])

  const completedCategoriesCount = useMemo(() => {
    return categoryStats.filter((c) => c.isSatisfied).length
  }, [categoryStats])

  // Listing readiness percentage: strictly measures completed required fields & assets
  const readinessScore = useMemo(() => {
    let score = 0
    // Vehicle identity (25%)
    if (formData.make && formData.model && formData.year && formData.ownership) score += 25
    // Technical Specs & Pricing (25%)
    if (formData.price && Number(formData.price) > 0 && formData.kmNumeric !== '' && Number(formData.kmNumeric) >= 0) score += 25
    // Photography across 4 categories (30%)
    if (completedCategoriesCount === 4) score += 30
    else score += Math.round((completedCategoriesCount / 4) * 30)
    // Equipment features highlights (20%)
    if (formData.selectedFeatures && formData.selectedFeatures.length > 0) {
      score += Math.min(20, Math.round((formData.selectedFeatures.length / 4) * 20))
    }
    return Math.min(100, Math.max(0, score))
  }, [formData.make, formData.model, formData.year, formData.ownership, formData.price, formData.kmNumeric, completedCategoriesCount, formData.selectedFeatures])

  // Validate fields for a given step
  const validateStep = (step) => {
    const errors = {}
    if (step === 1) {
      if (!formData.make || !formData.make.trim()) {
        errors.make = 'Please select a car make / brand'
      } else if (formData.make === 'Other' && !formData.customMake.trim()) {
        errors.customMake = 'Please specify custom brand name'
      }
      if (!formData.model || !formData.model.trim()) {
        errors.model = 'Please select or enter a model name'
      }
      if (!formData.year) {
        errors.year = 'Please select manufacturing year'
      }
      if (!formData.ownership) {
        errors.ownership = 'Please select ownership history'
      }
    } else if (step === 2) {
      if (formData.kmNumeric === '' || Number(formData.kmNumeric) < 0) {
        errors.kmNumeric = 'Please enter valid kilometers driven'
      }
    } else if (step === 3) {
      if (!formData.price || Number(formData.price) <= 0) {
        errors.price = 'Please enter a valid price in INR'
      }
      const emiResult = emiPayloadFromForm(formData, emiBaseline)
      if (!emiResult.ok) Object.assign(errors, emiResult.errors)
    }
    return errors
  }

  // Stepper navigation handlers
  const handleNextStep = () => {
    const errors = validateStep(currentStep)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToast?.('Please complete required fields to continue', 'warning')
      return
    }
    setFormErrors({})
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevStep = () => {
    setFormErrors({})
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return
    if (targetStep > currentStep) {
      const errors = validateStep(currentStep)
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        showToast?.('Please complete required fields before advancing', 'warning')
        return
      }
    }
    setFormErrors({})
    setCurrentStep(targetStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Save current progress as a draft (supports manual and background auto-save every 10s)
  const handleSaveDraft = async (isAuto = false) => {
    // Published listings are saved only when the admin submits. Draft auto-save would unpublish them.
    if (editingPublishedRef.current) return
    // If currently publishing or already published, NEVER auto-save!
    if (isSubmittingRef.current || isPublishedRef.current) return

    const curFormData = formDataRef.current
    const curPhotos = photosRef.current
    const curDraftId = currentDraftIdRef.current

    // Don't auto-save if completely empty (no make, no model, no photos)
    const hasAnyContent =
      (curFormData.make && curFormData.make !== 'Other') ||
      curFormData.model.trim() ||
      curFormData.price ||
      curPhotos.length > 0 ||
      curFormData.customMake.trim()

    if (isAuto && !hasAnyContent) {
      return
    }

    // Generate a quick signature to check if anything actually changed since last save
    const currentSignature = JSON.stringify({
      make: curFormData.make,
      customMake: curFormData.customMake,
      model: curFormData.model,
      year: curFormData.year,
      price: curFormData.price,
      kmNumeric: curFormData.kmNumeric,
      photosCount: curPhotos.length,
      coverPhoto: curPhotos.find((p) => p.isCover)?.dataUrl?.substring(0, 50),
      fuel: curFormData.fuel,
      transmission: curFormData.transmission,
      bodyType: curFormData.bodyType,
      selectedFeatures: curFormData.selectedFeatures,
      emiAvailable: curFormData.emiAvailable,
      emiDownPayment: curFormData.emiDownPayment,
      emiInterestRate: curFormData.emiInterestRate,
      emiTenureMonths: curFormData.emiTenureMonths,
      emiNote: curFormData.emiNote,
    })

    if (isAuto && currentSignature === lastSavedSignatureRef.current) {
      // Nothing changed in the last 10 seconds, skip redundant save
      return
    }

    if (isAuto) {
      setIsAutoSaving(true)
    } else {
      setIsSavingDraft(true)
    }

    try {
      const effectiveBrand =
        curFormData.make === 'Other' && curFormData.customMake.trim()
          ? curFormData.customMake.trim()
          : curFormData.make || 'Draft Make'

      const coverPhoto =
        curPhotos.find((p) => p.isCover && p.category === 'exterior') ||
        curPhotos.find((p) => p.isCover) ||
        curPhotos.find((p) => p.tag?.toLowerCase().includes('studio')) ||
        curPhotos.find((p) => p.category === 'exterior') ||
        curPhotos[0]
      const mainImageUrl = coverPhoto ? coverPhoto.dataUrl : ''

      const formattedGallery = curPhotos.map((p, idx) => ({
        id: idx + 1,
        label: p.tag || `Photo ${idx + 1}`,
        category: p.category || 'exterior',
        image: p.dataUrl,
        thumb: p.dataUrl,
        isCover: Boolean(p.isCover),
      }))

      const draftId = curDraftId || `draft-${Date.now()}`

      const draftPayload = {
        id: draftId,
        make: effectiveBrand,
        customMake: curFormData.customMake,
        model: curFormData.model.trim() || 'Untitled Model',
        year: Number(curFormData.year) || 2024,
        variant: curFormData.variant.trim() || '',
        title:
          curFormData.title.trim() ||
          `${curFormData.year || ''} ${effectiveBrand} ${curFormData.model.trim() || 'Draft'}`.trim(),
        price: Number(curFormData.price) || 0,
        priceFormatted: formatINR(Number(curFormData.price) || 0),
        km: `${(Number(curFormData.kmNumeric) || 0).toLocaleString('en-IN')} km`,
        kmNumeric: curFormData.kmNumeric !== '' ? Number(curFormData.kmNumeric) : 0,
        bodyType: curFormData.bodyType || '',
        fuel: curFormData.fuel || '',
        transmission: curFormData.transmission || '',
        ownership: curFormData.ownership || '1st Owner',
        color: curFormData.color || '',
        location: curFormData.location || 'Tiruppur, Tamil Nadu',
        rto: curFormData.rto || '',
        insurance: curFormData.insurance || 'Valid Comprehensive',
        listingStatus: 'Draft',
        inspected: curFormData.inspected,
        inspectionGrade: curFormData.inspectionGrade || 'A+',
        image: mainImageUrl,
        cutoutImage: mainImageUrl,
        detailHeroImage: mainImageUrl,
        gallery: formattedGallery,
        totalPhotos: formattedGallery.length,
        aboutSummary: curFormData.aboutSummary || '',
        aboutFull: curFormData.aboutFull || '',
        keyFeatures: curFormData.selectedFeatures,
        ...emiFieldsForDraft(curFormData, emiBaselineRef.current),
        updatedAt: new Date().toISOString(),
        isDraft: true,
      }

      saveDraftCar(draftPayload)
      if (!curDraftId) {
        setCurrentDraftId(draftId)
      }
      setDraftsList(getStoredDrafts())
      lastSavedSignatureRef.current = currentSignature
      setLastAutoSavedAt(new Date())

      await saveDraftToSupabase(draftPayload).catch((err) => {
        console.warn('Supabase draft sync notice:', err.message)
      })

      if (!isAuto) {
        showToast?.(`Draft "${draftPayload.title}" saved successfully!`, 'info')
      }
    } catch (err) {
      console.error('Failed to save draft:', err)
      if (!isAuto) {
        showToast?.('Could not save draft. Changes kept in active form.', 'warning')
      }
    } finally {
      if (isAuto) {
        setIsAutoSaving(false)
      } else {
        setIsSavingDraft(false)
      }
    }
  }

  // Automatic recurring background draft save: runs every 10 seconds (10,000ms)
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      handleSaveDraft(true)
    }, 10000)

    return () => clearInterval(autoSaveTimer)
  }, [])

  // Auto-save when tab/window is closed or navigated away
  useEffect(() => {
    const handleBeforeUnload = () => {
      handleSaveDraft(true)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Discard draft
  const handleDiscardDraft = async (draftId) => {
    discardDraftCar(draftId)
    setDraftsList(getStoredDrafts())
    if (currentDraftId === draftId) {
      setCurrentDraftId(null)
      setFormData(getCleanSlateFormData())
      setEmiBaseline(null)
      setPhotos([])
      setTitleTouched(false)
      setCurrentStep(1)
    }
    try {
      await discardDraftFromSupabase(draftId)
    } catch (err) {
      console.warn('Supabase discard draft notice:', err.message)
    }
    showToast?.('Draft removed successfully', 'info')
  }

  // Load draft from modal
  const handleLoadDraft = (draft) => {
    setCurrentDraftId(draft.id)
    setEmiBaseline(draft)
    setFormData(getDraftOrCleanFormData(draft))
    setPhotos(formatGalleryToPhotos(draft.gallery))
    setTitleTouched(Boolean(draft.title))
    setDraftsModalOpen(false)
    setCurrentStep(1)
    showToast?.(`Resumed draft "${draft.title || draft.make}"`, 'info')
  }

  // Publish draft from modal
  const handlePublishFromDraft = async (draft) => {
    const published = publishDraftCar(draft.id, {
      ...draft,
      listingStatus: 'Available',
      isDraft: false,
    })
    setDraftsList(getStoredDrafts())
    setDraftsModalOpen(false)

    try {
      await publishDraftInSupabase(draft.id, {
        ...draft,
        listingStatus: 'Available',
        isDraft: false,
      })
    } catch (err) {
      console.warn('Supabase publish draft notice:', err.message)
    }

    if (onSuccess) {
      onSuccess(published)
    } else {
      showToast?.(`Draft "${published.title}" published live to storefront!`, 'success')
      if (onCancel) onCancel()
    }
  }

  // Handle final publishing submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const errors = {}

    if (!formData.make || !formData.make.trim()) {
      errors.make = 'Please select a car make / brand'
    } else if (formData.make === 'Other' && !formData.customMake.trim()) {
      errors.customMake = 'Please specify custom brand name'
    }
    if (!formData.model.trim()) {
      errors.model = 'Model name is required'
    }
    if (!formData.year) {
      errors.year = 'Please select manufacturing year'
    }
    if (!formData.ownership) {
      errors.ownership = 'Please select ownership history'
    }
    if (formData.kmNumeric === '' || Number(formData.kmNumeric) < 0) {
      errors.kmNumeric = 'Please enter valid kilometers driven'
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Please enter a valid price in INR'
    }

    // Direct user to step containing errors
    if (errors.make || errors.customMake || errors.model || errors.year || errors.ownership) {
      setFormErrors(errors)
      setCurrentStep(1)
      showToast?.('Please complete required vehicle details in Step 1', 'warning')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (errors.kmNumeric) {
      setFormErrors(errors)
      setCurrentStep(2)
      showToast?.('Please enter valid mileage in Step 2', 'warning')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const emiResult = emiPayloadFromForm(formData, emiBaseline)
    if (!emiResult.ok) {
      Object.assign(errors, emiResult.errors)
    }
    if (errors.price || errors.emiDownPayment || errors.emiInterestRate || errors.emiTenureMonths) {
      setFormErrors(errors)
      setCurrentStep(3)
      showToast?.('Please complete the price and EMI terms in Step 3', 'warning')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Validate minimum 1 photo per category for publishing
    const missingCategories = PHOTO_CATEGORIES.filter(
      (cat) => !photos.some((p) => p.category === cat.id)
    )
    if (missingCategories.length > 0) {
      const missingTitles = missingCategories.map((c) => c.shortTitle).join(', ')
      showToast?.(
        `Photo Requirement: Please upload at least 1 photo for each category (${missingTitles}) before publishing.`,
        'warning'
      )
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setFormErrors({})
    setIsSubmitting(true)

    try {
      const coverPhoto =
        photos.find((p) => p.isCover && p.category === 'exterior') ||
        photos.find((p) => p.tag?.toLowerCase().includes('studio')) ||
        photos.find((p) => p.category === 'exterior') ||
        photos.find((p) => p.isCover) ||
        photos[0]
      const mainImageUrl = coverPhoto ? coverPhoto.dataUrl : ''

      const formattedGallery = photos.map((p, idx) => ({
        id: idx + 1,
        label: p.tag || `Photo ${idx + 1}`,
        category: p.category || 'exterior',
        image: p.dataUrl,
        thumb: p.dataUrl,
        isCover: Boolean(p.isCover),
      }))

      const carPayload = {
        make: effectiveMake,
        model: formData.model.trim(),
        year: Number(formData.year),
        variant: formData.variant.trim() || 'Standard',
        title: formData.title.trim() || `${formData.year} ${effectiveMake} ${formData.model.trim()}`,
        price: Number(formData.price),
        priceFormatted: formatINR(Number(formData.price) || 0),
        km: `${(Number(formData.kmNumeric) || 0).toLocaleString('en-IN')} km`,
        kmNumeric: Number(formData.kmNumeric),
        bodyType: formData.bodyType,
        fuel: formData.fuel,
        transmission: formData.transmission,
        ownership: formData.ownership,
        color: formData.color,
        location: formData.location,
        rto: formData.rto,
        insurance: formData.insurance,
        listingStatus: formData.listingStatus && formData.listingStatus !== 'Draft' ? formData.listingStatus : 'Available',
        inspected: formData.inspected,
        image: mainImageUrl,
        cutoutImage: mainImageUrl,
        detailHeroImage: mainImageUrl,
        gallery: formattedGallery.length > 0 ? formattedGallery : undefined,
        totalPhotos: formattedGallery.length || 1,
        aboutSummary:
          formData.aboutSummary.trim() ||
          `Certified ${formData.year} ${effectiveMake} ${formData.model.trim()} in immaculate condition. Single owner with complete authorized dealer history.`,
        aboutFull:
          formData.aboutFull.trim() ||
          `Comprehensive 200-point Harsha Quality Certification passed with ${formData.inspectionGrade} rating. Verified systems, zero flood or major accident record. Doorstep test drive available.`,
        inspectionGrade: formData.inspectionGrade,
        ...emiResult.value,
        keyFeatures: formData.selectedFeatures.map((feat) => {
          if (typeof feat === 'object' && feat.name) {
            return feat
          }
          const f = getFeatureById(feat)
          return {
            id: feat,
            name: f ? f.name : feat,
            iconName: f ? f.iconName : 'Sparkles',
            category: f ? f.category : 'Comfort & Convenience',
          }
        }),
      }

      // Check existing reminders before publishing: show matching pop-up to admin
      const localReminders = getStoredReminders()
      let allReminders = localReminders
      try {
        const cloudReminders = await fetchRemindersFromSupabase()
        if (Array.isArray(cloudReminders) && cloudReminders.length > 0) {
          allReminders = cloudReminders
        }
      } catch (cloudErr) {
        console.warn('Notice checking reminders in cloud:', cloudErr.message)
      }

      if (!editingPublishedListing && Array.isArray(allReminders) && allReminders.length > 0) {
        setPendingCarPayload(carPayload)
        setAvailableReminders(allReminders)
        setIsMatchModalOpen(true)
        setIsSubmitting(false)
        return
      }

      // If no buyer reminders are in system, proceed with direct publish
      await executeFinalPublish(carPayload, [])
    } catch (err) {
      console.error('Failed to create vehicle:', err)
      showToast?.('Error creating vehicle: ' + err.message, 'danger')
      setIsSubmitting(false)
    }
  }

  // Final execution of publishing vehicle & sending matching notification emails via Supabase edge function
  const executeFinalPublish = async (carPayload, selectedReminders = []) => {
    setIsSubmitting(true)
    isSubmittingRef.current = true
    isPublishedRef.current = true

    try {
      const targetStatus =
        carPayload.listingStatus && carPayload.listingStatus !== 'Draft'
          ? carPayload.listingStatus
          : 'Available'
      const carId = editingPublishedListing
        ? existingVehicle.id
        : (currentDraftId || `car-${Date.now()}`)

      const resolvedPrice = Number(carPayload.price ?? formData.price ?? 0)
      const resolvedKm = Number(carPayload.kmNumeric ?? formData.kmNumeric ?? 0)

      const fullPublishPayload = {
        ...(editingPublishedListing ? existingVehicle : {}),
        ...carPayload,
        price: resolvedPrice,
        priceFormatted: formatINR(resolvedPrice),
        km: `${resolvedKm.toLocaleString('en-IN')} km`,
        kmNumeric: resolvedKm,
        id: carId,
        listingStatus: targetStatus,
        isDraft: false,
      }

      // 1. Immediately save to LocalStorage as published
      const created = publishDraftCar(carId, fullPublishPayload)

      // 2. Persist to Supabase and await it!
      try {
        await publishDraftInSupabase(carId, fullPublishPayload)
      } catch (supaErr) {
        console.warn('Supabase publish draft notice:', supaErr.message)
      }

      setDraftsList(getStoredDrafts())

      // If buyer reminders were matched/selected, dispatch emails via the 'send-email' edge function!
      if (selectedReminders && selectedReminders.length > 0) {
        try {
          const emailResults = await sendMatchingCarEmails({
            reminders: selectedReminders,
            car: created,
          })
          if (emailResults.failed > 0) {
            showToast?.(
              `Vehicle "${created.title}" published. ${emailResults.sent} email(s) sent, ${emailResults.failed} failed via send-email.`,
              'warning'
            )
          } else {
            showToast?.(
              `Vehicle "${created.title}" published! Sent reminder emails to ${emailResults.sent} interested buyer(s).`,
              'success'
            )
          }
        } catch (emailErr) {
          console.error('Notice sending reminder emails:', emailErr)
          showToast?.(
            `Vehicle published! Notice sending reminder emails: ${emailErr.message}`,
            'warning'
          )
        }
      } else {
        showToast?.(
          editingPublishedListing
            ? `Vehicle "${created.title}" updated.`
            : `Vehicle "${created.title}" successfully published to live store!`,
          'success'
        )
      }

      setIsMatchModalOpen(false)
      setPendingCarPayload(null)

      if (onSuccess) {
        onSuccess(created)
      } else if (onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Failed final publish vehicle:', err)
      showToast?.(`Failed publishing vehicle: ${err.message}`, 'error')
      isPublishedRef.current = false
    } finally {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="add-vehicle-page d-flex flex-column" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* -----------------------------------------------------------------
          1. COMPACT MERGED HEADER & STEPPER CARD
      ----------------------------------------------------------------- */}
      <div className="bg-white border rounded-3 p-3 p-md-3.5 mb-3.5 shadow-2xs">
        {/* Top Row: Clean Breadcrumb & Title on Left, Single Drafts button on Right */}
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2.5 border-bottom flex-wrap gap-2">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: '13px' }}>
                <li className="breadcrumb-item">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-link p-0 text-decoration-none text-secondary"
                    style={{ fontSize: '13px' }}
                  >
                    Inventory
                  </button>
                </li>
                <li className="breadcrumb-item active text-dark fw-medium" aria-current="page">
                  {editingPublishedListing ? 'Edit Vehicle' : 'Add New Vehicle'}
                </li>
              </ol>
            </nav>
            <h1 className="h5 fw-bold mb-0 text-dark mt-0.5">
              {editingPublishedListing ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h1>
          </div>

          {/* Right Header: Auto-save status + Single Standard Outlined Drafts button + Clean Readiness */}
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end" style={{ minWidth: 0 }}>
            {/* Auto-save status badge (Every 10s auto-save indicator) */}
            {!editingPublishedListing && (
            <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
              {isAutoSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm text-primary"
                    style={{ width: '12px', height: '12px' }}
                    role="status"
                  ></span>
                  <span className="text-primary fw-medium">Auto-saving...</span>
                </>
              ) : lastAutoSavedAt ? (
                <>
                  <i className="bi bi-cloud-check-fill text-success" style={{ fontSize: '14px' }}></i>
                  <span className="text-muted">
                    Auto-saved {lastAutoSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check text-success" style={{ fontSize: '13px' }}></i>
                  <span className="text-muted">Auto-saves every 10s</span>
                </>
              )}
            </div>
            )}

            <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
              <span className="text-secondary">Readiness:</span>
              <span className="fw-semibold text-dark font-monospace">{readinessScore}%</span>
            </div>

            {!editingPublishedListing && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3"
              onClick={() => setDraftsModalOpen(true)}
              style={{ height: '36px', fontSize: '13px' }}
            >
              <FolderCheck className="w-4 h-4 text-secondary" />
              <span>Drafts</span>
              {draftsList.length > 0 && (
                <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-1" style={{ fontSize: '11px' }}>
                  {draftsList.length}
                </span>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Stepper: equal columns so labels wrap inside their own lane instead of running together */}
        <div className="position-relative pt-1">
          <div
            className="position-absolute d-none d-md-block"
            style={{
              top: '18px',
              left: '10%',
              width: '80%',
              height: '2px',
              backgroundColor: '#e2e8f0',
              zIndex: 1,
            }}
          />
          <div
            className="position-absolute d-none d-md-block"
            style={{
              top: '18px',
              left: '10%',
              height: '2px',
              backgroundColor: '#0f172a',
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%`,
              zIndex: 1,
              transition: 'width 0.3s ease',
            }}
          />

          <div
            className="position-relative"
            style={{
              zIndex: 2,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              columnGap: '8px',
            }}
          >
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id
              const isActive = currentStep === step.id

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className="btn p-0 border-0 bg-transparent text-center d-flex flex-column align-items-center"
                  style={{ cursor: 'pointer', minWidth: 0, width: '100%' }}
                >
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center transition-all ${
                      isActive || isCompleted
                        ? 'text-white'
                        : 'bg-white text-secondary border border-2'
                    }`}
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '13px',
                      fontWeight: '600',
                      flexShrink: 0,
                      background: isActive
                        ? 'linear-gradient(180deg, #3f3f46 0%, #18181b 100%)'
                        : isCompleted
                        ? '#18181b'
                        : undefined,
                      boxShadow: isActive ? '0 0 0 4px rgba(24, 24, 27, 0.12)' : undefined,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  <div className="mt-1.5 text-center w-100" style={{ minWidth: 0 }}>
                    <div
                      className={`fw-semibold ${
                        isActive ? 'text-dark' : isCompleted ? 'text-dark' : 'text-secondary'
                      }`}
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.25,
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      className="d-none d-xl-block mt-0.5"
                      style={{
                        fontSize: '11px',
                        lineHeight: 1.3,
                        color: '#64748b',
                        whiteSpace: 'normal',
                      }}
                    >
                      {step.subtitle}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Draft Active Alert Banner */}
      {currentDraftId && (
        <div className="alert alert-light border py-2 px-3 rounded-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2 shadow-2xs">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-secondary text-white" style={{ fontSize: '11px' }}>Draft</span>
            <span className="small text-secondary" style={{ fontSize: '13px' }}>
              Editing draft: <strong className="text-dark">{formData.title || `${formData.year || ''} ${formData.make} ${formData.model}`.trim() || 'Untitled Draft'}</strong>
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-xs btn-outline-secondary"
              onClick={() => {
                setCurrentDraftId(null)
                setFormData(getCleanSlateFormData())
                setEmiBaseline(null)
                setPhotos([])
                setTitleTouched(false)
                setCurrentStep(1)
                showToast?.('Started fresh listing. Your previous draft is still safely stored in Drafts Folder.', 'info')
              }}
              style={{ fontSize: '12px' }}
            >
              Start Fresh Instead
            </button>
            <button
              type="button"
              className="btn btn-xs btn-link text-danger text-decoration-none p-0"
              onClick={() => {
                if (window.confirm('Discard this draft permanently?')) {
                  handleDiscardDraft(currentDraftId)
                }
              }}
              style={{ fontSize: '12px' }}
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          STEPPER CONTENT (Takes Full Space)
      ----------------------------------------------------------------- */}
      <div className="flex-grow-1">
        {/* =============================================================
            STEP 1: Vehicle Identity
        ============================================================= */}
        {currentStep === 1 && (
          <div className="card border-0 shadow-sm rounded-3">
            {/* Plain Card Header with no redundant step numbers or icon */}
            <div className="card-header bg-transparent border-bottom py-3 px-4">
              <h2 className="mb-0 fw-bold fs-6 text-dark">Vehicle Identity</h2>
              <small className="text-secondary" style={{ fontSize: '13px' }}>
                Specify make, model, variant, year, and appearance details
              </small>
            </div>

            <div className="card-body p-4 space-y-4">
              {/* GROUP 1: Vehicle Specifications */}
              <div>
                <h6
                  className="fw-semibold text-secondary text-uppercase tracking-wider mb-2.5 pb-1 border-bottom"
                  style={{ fontSize: '11.5px', letterSpacing: '0.5px' }}
                >
                  Vehicle Specifications
                </h6>

                {/* Single Aligned 12-Column Grid (4 equal columns on desktop) */}
                <div className="row g-3.5 align-items-start">
                  {/* 1. Make / Brand */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Car Make / Brand
                    </label>
                    <BrandSelector
                      selectedBrand={formData.make}
                      onSelectBrand={(brandName) => {
                        setFormData({
                          ...formData,
                          make: brandName,
                          customMake: brandName === 'Other' ? formData.customMake : '',
                          model: '', // Reset model on make change
                        })
                        setIsCustomModel(false)
                        if (formErrors.make) setFormErrors({ ...formErrors, make: null })
                      }}
                      customBrandValue={formData.customMake || ''}
                      onCustomBrandChange={(val) => {
                        setFormData({ ...formData, customMake: val })
                        if (formErrors.customMake) setFormErrors({ ...formErrors, customMake: null })
                      }}
                    />
                    {formErrors.make && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.make}</div>}
                  </div>

                  {/* 2. Model Name (Searchable / Select list depending on Make) */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Model Name
                    </label>
                    {!isCustomModel && popularModels.length > 0 ? (
                      <CustomSelect
                        value={popularModels.includes(formData.model) ? formData.model : (formData.model ? '__custom__' : '')}
                        onChange={(val) => {
                          if (val === '__custom__') {
                            setIsCustomModel(true)
                            setFormData({ ...formData, model: '' })
                          } else {
                            setFormData({ ...formData, model: val })
                            if (formErrors.model) setFormErrors({ ...formErrors, model: null })
                          }
                        }}
                        options={[
                          { value: '', label: formData.make ? 'Select model...' : 'Select make first' },
                          ...popularModels.map((m) => ({ value: m, label: m })),
                          { value: '__custom__', label: '+ Other Model...' },
                        ]}
                        disabled={!formData.make}
                      />
                    ) : (
                      <div className="input-group">
                        <input
                          type="text"
                          className={`form-control ${formErrors.model ? 'is-invalid' : ''}`}
                          placeholder="e.g. Swift"
                          value={formData.model}
                          onChange={(e) => {
                            setFormData({ ...formData, model: e.target.value })
                            if (formErrors.model) setFormErrors({ ...formErrors, model: null })
                          }}
                          style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                        />
                        {popularModels.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setIsCustomModel(false)}
                            style={{ fontSize: '12px' }}
                            title="Back to popular model list"
                          >
                            List
                          </button>
                        )}
                      </div>
                    )}
                    {formErrors.model && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.model}</div>}
                  </div>

                  {/* 3. Trim / Variant */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Trim / Variant <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ZXi Plus / ZX CVT"
                      value={formData.variant}
                      onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                      style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                    />
                  </div>

                  {/* 4. Manufacturing Year (Starts unselected) */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Manufacturing Year
                    </label>
                    <CustomSelect
                      value={formData.year}
                      onChange={(val) => {
                        setFormData({ ...formData, year: val })
                        if (formErrors.year) setFormErrors({ ...formErrors, year: null })
                      }}
                      options={[
                        { value: '', label: 'Select Year...' },
                        ...YEARS_UNTIL_2000.map((y) => ({ value: y, label: y }))
                      ]}
                    />
                    {formErrors.year && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.year}</div>}
                  </div>
                </div>
              </div>

              {/* GROUP 2: Appearance (Color Swatches) */}
              <div>
                <h6
                  className="fw-semibold text-secondary text-uppercase tracking-wider mb-2.5 pb-1 border-bottom"
                  style={{ fontSize: '11.5px', letterSpacing: '0.5px' }}
                >
                  Appearance
                </h6>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-medium text-slate-700 mb-1.5" style={{ fontSize: '13px' }}>
                      Exterior Color <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      {COLOR_OPTIONS.map((c) => {
                        const isSelected = formData.color === c.name
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, color: c.name })
                              setIsCustomColor(false)
                            }}
                            className={`btn btn-sm d-flex align-items-center gap-2 rounded-2 border px-2.5 py-1.5 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary-subtle text-primary fw-semibold'
                                : 'border-light-subtle bg-white text-secondary'
                            }`}
                            style={{
                              borderColor: isSelected ? '#0d6efd' : '#e2e8f0',
                              fontSize: '13px',
                              height: '38px',
                            }}
                          >
                            <span
                              className="rounded-circle d-inline-block flex-shrink-0"
                              style={{
                                width: '14px',
                                height: '14px',
                                backgroundColor: c.hex,
                                border: `1px solid ${c.border || '#cbd5e1'}`,
                              }}
                            />
                            <span>{c.name}</span>
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => setIsCustomColor(!isCustomColor)}
                        className={`btn btn-sm d-flex align-items-center gap-1 rounded-2 border px-2.5 py-1.5 ${
                          isCustomColor ? 'border-primary text-primary fw-semibold bg-white' : 'border-light-subtle text-secondary bg-white'
                        }`}
                        style={{ fontSize: '13px', height: '38px' }}
                      >
                        <span>+ Other color</span>
                      </button>
                    </div>

                    {isCustomColor && (
                      <div className="mt-2" style={{ maxWidth: '360px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. British Racing Green"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GROUP 3: Registration & Ownership */}
              <div>
                <h6
                  className="fw-semibold text-secondary text-uppercase tracking-wider mb-2.5 pb-1 border-bottom"
                  style={{ fontSize: '11.5px', letterSpacing: '0.5px' }}
                >
                  Registration & Ownership
                </h6>

                <div className="row g-3.5">
                  {/* Ownership History (Starts unselected) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Ownership History
                    </label>
                    <CustomSelect
                      value={formData.ownership}
                      onChange={(val) => {
                        setFormData({ ...formData, ownership: val })
                        if (formErrors.ownership) setFormErrors({ ...formErrors, ownership: null })
                      }}
                      options={OWNERSHIP_OPTIONS}
                    />
                    {formErrors.ownership && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.ownership}</div>}
                  </div>

                  {/* Registration RTO (Searchable list of standard regional codes) */}
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Registration RTO <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    {!isCustomRto ? (
                      <CustomSelect
                        value={RTO_OPTIONS.some((r) => r.value === formData.rto) ? formData.rto : (formData.rto ? '__custom__' : '')}
                        onChange={(val) => {
                          if (val === '__custom__') {
                            setIsCustomRto(true)
                          } else {
                            setFormData({ ...formData, rto: val })
                          }
                        }}
                        options={RTO_OPTIONS}
                      />
                    ) : (
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. TN-39 (Tiruppur)"
                          value={formData.rto}
                          onChange={(e) => setFormData({ ...formData, rto: e.target.value })}
                          style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setIsCustomRto(false)}
                          style={{ fontSize: '12px' }}
                        >
                          List
                        </button>
                      </div>
                    )}
                    <small className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                      Format: TN-39 (Tiruppur)
                    </small>
                  </div>
                </div>
              </div>

              {/* GROUP 4: Store Listing Title (Live generated preview placed at the end) */}
              <div>
                <h6
                  className="fw-semibold text-secondary text-uppercase tracking-wider mb-2.5 pb-1 border-bottom"
                  style={{ fontSize: '11.5px', letterSpacing: '0.5px' }}
                >
                  Listing Title Preview
                </h6>

                {!isEditingTitle ? (
                  <div className="border rounded-2 p-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <span className="text-secondary d-block small mb-1" style={{ fontSize: '12px' }}>
                        Customer Storefront Title (auto-generated)
                      </span>
                      <span className="fw-semibold text-dark fs-6 font-monospace">
                        {formData.title || `${formData.year || ''} ${effectiveMake || ''} ${formData.model || ''} ${formData.variant || ''}`.trim() || 'Select Make, Model and Year above to preview title'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center gap-1.5"
                      style={{ height: '36px', fontSize: '13px' }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Custom Title</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Custom Store Listing Title
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => {
                          setTitleTouched(true)
                          setFormData({ ...formData, title: e.target.value })
                        }}
                        placeholder="Enter custom listing title..."
                        style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingTitle(false)
                          setTitleTouched(false)
                          const parts = [formData.year, effectiveMake, formData.model, formData.variant].filter(Boolean)
                          setFormData((prev) => ({ ...prev, title: parts.join(' ') }))
                        }}
                        className="btn btn-outline-secondary btn-sm px-3"
                        style={{ fontSize: '13px' }}
                      >
                        Reset to Auto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            STEP 2: Technical Specifications & Location
        ============================================================= */}
        {currentStep === 2 && (
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-transparent border-bottom py-3 px-4">
              <h2 className="mb-0 fw-bold fs-6 text-dark">Technical Specifications & Location</h2>
              <small className="text-secondary" style={{ fontSize: '13px' }}>
                Powertrain, transmission, body type, mileage and dealership location
              </small>
            </div>

            <div className="card-body p-4">
              <div className="row g-3.5">
                {/* Body Type */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Body Type <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <CustomSelect
                    value={formData.bodyType}
                    onChange={(val) => setFormData({ ...formData, bodyType: val })}
                    options={['SUV', 'Sedan', 'Hatchback', 'MPV', 'Crossover', 'Coupe']}
                    placeholder="Select Body Type"
                  />
                </div>

                {/* Fuel Type */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Fuel Type <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <CustomSelect
                    value={formData.fuel}
                    onChange={(val) => setFormData({ ...formData, fuel: val })}
                    options={['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']}
                    placeholder="Select Fuel Type"
                  />
                </div>

                {/* Transmission */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Transmission <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <CustomSelect
                    value={formData.transmission}
                    onChange={(val) => setFormData({ ...formData, transmission: val })}
                    options={[
                      { value: 'Automatic', label: 'Automatic' },
                      { value: 'Manual', label: 'Manual' },
                      { value: 'iMT', label: 'iMT (Clutchless)' },
                    ]}
                    placeholder="Select Transmission"
                  />
                </div>

                {/* Kilometers Driven (Required) */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Kilometers Driven
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="0"
                      className={`form-control ${formErrors.kmNumeric ? 'is-invalid' : ''}`}
                      placeholder="e.g. 28000"
                      value={formData.kmNumeric}
                      onChange={(e) => {
                        setFormData({ ...formData, kmNumeric: e.target.value })
                        if (formErrors.kmNumeric) setFormErrors({ ...formErrors, kmNumeric: null })
                      }}
                      style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                    />
                    <span className="input-group-text bg-light text-muted">km</span>
                  </div>
                  <small className="text-muted d-block mt-1 font-monospace" style={{ fontSize: '12px' }}>
                    Formatted: {Number(formData.kmNumeric || 0).toLocaleString('en-IN')} km
                  </small>
                  {formErrors.kmNumeric && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.kmNumeric}</div>}
                </div>

                {/* Dealership Hub Location */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Dealership Hub Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Tiruppur, Tamil Nadu"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                  />
                </div>

                {/* Insurance Status */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Insurance Status
                  </label>
                  <CustomSelect
                    value={formData.insurance}
                    onChange={(val) => setFormData({ ...formData, insurance: val })}
                    options={[
                      { value: 'Valid Comprehensive', label: 'Valid Comprehensive' },
                      { value: 'Valid Zero Depreciation', label: 'Valid Zero Depreciation' },
                      { value: 'Valid Third Party', label: 'Valid Third Party' },
                      { value: 'Expired', label: 'Expired' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            STEP 3: Pricing & Equipment Features
        ============================================================= */}
        {currentStep === 3 && (
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-transparent border-bottom py-3 px-4">
              <h2 className="mb-0 fw-bold fs-6 text-dark">Pricing & Equipment Features</h2>
              <small className="text-secondary" style={{ fontSize: '13px' }}>
                Listing price, storefront visibility, 200-point inspection and features bank
              </small>
            </div>

            <div className="card-body p-4 space-y-4">
              {/* Pricing & Status Grid */}
              <div className="row g-3.5">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Listing Price (in INR ₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light fw-bold">₹</span>
                    <input
                      type="number"
                      min="10000"
                      className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                      placeholder="e.g. 1450000"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        if (formErrors.price) setFormErrors({ ...formErrors, price: null })
                      }}
                      style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-1">
                    <small className="text-primary fw-semibold font-monospace" style={{ fontSize: '12px' }}>
                      Formatted: {formatINR(Number(formData.price) || 0)}
                    </small>
                    <small className="text-muted" style={{ fontSize: '12px' }}>
                      Storefront Customer Price
                    </small>
                  </div>
                  {formErrors.price && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.price}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                    Storefront Status
                  </label>
                  <CustomSelect
                    value={formData.listingStatus}
                    onChange={(val) => setFormData({ ...formData, listingStatus: val })}
                    options={[
                      { value: 'Available', label: 'Available (Visible to Customers)' },
                      { value: 'Reserved', label: 'Reserved (Under Test Drive / Token)' },
                      { value: 'Sold', label: 'Sold (Mark as Sold in Catalog)' },
                    ]}
                  />
                  <small className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                    Available cars instantly appear in search results, filter widgets, and catalog.
                  </small>
                </div>
              </div>

              {/* EMI terms the buyer will see on this car */}
              <div className="border rounded-3 p-3 bg-light">
                <div className="form-check form-switch p-0 d-flex align-items-center justify-content-between">
                  <div>
                    <label className="form-check-label fw-bold text-dark mb-0 d-block" htmlFor="emiAvailableSwitch" style={{ fontSize: '14px' }}>
                      EMI option available
                    </label>
                    <small className="text-muted" style={{ fontSize: '12px' }}>
                      {formData.emiAvailable
                        ? 'Buyers see the upfront amount, interest rate, tenure, and monthly installment you enter here.'
                        : 'Buyers see that EMI is not available and this car is full payment only.'}
                    </small>
                  </div>
                  <input
                    className="form-check-input ms-3 fs-5"
                    type="checkbox"
                    role="switch"
                    id="emiAvailableSwitch"
                    checked={Boolean(formData.emiAvailable)}
                    onChange={(e) => {
                      setFormData({ ...formData, emiAvailable: e.target.checked })
                      if (formErrors.emiDownPayment || formErrors.emiInterestRate || formErrors.emiTenureMonths) {
                        setFormErrors({
                          ...formErrors,
                          emiDownPayment: null,
                          emiInterestRate: null,
                          emiTenureMonths: null,
                        })
                      }
                    }}
                  />
                </div>

                {formData.emiAvailable && (
                  <div className="pt-3 mt-3 border-top">
                    {emiPreview.ok && emiPreview.legacy && (
                      <div className="small text-secondary mb-3" style={{ fontSize: '12px' }}>
                        Buyers currently see <strong className="text-dark">{emiPreview.value.emi}</strong>. Enter the upfront amount, interest rate, and tenure to replace that line. Leave them blank to keep it.
                      </div>
                    )}
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                          Upfront payment (INR)
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white fw-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            className={`form-control ${formErrors.emiDownPayment ? 'is-invalid' : ''}`}
                            placeholder="e.g. 200000"
                            value={formData.emiDownPayment}
                            onChange={(e) => {
                              setFormData({ ...formData, emiDownPayment: e.target.value })
                              if (formErrors.emiDownPayment) setFormErrors({ ...formErrors, emiDownPayment: null })
                            }}
                            style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                          />
                        </div>
                        <small className="text-muted d-block mt-1 font-monospace" style={{ fontSize: '12px' }}>
                          {formData.emiDownPayment === '' ? 'Amount due before the loan' : formatINR(Number(formData.emiDownPayment) || 0)}
                        </small>
                        {formErrors.emiDownPayment && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.emiDownPayment}</div>}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                          Interest rate (% per year)
                        </label>
                        <div className="input-group">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            className={`form-control ${formErrors.emiInterestRate ? 'is-invalid' : ''}`}
                            placeholder="e.g. 9.5"
                            value={formData.emiInterestRate}
                            onChange={(e) => {
                              setFormData({ ...formData, emiInterestRate: e.target.value })
                              if (formErrors.emiInterestRate) setFormErrors({ ...formErrors, emiInterestRate: null })
                            }}
                            style={{ height: '42px', fontSize: '14px', backgroundColor: '#fff' }}
                          />
                          <span className="input-group-text bg-white">% / year</span>
                        </div>
                        {formErrors.emiInterestRate && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.emiInterestRate}</div>}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                          Tenure
                        </label>
                        <CustomSelect
                          value={formData.emiTenureMonths ? String(formData.emiTenureMonths) : ''}
                          onChange={(val) => {
                            setFormData({ ...formData, emiTenureMonths: val })
                            if (formErrors.emiTenureMonths) setFormErrors({ ...formErrors, emiTenureMonths: null })
                          }}
                          options={EMI_TENURE_CHOICES}
                          placeholder="Select tenure"
                        />
                        {formErrors.emiTenureMonths && <div className="text-danger small mt-1" style={{ fontSize: '12px' }}>{formErrors.emiTenureMonths}</div>}
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                          Terms for the buyer <span className="text-muted fw-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          className="form-control"
                          placeholder="e.g. Subject to bank approval. Processing fee extra. No prepayment penalty after 6 months."
                          value={formData.emiNote}
                          onChange={(e) => setFormData({ ...formData, emiNote: e.target.value })}
                          style={{ fontSize: '14px', backgroundColor: '#fff' }}
                        />
                      </div>
                    </div>

                    {emiPreview.ok && !emiPreview.legacy && (
                      <div
                        className="mt-3 rounded-3 p-3 border"
                        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #e5e7eb 100%)' }}
                      >
                        <div className="d-flex justify-content-between align-items-baseline gap-2">
                          <span className="small fw-semibold text-secondary text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.4px' }}>Buyer will see</span>
                          <strong className="font-monospace text-dark">{emiPreview.value.emi}</strong>
                        </div>
                        <div className="row g-2 mt-2 small">
                          <div className="col-6 col-md-3">
                            <div className="text-secondary">Upfront</div>
                            <div className="fw-semibold font-monospace text-dark">{formatINR(emiPreview.value.emiDownPayment)}</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="text-secondary">Loan amount</div>
                            <div className="fw-semibold font-monospace text-dark">{formatINR(emiPreview.value.emiLoanAmount)}</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="text-secondary">Interest</div>
                            <div className="fw-semibold text-dark">{Number(emiPreview.value.emiInterestRate)}% per year</div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="text-secondary">Tenure</div>
                            <div className="fw-semibold text-dark">{formatTenureLabel(emiPreview.value.emiTenureMonths)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!formData.emiAvailable && (
                  <div className="pt-3 mt-3 border-top">
                    <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                      Note for the buyer <span className="text-muted fw-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="e.g. Bank finance is not offered on this car. Full payment at delivery."
                      value={formData.emiNote}
                      onChange={(e) => setFormData({ ...formData, emiNote: e.target.value })}
                      style={{ fontSize: '14px', backgroundColor: '#fff' }}
                    />
                  </div>
                )}
              </div>

              {/* Nova 200-Point Inspection Toggle & Grade */}
              <div className="border rounded-3 p-3 bg-light">
                <div className="form-check form-switch p-0 d-flex align-items-center justify-content-between mb-2">
                  <div>
                    <label className="form-check-label fw-bold text-dark mb-0 d-block cursor-pointer" htmlFor="inspectionSwitch" style={{ fontSize: '14px' }}>
                      Harsha 200-Point Certified Inspection Badge
                    </label>
                    <small className="text-muted" style={{ fontSize: '12px' }}>
                      Shows the verified green badge on the vehicle card and unlocks detailed inspection scores.
                    </small>
                  </div>
                  <input
                    className="form-check-input ms-3 fs-5 cursor-pointer"
                    type="checkbox"
                    role="switch"
                    id="inspectionSwitch"
                    checked={formData.inspected}
                    onChange={(e) => setFormData({ ...formData, inspected: e.target.checked })}
                  />
                </div>

                {formData.inspected && (
                  <div className="row g-3 pt-2 border-top mt-2">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                        Inspection Grade
                      </label>
                      <CustomSelect
                        size="sm"
                        value={formData.inspectionGrade}
                        onChange={(val) => setFormData({ ...formData, inspectionGrade: val })}
                        options={[
                          { value: 'A+', label: 'Grade A+ (Pristine / Showroom Condition)' },
                          { value: 'A', label: 'Grade A (Excellent / Minor Wear)' },
                          { value: 'B+', label: 'Grade B+ (Good / Well Maintained)' },
                        ]}
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                        Quick Assurance Highlights
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {['Zero Accidental Claims', 'Non-Flooded Certified', 'Odometer Verified', 'Complete Service History'].map((txt) => (
                          <span key={txt} className="badge bg-white text-secondary border d-flex align-items-center gap-1 py-1.5 px-2" style={{ fontSize: '12px' }}>
                            <Check className="w-3.5 h-3.5 text-success" />
                            <span>{txt}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Description Notes */}
              <div>
                <label className="form-label small fw-medium text-slate-700 mb-1" style={{ fontSize: '13px' }}>
                  Vehicle Overview & Dealer Notes <span className="text-muted fw-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder={`e.g. Certified ${formData.year || ''} ${effectiveMake || ''} ${formData.model || ''} in pristine condition. Single owner, non-accidental, authorized showroom service history...`}
                  value={formData.aboutSummary}
                  onChange={(e) => setFormData({ ...formData, aboutSummary: e.target.value })}
                  style={{ fontSize: '14px', backgroundColor: '#fff' }}
                ></textarea>
              </div>

              {/* Equipment & Features Bank */}
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small fw-bold text-dark mb-0" style={{ fontSize: '13.5px' }}>
                    Vehicle Features Bank ({formData.selectedFeatures?.length || 0} selected)
                  </label>
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    Select equipment highlights to display on the car storefront details
                  </small>
                </div>
                <div className="border rounded-3 p-3 bg-white">
                  <FeaturesSelector
                    selectedFeatures={formData.selectedFeatures}
                    onChange={(newFeatures) => {
                      setFormData({ ...formData, selectedFeatures: newFeatures })
                    }}
                    maxHighlights={12}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            STEP 4: Photo Studio & Media Gallery
        ============================================================= */}
        {currentStep === 4 && (
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0 fw-bold fs-6 text-dark">Photo Studio & Media Gallery</h2>
                <small className="text-secondary" style={{ fontSize: '13px' }}>
                  Upload high-resolution vehicle photos across 4 key categories (Min 1 each, Max 5)
                </small>
              </div>
              <span className="badge bg-light text-secondary border" style={{ fontSize: '12px' }}>
                {photos.length} Photo{photos.length === 1 ? '' : 's'} Uploaded
              </span>
            </div>

            <div className="card-body p-3 p-md-4">
              <div className="border rounded-3 p-3 mb-4 bg-white">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '14px' }}>Generate thumbnail</div>
                    <div className="text-secondary" style={{ fontSize: '12px' }}>
                      Studio photo from the uploaded car. It replaces the cover image.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-dark"
                    disabled={generatingThumb || !photos.some((photo) => photo.category === 'exterior' && photo.dataUrl) || thumbQuota.used >= thumbQuota.limit}
                    onClick={generateThumbnail}
                  >
                    {generatingThumb ? 'Generating' : 'Generate thumbnail'}
                  </button>
                </div>
                <div className="mt-3">
                  <div className="d-flex justify-content-between text-secondary mb-1" style={{ fontSize: '12px' }}>
                    <span>This month</span>
                    <span>{thumbQuota.used} / {thumbQuota.limit}</span>
                  </div>
                  <div className="progress" style={{ height: '6px', backgroundColor: '#e4e4e7' }}>
                    <div
                      className="progress-bar bg-dark"
                      style={{ width: `${Math.min(100, (thumbQuota.used / thumbQuota.limit) * 100)}%` }}
                    />
                  </div>
                  {thumbQuotaError ? (
                    <div className="text-danger mt-2" style={{ fontSize: '12px' }}>{thumbQuotaError}</div>
                  ) : null}
                </div>
              </div>
              <CategorizedPhotoUploader
                photos={photos}
                onPhotosChange={setPhotos}
                isProcessing={isProcessingPhotos}
                showToast={showToast}
                onPreviewPhoto={(url) => setActivePreviewPhoto(url)}
              />
            </div>
          </div>
        )}

        {/* =============================================================
            STEP 5: Review & Live Storefront Preview
        ============================================================= */}
        {currentStep === 5 && (
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h2 className="mb-0 fw-bold fs-6 text-dark">Review & Live Storefront Preview</h2>
                <small className="text-secondary" style={{ fontSize: '13px' }}>
                  Verify customer buyer view, loan commercials, and audit listing before publishing
                </small>
              </div>
              <span className="badge bg-light text-secondary border" style={{ fontSize: '12px' }}>
                ● Real-Time Store Sync
              </span>
            </div>

            <div className="card-body p-4">
              <div className="row g-4">
                {/* LEFT COLUMN: Live Customer Card & EMI Estimator */}
                <div className="col-12 col-lg-6 space-y-4">
                  {/* Live Storefront Preview Card */}
                  <div className="border rounded-3 overflow-hidden bg-white shadow-sm">
                    <div className="bg-light border-bottom px-3.5 py-2.5 d-flex align-items-center justify-content-between">
                      <span className="small fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <Eye className="w-4 h-4 text-primary" />
                        <span>Customer Storefront Card Preview</span>
                      </span>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '11px' }}>
                        Buyer View
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/50">
                      <div className="card border shadow-2xs rounded-3 overflow-hidden bg-white">
                        {/* Cover Photo: Real uploaded photo or clean empty state */}
                        <div
                          className="position-relative bg-dark overflow-hidden"
                          style={{ aspectRatio: '16 / 10', maxHeight: '220px' }}
                        >
                          {primaryCoverPhoto?.dataUrl ? (
                            <img
                              src={primaryCoverPhoto.dataUrl}
                              alt="Vehicle Storefront Preview"
                              className="w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-slate-800 text-white"
                              style={{ minHeight: '190px' }}
                            >
                              <div className="rounded-circle bg-white bg-opacity-10 p-2.5 mb-2">
                                <Camera className="w-6 h-6 text-slate-300" />
                              </div>
                              <span className="small fw-semibold text-white" style={{ fontSize: '13px' }}>No Cover Photo Uploaded Yet</span>
                              <span className="text-slate-400 mt-1" style={{ fontSize: '12px' }}>
                                Upload photos in Step 4 to preview your vehicle's live image
                              </span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="btn btn-xs btn-outline-light rounded-pill mt-2.5 py-1 px-3"
                                style={{ fontSize: '12px' }}
                              >
                                + Add Photos in Step 4
                              </button>
                            </div>
                          )}

                          {/* Certified Badge */}
                          {formData.inspected && (
                            <span
                              className="position-absolute top-0 start-0 m-2 badge bg-slate-900 bg-opacity-90 text-white d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{ fontSize: '11px', backgroundColor: '#0f172a' }}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Harsha Certified ({formData.inspectionGrade})</span>
                            </span>
                          )}

                          {/* Photo Count Badge */}
                          <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 text-white" style={{ fontSize: '11px' }}>
                            <Camera className="w-3.5 h-3.5 me-1 d-inline" />
                            {photos.length} Photo{photos.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {/* Card Content */}
                        <div className="p-3">
                          <div className="d-flex items-center justify-content-between gap-2 mb-1.5">
                            <span className="badge bg-light text-secondary border" style={{ fontSize: '11.5px' }}>
                              {formData.year || 'Year'}{effectiveMake ? ` • ${effectiveMake}` : ''}
                            </span>
                            <span className="badge bg-light text-dark border" style={{ fontSize: '11.5px' }}>
                              {formData.listingStatus}
                            </span>
                          </div>

                          <h6 className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '15px' }}>
                            {formData.title || (effectiveMake || formData.model ? `${formData.year || ''} ${effectiveMake ? effectiveMake + ' ' : ''}${formData.model || ''}`.trim() : 'New Vehicle Listing')}
                          </h6>

                          {/* Specs Chips */}
                          <div className="d-flex flex-wrap gap-1 text-muted mb-2.5" style={{ fontSize: '12px' }}>
                            {formData.fuel && <span className="bg-light px-1.5 py-0.5 rounded border">{formData.fuel}</span>}
                            {formData.transmission && <span className="bg-light px-1.5 py-0.5 rounded border">{formData.transmission}</span>}
                            {formData.kmNumeric !== '' && (
                              <span className="bg-light px-1.5 py-0.5 rounded border font-monospace">
                                {Number(formData.kmNumeric || 0).toLocaleString('en-IN')} km
                              </span>
                            )}
                            <span className="bg-light px-1.5 py-0.5 rounded border">{formData.location || 'Tiruppur'}</span>
                          </div>

                          {/* Price & EMI */}
                          <div className="d-flex align-items-center justify-content-between pt-2.5 border-top">
                            <div>
                              <div className="fw-bold text-dark fs-6 font-monospace" style={{ fontSize: '16px' }}>
                                {formData.price ? formatINR(formData.price) : '₹ Price not set'}
                              </div>
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {formData.ownership || 'Ownership not set'}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '12.5px' }}>
                                {emiPreview.ok ? emiPreview.value.emi : 'EMI terms incomplete'}
                              </span>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {emiPreview.ok && emiPreview.value.emiAvailable ? 'As set for this car' : 'Shown on the car page'}
                              </div>
                            </div>
                          </div>

                          {/* Selected Feature Tags */}
                          {formData.selectedFeatures && formData.selectedFeatures.length > 0 && (
                            <div className="mt-2.5 pt-2 border-top d-flex flex-wrap gap-1">
                              {formData.selectedFeatures.slice(0, 4).map((feat, i) => {
                                const name = typeof feat === 'string' ? feat : (feat.name || feat.id)
                                return (
                                  <span key={i} className="badge bg-light text-secondary border font-normal" style={{ fontSize: '11px' }}>
                                    <Sparkles className="w-2.5 h-2.5 text-warning me-1 d-inline" />
                                    {name}
                                  </span>
                                )
                              })}
                              {formData.selectedFeatures.length > 4 && (
                                <span className="badge bg-light text-muted border font-normal" style={{ fontSize: '11px' }}>
                                  +{formData.selectedFeatures.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EMI terms the buyer will see */}
                  <div className="border rounded-3 overflow-hidden bg-white shadow-sm">
                    <div className="bg-light border-bottom px-3.5 py-2.5 d-flex align-items-center justify-content-between">
                      <span className="small fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <Calculator className="w-4 h-4 text-primary" />
                        <span>EMI shown to the buyer</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="btn btn-xs btn-link text-decoration-none p-0"
                        style={{ fontSize: '12px' }}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="p-3 small text-secondary">
                      {!emiPreview.ok && (
                        <div>Finish the upfront amount, interest rate, and tenure in Pricing, or turn EMI off.</div>
                      )}
                      {emiPreview.ok && !emiPreview.value.emiAvailable && (
                        <>
                          <div className="fw-semibold text-dark">EMI not available</div>
                          <div className="mt-1">This car is offered for full payment only.</div>
                          {emiPreview.value.emiNote ? <div className="mt-2 text-dark">{emiPreview.value.emiNote}</div> : null}
                        </>
                      )}
                      {emiPreview.ok && emiPreview.legacy && (
                        <>
                          <div className="fw-semibold text-dark font-monospace">{emiPreview.value.emi}</div>
                          <div className="mt-1">Existing EMI line. Set upfront, interest, and tenure in Pricing to replace it.</div>
                        </>
                      )}
                      {emiPreview.ok && emiPreview.value.emiAvailable && !emiPreview.legacy && (
                        <>
                          <div className="d-flex justify-content-between py-1.5 border-bottom">
                            <span>Upfront payment</span>
                            <strong className="text-dark font-monospace">{formatINR(emiPreview.value.emiDownPayment)}</strong>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-bottom">
                            <span>Loan amount</span>
                            <span className="font-monospace text-dark">{formatINR(emiPreview.value.emiLoanAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-bottom">
                            <span>Interest</span>
                            <span className="text-dark">{Number(emiPreview.value.emiInterestRate)}% per year</span>
                          </div>
                          <div className="d-flex justify-content-between py-1.5 border-bottom">
                            <span>Tenure</span>
                            <span className="text-dark">{formatTenureLabel(emiPreview.value.emiTenureMonths)}</span>
                          </div>
                          <div className="d-flex justify-content-between py-2 mt-2 bg-light px-3 rounded-2">
                            <span className="fw-bold text-dark">Monthly EMI</span>
                            <strong className="text-dark font-monospace fs-6">{formatINR(emiPreview.value.emiNumeric)} / month</strong>
                          </div>
                          {emiPreview.value.emiNote ? <div className="mt-2 text-dark">{emiPreview.value.emiNote}</div> : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Listing Audit, Summary & Publishing CTAs */}
                <div className="col-12 col-lg-6 space-y-4">
                  {/* Listing Readiness Card */}
                  <div className="border rounded-3 p-3.5 bg-white shadow-sm">
                    <div className="d-flex align-items-center justify-content-between mb-2.5">
                      <div className="d-flex align-items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="fw-bold small text-dark" style={{ fontSize: '13.5px' }}>Publishing Readiness Audit</span>
                      </div>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '12px' }}>
                        {readinessScore}% Complete
                      </span>
                    </div>

                    {/* Step-by-Step Audit Checklist with Quick Edit Links */}
                    <div className="d-flex flex-column gap-2 small">
                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light">
                        <div className="d-flex align-items-center gap-2">
                          {formData.make && formData.model && formData.year && formData.ownership ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-secondary" />
                          )}
                          <span style={{ fontSize: '13px' }}>1. Identity ({effectiveMake || 'Make?'} {formData.model || 'Model?'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="btn btn-xs btn-link text-decoration-none p-0 text-primary fw-medium"
                          style={{ fontSize: '12px' }}
                        >
                          Edit
                        </button>
                      </div>

                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light">
                        <div className="d-flex align-items-center gap-2">
                          {formData.kmNumeric !== '' ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-secondary" />
                          )}
                          <span style={{ fontSize: '13px' }}>2. Technical Specifications ({formData.kmNumeric ? `${Number(formData.kmNumeric).toLocaleString('en-IN')} km` : 'KM?'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="btn btn-xs btn-link text-decoration-none p-0 text-primary fw-medium"
                          style={{ fontSize: '12px' }}
                        >
                          Edit
                        </button>
                      </div>

                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light">
                        <div className="d-flex align-items-center gap-2">
                          {formData.price && Number(formData.price) > 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-secondary" />
                          )}
                          <span style={{ fontSize: '13px' }}>3. Pricing & Features ({formData.price ? formatINR(formData.price) : 'Price?'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="btn btn-xs btn-link text-decoration-none p-0 text-primary fw-medium"
                          style={{ fontSize: '12px' }}
                        >
                          Edit
                        </button>
                      </div>

                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-2 bg-light">
                        <div className="d-flex align-items-center gap-2">
                          {completedCategoriesCount === 4 ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-secondary" />
                          )}
                          <span style={{ fontSize: '13px' }}>4. Photography: {completedCategoriesCount}/4 Categories ({photos.length} photos)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="btn btn-xs btn-link text-decoration-none p-0 text-primary fw-medium"
                          style={{ fontSize: '12px' }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details Overview Breakdown */}
                  <div className="border rounded-3 p-3.5 bg-white shadow-sm">
                    <h6 className="fw-bold small text-dark mb-2.5 pb-2 border-bottom" style={{ fontSize: '13.5px' }}>
                      Vehicle Details Summary
                    </h6>
                    <div className="row g-2 small text-secondary">
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Make & Model</span>
                        <strong className="text-dark" style={{ fontSize: '13px' }}>{effectiveMake || '—'} {formData.model || '—'}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Year & Trim</span>
                        <strong className="text-dark" style={{ fontSize: '13px' }}>{formData.year || '—'} • {formData.variant || 'Standard'}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Body & Fuel</span>
                        <span className="text-dark" style={{ fontSize: '13px' }}>{formData.bodyType || '—'} • {formData.fuel || '—'}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Transmission & KM</span>
                        <span className="text-dark" style={{ fontSize: '13px' }}>{formData.transmission || '—'} • {formData.kmNumeric ? `${Number(formData.kmNumeric).toLocaleString('en-IN')} km` : '—'}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Location / RTO</span>
                        <span className="text-dark" style={{ fontSize: '13px' }}>{formData.location || '—'} {formData.rto ? `(${formData.rto})` : ''}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block" style={{ fontSize: '11px' }}>Ownership & Insurance</span>
                        <span className="text-dark" style={{ fontSize: '13px' }}>{formData.ownership || '—'} • {formData.insurance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Publish CTA Card */}
                  <div className="p-3.5 bg-light border rounded-3">
                    <div className="d-flex align-items-center gap-2 mb-1.5 text-dark fw-bold" style={{ fontSize: '14px' }}>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{editingPublishedListing ? 'Save Listing Changes' : 'Ready to Launch Listing'}</span>
                    </div>
                    <p className="text-secondary small mb-3" style={{ fontSize: '12.5px' }}>
                      {editingPublishedListing
                        ? 'Saving updates this vehicle in live inventory. Customers see the revised details immediately.'
                        : 'Publishing adds this vehicle to live inventory, making it instantly discoverable and bookable by storefront customers.'}
                    </p>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isSavingDraft}
                      className="btn btn-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                      style={{ fontSize: '14px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>{editingPublishedListing ? 'Saving changes...' : 'Publishing to Store...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{editingPublishedListing ? 'Save Changes' : 'Publish Vehicle to Live Store'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -----------------------------------------------------------------
          STICKY FOOTER ACTION BAR (Attached to bottom of viewport)
      ----------------------------------------------------------------- */}
      <div
        className="bg-white border-top py-2.5 px-3 px-md-4 d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 1020,
          marginLeft: '-1rem',
          marginRight: '-1rem',
          marginBottom: '-1rem',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Cancel as subtle text button */}
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-link text-secondary text-decoration-none px-2"
          style={{ fontSize: '14px' }}
        >
          Cancel
        </button>

        <div className="d-flex align-items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="btn btn-outline-secondary btn-sm px-3"
              style={{ height: '40px', fontSize: '13.5px' }}
            >
              <ArrowLeft className="w-4 h-4 me-1 d-inline" />
              <span>Back</span>
            </button>
          )}

          {!editingPublishedListing && (
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={isSavingDraft || isSubmitting}
            className="btn btn-outline-secondary btn-sm px-3"
            style={{ height: '40px', fontSize: '13.5px' }}
          >
            <BookmarkCheck className="w-4 h-4 me-1 d-inline text-secondary" />
            <span>Save Draft</span>
          </button>
          )}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="btn btn-primary d-flex align-items-center gap-1.5 px-4 shadow-sm"
              style={{ height: '40px', fontSize: '14px' }}
            >
              <span className="fw-semibold">Continue</span>
              <span className="small opacity-75 d-none d-sm-inline ms-1">to {STEPS[currentStep]?.title}</span>
              <ArrowRight className="w-4 h-4 ms-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isSavingDraft}
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm fw-semibold"
              style={{ height: '40px', fontSize: '14px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>{editingPublishedListing ? 'Saving...' : 'Publishing...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingPublishedListing ? 'Save Changes' : 'Publish Vehicle to Live Store'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------
          Photo Lightbox Preview Modal
      ----------------------------------------------------------------- */}
      {activePreviewPhoto && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1090 }}
          tabIndex="-1"
          onClick={() => setActivePreviewPhoto(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-transparent border-0" onClick={(e) => e.stopPropagation()}>
              <div className="text-end mb-2">
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-circle p-1.5"
                  onClick={() => setActivePreviewPhoto(null)}
                >
                  <X className="w-5 h-5 text-dark" />
                </button>
              </div>
              <div className="rounded-3 overflow-hidden shadow-2xl bg-black text-center">
                <img
                  src={activePreviewPhoto}
                  alt="Full preview"
                  className="w-100"
                  style={{ maxHeight: '80vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          Saved Drafts Folder Modal
      ----------------------------------------------------------------- */}
      <DraftsModal
        isOpen={draftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
        drafts={draftsList}
        onContinueDraft={handleLoadDraft}
        onPublishDraft={handlePublishFromDraft}
        onDiscardDraft={handleDiscardDraft}
      />

      {/* -----------------------------------------------------------------
          Matching Buyer Reminders Pop-up (Before Publishing)
      ----------------------------------------------------------------- */}
      <MatchRemindersModal
        isOpen={isMatchModalOpen}
        car={pendingCarPayload}
        reminders={availableReminders}
        onClose={() => {
          setIsMatchModalOpen(false)
          setPendingCarPayload(null)
        }}
        onPublishWithoutEmails={() => {
          if (pendingCarPayload) {
            executeFinalPublish(pendingCarPayload, [])
          }
        }}
        onConfirmPublishAndRemind={(selectedReminders) => {
          if (pendingCarPayload) {
            return executeFinalPublish(pendingCarPayload, selectedReminders)
          }
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

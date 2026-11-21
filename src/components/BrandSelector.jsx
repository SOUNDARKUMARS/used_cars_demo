import React, { useState, useRef, useEffect, useMemo } from 'react'
import { INDIAN_MARKET_BRANDS, getBrandByName } from '../data/brandsData'
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react'

/**
 * Compact Searchable Brand Selector Component
 * Features:
 * - Simple compact input box with logo at the side and brand name
 * - Searchable dropdown popover containing only car brands usually available in India
 * - Selectable with real-time filtering
 * - Supports custom / other brand entry
 */
export default function BrandSelector({
  selectedBrand = '',
  onSelectBrand,
  customBrandValue = '',
  onCustomBrandChange,
  placeholder = 'Select car make / brand...',
  allowAny = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(
    selectedBrand === 'Other' || (Boolean(selectedBrand) && !getBrandByName(selectedBrand))
  )

  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Current selected brand object (if in catalog)
  const currentBrand = useMemo(() => {
    return getBrandByName(selectedBrand)
  }, [selectedBrand])

  // Filtered brands based on user search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return INDIAN_MARKET_BRANDS
    const q = searchQuery.toLowerCase().trim()
    return INDIAN_MARKET_BRANDS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.shortName && b.shortName.toLowerCase().includes(q))
    )
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSelectBrand = (brand) => {
    setIsCustomMode(false)
    onSelectBrand(brand.name, brand)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleSelectAny = () => {
    setIsCustomMode(false)
    onSelectBrand('', null)
    if (onCustomBrandChange) onCustomBrandChange('')
    setIsOpen(false)
    setSearchQuery('')
  }

  const isAnySelected = allowAny && !selectedBrand && !isCustomMode

  const handleSelectOther = () => {
    setIsCustomMode(true)
    onSelectBrand('Other', null)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onSelectBrand('', null)
    if (onCustomBrandChange) onCustomBrandChange('')
    setIsCustomMode(false)
    setSearchQuery('')
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-[42px] cursor-pointer items-center justify-between rounded-xl border bg-white px-2 transition ${
          isOpen ? 'border-slate-900 shadow-sm' : 'border-slate-200'
        }`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        <div className="me-2 flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {currentBrand ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                <img
                  src={currentBrand.logo}
                  alt={currentBrand.name}
                  className="max-h-[22px] max-w-[26px] object-contain"
                />
              </div>
              <span className="truncate text-sm font-semibold text-slate-900">{currentBrand.name}</span>
            </>
          ) : isCustomMode || selectedBrand === 'Other' ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Plus className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold text-slate-900">
                {customBrandValue.trim() ? customBrandValue : 'Other Brand (Custom)'}
              </span>
            </>
          ) : selectedBrand ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                {selectedBrand.charAt(0)}
              </div>
              <span className="truncate text-sm font-semibold text-slate-900">{selectedBrand}</span>
            </>
          ) : isAnySelected ? (
            <span className="px-1 text-sm font-semibold text-slate-900">Any brand</span>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-[13.5px]">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {(selectedBrand || customBrandValue) && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center p-0 text-slate-400 hover:text-red-600"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* ============================================================
          COMPACT SEARCHABLE DROPDOWN LIST (Floating Popover)
      ============================================================ */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[80] mt-1 max-h-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 p-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white">
              <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full bg-transparent px-2 py-1.5 text-xs text-slate-900 outline-none"
                placeholder="Search brand (e.g. Maruti, Tata, Toyota, Honda)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false)
                }}
              />
              {searchQuery && (
                <button type="button" className="px-2 text-slate-400" onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10.5px] text-slate-400">
              <span>Indian Automotive Market Brands</span>
              <span>{filteredBrands.length} brands</span>
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto py-1">
            {allowAny && !searchQuery.trim() && (
              <button
                type="button"
                onClick={handleSelectAny}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13.5px] ${
                  isAnySelected ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>Any brand</span>
                {isAnySelected && <Check className="h-4 w-4 shrink-0 text-slate-900" />}
              </button>
            )}
            {filteredBrands.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={handleSelectOther}
                  className="mt-1 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Use custom make "{searchQuery}"</span>
                </button>
              </div>
            ) : (
              filteredBrands.map((brand) => {
                const isSelected =
                  selectedBrand &&
                  (selectedBrand.toLowerCase() === brand.name.toLowerCase() ||
                    (brand.shortName && selectedBrand.toLowerCase() === brand.shortName.toLowerCase()))

                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => handleSelectBrand(brand)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13.5px] ${
                      isSelected ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-200 bg-white p-0.5">
                        <img
                          src={brand.logo}
                          alt=""
                          className="max-h-[18px] max-w-[22px] object-contain"
                        />
                      </span>
                      <span className="truncate">{brand.name}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-slate-900" />}
                  </button>
                )
              })
            )}

            <div className="mt-1 border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={handleSelectOther}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] ${
                  isCustomMode || selectedBrand === 'Other'
                    ? 'bg-slate-100 font-semibold text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100">
                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                  </span>
                  <span>Other brand (type custom name)</span>
                </span>
                {(isCustomMode || selectedBrand === 'Other') && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isCustomMode || selectedBrand === 'Other') && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <label className="mb-1 block text-[11.5px] font-semibold text-slate-500">
            Specify custom brand / make
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <Plus className="ml-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent px-2 py-1.5 text-xs outline-none"
              placeholder="e.g. Force Motors, Hindustan Motors, Pravaig..."
              value={customBrandValue}
              onChange={(e) => {
                if (onCustomBrandChange) onCustomBrandChange(e.target.value)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

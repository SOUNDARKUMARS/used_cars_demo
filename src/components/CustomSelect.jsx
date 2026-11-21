import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Custom Code-Based Select Menu Component
 * Replaces native OS <select> elements to guarantee clean, styled, and reliable
 * dropdown menus that open directly under the trigger box without detached or glitched OS popups.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  size = 'md', // 'sm' | 'md'
  maxHeight = '240px',
  id,
  uiVariant = 'bootstrap', // 'bootstrap' | 'storefront'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Normalize options: supports string array ['2023', '2022'] or object array [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: String(opt.value),
        label: opt.label || String(opt.value),
      }
    }
    return {
      value: String(opt),
      label: String(opt),
    }
  })

  // Selected option object
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  )

  // Close when clicking outside the trigger or the portaled menu
  useEffect(() => {
    function handleClickOutside(event) {
      const insideTrigger = containerRef.current?.contains(event.target)
      const insideMenu = listRef.current?.contains(event.target)
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Place the menu on the viewport so a scrolling table cannot clip it
  useLayoutEffect(() => {
    if (!isOpen) return undefined

    const placeMenu = () => {
      const trigger = containerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const preferredHeight = Number.parseFloat(maxHeight) || 240
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const openUp = spaceBelow < Math.min(preferredHeight, 160) && spaceAbove > spaceBelow
      const available = Math.max(120, (openUp ? spaceAbove : spaceBelow) - 12)
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        zIndex: 2000,
        maxHeight: `${Math.min(preferredHeight, available)}px`,
      })
    }

    placeMenu()
    window.addEventListener('resize', placeMenu)
    window.addEventListener('scroll', placeMenu, true)
    return () => {
      window.removeEventListener('resize', placeMenu)
      window.removeEventListener('scroll', placeMenu, true)
    }
  }, [isOpen, maxHeight])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Scroll active item into view when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen])

  const handleSelect = (optValue) => {
    if (disabled) return
    onChange(optValue)
    setIsOpen(false)
  }

  const isSmall = size === 'sm'
  const isStorefront = uiVariant === 'storefront'

  const triggerClasses = isStorefront
    ? `flex w-full cursor-pointer items-center justify-between rounded-xl border bg-white transition ${
        isSmall ? 'min-h-[38px] px-2.5 py-1.5 text-xs' : 'min-h-[42px] px-3 py-2 text-sm'
      } ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
          : isOpen
            ? 'border-slate-900 shadow-sm'
            : 'border-slate-200'
      }`
    : `form-control d-flex align-items-center justify-content-between cursor-pointer ${
        isSmall ? 'py-1 px-2.5' : 'py-2 px-3'
      } ${isOpen ? 'border-primary shadow-sm' : ''} ${
        disabled ? 'bg-body-secondary text-muted pe-none' : 'bg-white'
      }`

  const triggerStyle = isStorefront
    ? undefined
    : {
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: isSmall ? '34px' : '42px',
        height: isSmall ? '34px' : '42px',
        backgroundColor: disabled ? undefined : '#ffffff',
        borderColor: isOpen ? '#0d6efd' : undefined,
        boxShadow: isOpen ? '0 0 0 0.2rem rgba(13, 110, 253, 0.15)' : undefined,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }

  const menuClasses = isStorefront
    ? 'overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl'
    : 'bg-white border rounded-3 shadow-lg overflow-y-auto'

  return (
    <div
      ref={containerRef}
      id={id}
      className={
        isStorefront ? `relative w-full ${className}` : `position-relative w-100 ${className}`
      }
      style={{ userSelect: 'none' }}
    >
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen)
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        className={triggerClasses}
        style={triggerStyle}
      >
        <span
          className={
            isStorefront
              ? `min-w-0 truncate font-semibold ${
                  selectedOption ? 'text-slate-900' : 'text-slate-400'
                }`
              : `text-truncate ${selectedOption ? 'text-body fw-medium' : 'text-muted'}`
          }
          style={isStorefront ? undefined : { fontSize: isSmall ? '12px' : '14px' }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={
            isStorefront
              ? `ml-2 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                  isOpen ? 'rotate-180 text-slate-900' : ''
                }`
              : `flex-shrink-0 ms-2 text-muted transition-transform ${
                  isOpen ? 'rotate-180 text-primary' : ''
                }`
          }
          style={
            isStorefront
              ? undefined
              : {
                  width: isSmall ? '14px' : '16px',
                  height: isSmall ? '14px' : '16px',
                  transition: 'transform 0.15s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                }
          }
        />
      </div>

      {isOpen &&
        menuStyle &&
        createPortal(
          <div
            ref={listRef}
            className={menuClasses}
            style={{
              ...menuStyle,
              boxShadow: isStorefront
                ? '0 16px 40px -12px rgba(15, 23, 42, 0.25)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            }}
          >
            {normalizedOptions.length === 0 ? (
              <div
                className={
                  isStorefront
                    ? 'p-3 text-center text-xs text-slate-500'
                    : 'p-3 text-center text-muted small'
                }
              >
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <div
                    key={opt.value}
                    data-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={
                      isStorefront
                        ? `flex cursor-pointer items-center justify-between px-3 ${
                            isSmall ? 'py-2 text-xs' : 'py-2.5 text-sm'
                          } ${
                            isSelected
                              ? 'bg-slate-100 font-semibold text-slate-900'
                              : 'text-slate-800 hover:bg-slate-50'
                          }`
                        : `d-flex align-items-center justify-content-between px-3 cursor-pointer ${
                            isSmall ? 'py-1.5' : 'py-2'
                          } ${
                            isSelected
                              ? 'bg-primary-subtle text-primary fw-semibold'
                              : 'text-dark'
                          }`
                    }
                    style={
                      isStorefront
                        ? undefined
                        : {
                            cursor: 'pointer',
                            fontSize: isSmall ? '12px' : '13.5px',
                            transition: 'background-color 0.1s ease',
                          }
                    }
                    onMouseEnter={
                      isStorefront
                        ? undefined
                        : (e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'
                          }
                    }
                    onMouseLeave={
                      isStorefront
                        ? undefined
                        : (e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                          }
                    }
                  >
                    <span className={isStorefront ? 'mr-2 truncate' : 'text-truncate me-2'}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check
                        className={
                          isStorefront
                            ? 'h-3.5 w-3.5 shrink-0 text-slate-900'
                            : 'text-primary flex-shrink-0'
                        }
                        style={
                          isStorefront
                            ? undefined
                            : {
                                width: isSmall ? '14px' : '16px',
                                height: isSmall ? '14px' : '16px',
                              }
                        }
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>,
          document.body
        )}
    </div>
  )
}

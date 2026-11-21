import React from 'react'
import { BRAND_LOGO_SRC, BRAND_NAME } from '../config/brand'

export default function BrandLogo({
  className = '',
  imgClassName = 'h-9 sm:h-10 w-auto max-w-[min(220px,55vw)] object-contain',
  /** Use on dark backgrounds — logo asset is black-backed */
  onDark = false,
}) {
  const image = (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      className={[imgClassName, onDark ? '' : className].filter(Boolean).join(' ')}
      decoding="async"
    />
  )

  if (!onDark) {
    return image
  }

  return (
    <div
      className={[
        'inline-flex items-center rounded-xl bg-white px-3.5 py-2 shadow-sm border border-white/20',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {image}
    </div>
  )
}
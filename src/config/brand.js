import logoMain from '../assets/logo-main.png'

export const BRAND_NAME = 'Harsha cars'

/** Stored listings still say the previous brand. Rewrite those labels on read. */
export function rebrandValue(value) {
  if (typeof value === 'string') return value.replace(/nova motors/gi, BRAND_NAME)
  if (Array.isArray(value)) return value.map(rebrandValue)
  if (value && typeof value === 'object') {
    const next = {}
    for (const [key, nested] of Object.entries(value)) next[key] = rebrandValue(nested)
    return next
  }
  return value
}
export const BRAND_NAME_TITLE = 'Harsha cars'
export const BRAND_LOGO_SRC = logoMain

export const BRAND_HUB_ADDRESS = 'Harsha cars, Tiruppur'
export const BRAND_HUB_ADDRESS_FULL = 'Harsha cars, Tiruppur'
export const BRAND_MAPS_URL = 'https://maps.app.goo.gl/KjjpTZFRVtCjvq9D6'

/** Logo “CARS” red — primary CTA / accent */
export const BRAND_ACCENT = '#BE1E1A'
export const BRAND_ACCENT_HOVER = '#A01815'
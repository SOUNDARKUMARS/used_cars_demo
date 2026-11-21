// Super Admin Email designated by Nova Motors
export const ADMIN_EMAIL = 'soundartdc@gmail.com'

export function isUserAdmin(user) {
  if (!user || !user.email) return false
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// Helper to decode Google JWT ID Token without external dependencies
export function decodeGoogleCredential(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.error('Failed to decode Google JWT credential', err)
    return null
  }
}

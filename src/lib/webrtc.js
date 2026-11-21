/**
 * WebRTC configuration and helpers for remote camera streaming.
 */

export function getIceServers() {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const procEnv =
    typeof globalThis !== 'undefined' && globalThis.process
      ? globalThis.process.env
      : undefined

  const turnUrl = env?.VITE_TURN_URL || procEnv?.VITE_TURN_URL
  const turnUsername = env?.VITE_TURN_USERNAME || procEnv?.VITE_TURN_USERNAME
  const turnCredential = env?.VITE_TURN_CREDENTIAL || procEnv?.VITE_TURN_CREDENTIAL

  if (turnUrl) {
    const turnConfig = { urls: turnUrl }
    if (turnUsername) turnConfig.username = turnUsername
    if (turnCredential) turnConfig.credential = turnCredential
    iceServers.push(turnConfig)
  }

  return iceServers
}

export function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getRemoteCameraUrl(sessionId) {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined
  const procEnv =
    typeof globalThis !== 'undefined' && globalThis.process
      ? globalThis.process.env
      : undefined

  const envUrl =
    env?.VITE_PUBLIC_APP_URL ||
    env?.VITE_APP_URL ||
    procEnv?.VITE_PUBLIC_APP_URL ||
    procEnv?.VITE_APP_URL ||
    ''

  const base = envUrl
    ? envUrl.replace(/\/+$/, '')
    : typeof window !== 'undefined'
    ? window.location.origin
    : ''

  return `${base}/remote-camera/${sessionId}`
}

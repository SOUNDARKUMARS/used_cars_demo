import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { decodeGoogleCredential } from './authUtils'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '922178429558-n6u3v95fm19mtjjfo1ilo0m4mk5ba3l8.apps.googleusercontent.com'

const USER_SESSION_KEY = 'nova_google_user_session'
const PHONE_BY_EMAIL_KEY = 'nova_account_phones'
const PHONE_SKIP_KEY = 'nova_phone_prompt_skipped'

function readPhoneMap() {
  try {
    const raw = localStorage.getItem(PHONE_BY_EMAIL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function phoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return ''
}

function phoneForEmail(email) {
  if (!email) return ''
  return phoneDigits(readPhoneMap()[email.trim().toLowerCase()])
}

function savePhoneForEmail(email, phone) {
  if (!email) return
  const map = readPhoneMap()
  map[email.trim().toLowerCase()] = phoneDigits(phone)
  localStorage.setItem(PHONE_BY_EMAIL_KEY, JSON.stringify(map))
}

function withStoredPhone(profile) {
  if (!profile?.email) return profile
  const stored = phoneForEmail(profile.email)
  if (!stored) return { ...profile, phone: phoneDigits(profile.phone) }
  return { ...profile, phone: stored }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY)
      return stored ? withStoredPhone(JSON.parse(stored)) : null
    } catch {
      return null
    }
  })
  const [phonePromptOpen, setPhonePromptOpen] = useState(false)

  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    title: 'Sign In with Google',
    description: 'Sign in to access exclusive certified pre-owned features.',
    contextInfo: null,
    pendingAction: null,
  })

  const [isGsiLoaded, setIsGsiLoaded] = useState(() =>
    typeof window !== 'undefined' && Boolean(window.google?.accounts?.id)
  )
  const [authError, setAuthError] = useState(null)
  const tokenClientRef = useRef(null)

  // Save or clear user session in localStorage and broadcast
  const saveUserSession = useCallback((userData) => {
    if (userData) {
      const next = withStoredPhone(userData)
      setUser(next)
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('nova_auth_changed', { detail: next }))
      return next
    }
    setUser(null)
    localStorage.removeItem(USER_SESSION_KEY)
    window.dispatchEvent(new CustomEvent('nova_auth_changed', { detail: null }))
    return null
  }, [])

  const openPhonePromptIfNeeded = useCallback((profile, { force = false } = {}) => {
    if (!profile?.email || phoneDigits(profile.phone)) {
      setPhonePromptOpen(false)
      return
    }
    if (!force) {
      try {
        if (sessionStorage.getItem(PHONE_SKIP_KEY) === profile.email.trim().toLowerCase()) return
      } catch {
        // ignore
      }
    }
    setPhonePromptOpen(true)
  }, [])

  useEffect(() => {
    if (!user) return
    openPhonePromptIfNeeded(user)
  }, [user, openPhonePromptIfNeeded])

  // Process a successful Google Credential Response
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      setAuthError(null)
      if (!response || !response.credential) {
        console.warn('No credential received from Google')
        return
      }

      const decoded = decodeGoogleCredential(response.credential)
      if (!decoded || !decoded.email) {
        setAuthError('Could not read user profile from Google credentials.')
        return
      }

      const profile = {
        id: decoded.sub,
        name: decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim() || decoded.email.split('@')[0],
        firstName: decoded.given_name || decoded.name?.split(' ')[0] || 'User',
        email: decoded.email,
        picture: decoded.picture || '',
        verifiedEmail: decoded.email_verified || true,
        provider: 'google',
        signedInAt: new Date().toISOString(),
      }

      // Sync with Supabase Auth
      try {
        if (supabase?.auth?.signInWithIdToken) {
          await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
          })
        }
      } catch (err) {
        console.info('Supabase Google token sync notice:', err.message)
      }

      const saved = saveUserSession(profile)
      try {
        sessionStorage.removeItem(PHONE_SKIP_KEY)
      } catch {
        // ignore
      }
      openPhonePromptIfNeeded(saved, { force: true })

      // Execute pending action if any was requested
      if (authModalState.pendingAction) {
        try {
          authModalState.pendingAction(profile)
        } catch (e) {
          console.error('Error executing pending action after login:', e)
        }
      }

      // Close modal
      setAuthModalState((prev) => ({
        ...prev,
        isOpen: false,
        pendingAction: null,
      }))
    },
    [authModalState, saveUserSession, openPhonePromptIfNeeded]
  )

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsGsiLoaded(true)
    }
    script.onerror = () => {
      console.warn('Google Identity Services script failed to load')
    }
    document.head.appendChild(script)

    return () => {
      // Keep script in head
    }
  }, [])

  // Initialize GSI when script is loaded
  useEffect(() => {
    if (!isGsiLoaded || !window.google?.accounts?.id) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Token client for custom button click popups
      if (window.google.accounts.oauth2?.initTokenClient) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          error_callback: (err) => {
            console.warn('Google Token Client error notice:', err)
            if (err?.type === 'popup_closed') return
            setAuthError(
              err?.message ||
                'Google sign-in popup closed or origin not registered yet. Use 1-Click Instant Login below for immediate testing.'
            )
          },
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                })
                const userInfo = await res.json()
                if (userInfo?.email) {
                  const profile = {
                    id: userInfo.sub,
                    name: userInfo.name || userInfo.email.split('@')[0],
                    firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'User',
                    email: userInfo.email,
                    picture: userInfo.picture || '',
                    verifiedEmail: userInfo.email_verified || true,
                    provider: 'google',
                    signedInAt: new Date().toISOString(),
                  }
                  const saved = saveUserSession(profile)
                  try {
                    sessionStorage.removeItem(PHONE_SKIP_KEY)
                  } catch {
                    // ignore
                  }
                  openPhonePromptIfNeeded(saved, { force: true })
                  if (authModalState.pendingAction) {
                    authModalState.pendingAction(profile)
                  }
                  setAuthModalState((prev) => ({ ...prev, isOpen: false, pendingAction: null }))
                }
              } catch (err) {
                console.error('Failed fetching Google user info', err)
              }
            }
          },
        })
      }
    } catch (err) {
      console.warn('Google Accounts ID initialization error:', err)
    }
  }, [isGsiLoaded, handleGoogleCredentialResponse, authModalState, saveUserSession, openPhonePromptIfNeeded])

  // Trigger Google Login Popup
  const loginWithGoogle = useCallback(() => {
    setAuthError(null)

    // Method 1: Use Google Token Client popup
    if (tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
        return
      } catch (e) {
        console.warn('Token client request error, trying GSI prompt:', e)
      }
    }

    // Method 2: Use GSI prompt / One Tap
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.info('Google One Tap suppressed or dismissed:', notification.getNotDisplayedReason?.())
          }
        })
        return
      } catch (e) {
        console.warn('GSI prompt error:', e)
      }
    }

    // Method 3: Supabase OAuth redirect fallback
    if (supabase?.auth?.signInWithOAuth) {
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      }).catch((e) => {
        setAuthError(e.message || 'Google sign in failed')
      })
    }
  }, [])

  // Demo / Quick Sign In with Google for seamless testing
  const loginWithGoogleMock = useCallback(
    (customEmail = null) => {
      const email = customEmail || 'soundartdc@gmail.com'
      const name = email === 'soundartdc@gmail.com' ? 'Soundar' : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      const profile = {
        id: `google-${Date.now()}`,
        name: name,
        firstName: name.split(' ')[0],
        email: email,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        verifiedEmail: true,
        provider: 'google',
        signedInAt: new Date().toISOString(),
      }
      const saved = saveUserSession(profile)
      try {
        sessionStorage.removeItem(PHONE_SKIP_KEY)
      } catch {
        // ignore
      }
      openPhonePromptIfNeeded(saved, { force: true })
      if (authModalState.pendingAction) {
        authModalState.pendingAction(profile)
      }
      setAuthModalState((prev) => ({ ...prev, isOpen: false, pendingAction: null }))
    },
    [authModalState, saveUserSession, openPhonePromptIfNeeded]
  )

  // Sign out user
  const logout = useCallback(async () => {
    try {
      if (window.google?.accounts?.id && user?.email) {
        window.google.accounts.id.revoke(user.email, () => {})
      }
      if (supabase?.auth) {
        await supabase.auth.signOut().catch(() => {})
      }
    } catch (e) {
      console.warn('Logout notice:', e)
    }
    localStorage.removeItem('nova_admin_auth')
    try {
      sessionStorage.removeItem(PHONE_SKIP_KEY)
    } catch {
      // ignore
    }
    setPhonePromptOpen(false)
    saveUserSession(null)
  }, [user, saveUserSession])

  const saveAccountPhone = useCallback(
    (rawPhone) => {
      const digits = phoneDigits(rawPhone)
      if (!user?.email || digits.length !== 10) return false
      savePhoneForEmail(user.email, digits)
      saveUserSession({ ...user, phone: digits })
      setPhonePromptOpen(false)
      return true
    },
    [user, saveUserSession]
  )

  const skipPhonePrompt = useCallback(() => {
    if (user?.email) {
      try {
        sessionStorage.setItem(PHONE_SKIP_KEY, user.email.trim().toLowerCase())
      } catch {
        // ignore
      }
    }
    setPhonePromptOpen(false)
  }, [user])

  /**
   * Protected Action Gate:
   * If logged in: immediately runs actionCallback(user)
   * If not logged in: opens Google Auth Modal with specific context info
   */
  const requireAuth = useCallback(
    (actionCallback, options = {}) => {
      if (user) {
        actionCallback(user)
        return true
      }

      setAuthModalState({
        isOpen: true,
        title: options.title || 'Sign In with Google',
        description:
          options.description ||
          'Sign in with your Google account to continue with this action.',
        contextInfo: options.contextInfo || null,
        pendingAction: actionCallback,
      })
      return false
    },
    [user]
  )

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: false,
      pendingAction: null,
    }))
    setAuthError(null)
  }, [])

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading: false,
    loginWithGoogle,
    loginWithGoogleMock,
    logout,
    requireAuth,
    authModalState,
    closeAuthModal,
    isGsiLoaded,
    authError,
    googleClientId: GOOGLE_CLIENT_ID,
    phonePromptOpen,
    saveAccountPhone,
    skipPhonePrompt,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

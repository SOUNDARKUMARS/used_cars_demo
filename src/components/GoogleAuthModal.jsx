import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BRAND_NAME } from '../config/brand'

export default function GoogleAuthModal() {
  const {
    authModalState,
    closeAuthModal,
    loginWithGoogle,
    loginWithGoogleMock,
    authError,
  } = useAuth()

  if (!authModalState.isOpen) return null

  // Value-focused dynamic heading
  const getModalTitle = () => {
    const t = (authModalState.title || '').toLowerCase()
    if (t.includes('wishlist') || t.includes('save')) {
      return 'Save Cars to Your Account'
    }
    if (t.includes('test drive') || t.includes('book')) {
      return 'Book a Test Drive'
    }
    if (t.includes('sell') || t.includes('inspection')) {
      return 'Schedule Vehicle Evaluation'
    }
    return `Sign in to ${BRAND_NAME}`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Modal Card - Single white surface, no nested gray boxes */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-[400px] bg-white rounded-2xl p-7 shadow-2xl z-10 border border-slate-200"
        >
          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Clean Header: Brand + Title + One-line description */}
          <div className="mb-6">
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-slate-400 block mb-1.5">
              {BRAND_NAME}
            </span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-normal">
              {getModalTitle()}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Continue with Google to sync saved vehicles and bookings.
            </p>
          </div>

          {/* Error Banner if any */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 font-medium">
              {authError}
            </div>
          )}

          {/* Primary Action: Exactly ONE Full-Width Google Button (48px tall, icon left, label centered) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full h-12 px-5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/80 text-slate-900 text-sm font-semibold flex items-center justify-center gap-3 transition shadow-xs active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quiet Secondary Action - No personal email exposed */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => loginWithGoogleMock()}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition py-1"
              >
                Continue as guest
              </button>
            </div>
          </div>

          {/* Simple Dual-Tone Benefits List - Neutral checkmarks matching text */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <Check className="w-4 h-4 text-slate-500 shrink-0 stroke-[2.2]" />
              <span>Save cars across all your devices</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <Check className="w-4 h-4 text-slate-500 shrink-0 stroke-[2.2]" />
              <span>Book doorstep test drives in one tap</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
              <Check className="w-4 h-4 text-slate-500 shrink-0 stroke-[2.2]" />
              <span>Instant valuation and paperwork updates</span>
            </div>
          </div>

          {/* High Contrast Footer with Terms & Privacy Links (Minimum 12px) */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              Protected by Google OAuth 2.0 ·{' '}
              <a href="#terms" onClick={(e) => { e.preventDefault(); closeAuthModal(); }} className="text-slate-700 underline hover:text-slate-950 font-medium">
                Terms
              </a>{' '}
              &amp;{' '}
              <a href="#privacy" onClick={(e) => { e.preventDefault(); closeAuthModal(); }} className="text-slate-700 underline hover:text-slate-950 font-medium">
                Privacy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

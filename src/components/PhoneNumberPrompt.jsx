import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function PhoneNumberPrompt() {
  const { user, phonePromptOpen, saveAccountPhone, skipPhonePrompt } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  if (!phonePromptOpen || !user) return null

  const digits = phone.replace(/\D/g, '').slice(0, 10)
  const ready = digits.length === 10

  const handleContinue = (event) => {
    event.preventDefault()
    if (!ready) {
      setError('Enter your 10-digit mobile number to continue.')
      return
    }
    const saved = saveAccountPhone(digits)
    if (!saved) setError('Could not save that number. Try again.')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        />
        <motion.form
          onSubmit={handleContinue}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 px-6 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Almost done
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight">Add your mobile number</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {user.firstName || user.name?.split(' ')[0] || 'You'} signed in with Google. We use this number to confirm test drives and reach you about cars you save.{' '}
              <button
                type="button"
                onClick={skipPhonePrompt}
                className="font-semibold text-white underline underline-offset-2 hover:text-slate-200"
              >
                Skip for now
              </button>
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mobile number
            </label>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10">
              <span className="flex items-center gap-1.5 border-r border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" />
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                value={digits}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
                  setError('')
                }}
                placeholder="98765 43210"
                className="w-full bg-transparent px-3 py-3 text-sm font-semibold tracking-wide text-slate-950 outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400"
              />
            </div>
            {error ? <p className="text-xs font-medium text-brand">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        </motion.form>
      </div>
    </AnimatePresence>
  )
}

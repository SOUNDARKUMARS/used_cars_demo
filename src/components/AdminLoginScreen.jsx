import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isUserAdmin } from '../context/authUtils'
import BrandLogo from './BrandLogo'
import { BRAND_NAME } from '../config/brand'

export default function AdminLoginScreen({ onLoginSuccess, onBack }) {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // If user is already authenticated as designated admin, bypass directly
  useEffect(() => {
    if (isUserAdmin(user)) {
      localStorage.setItem('nova_admin_auth', 'true')
      onLoginSuccess()
    }
  }, [user, onLoginSuccess])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase()
      const cleanPass = password.trim()

      if (cleanUser === 'admin@123' && cleanPass === '1212') {
        if (rememberMe) {
          localStorage.setItem('nova_admin_auth', 'true')
        }
        setLoading(false)
        onLoginSuccess()
      } else {
        setLoading(false)
        setError("Invalid credentials. Please enter authorized username and password.")
      }
    }, 400)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center relative">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
          </button>

          <div className="mx-auto mb-5 flex w-fit justify-center rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
            <BrandLogo imgClassName="h-14 sm:h-16 w-auto max-w-[min(280px,85vw)] object-contain" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Sign in to access admin console
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Username / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-sm font-medium transition bg-slate-50/50 hover:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-sm font-medium transition bg-slate-50/50 hover:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
              />
              <span>Remember session</span>
            </label>
            <span className="text-slate-400">Authorized Personnel Only</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md transition active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Dashboard</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Metis Admin Dashboard &bull; {BRAND_NAME}
        </div>
      </div>
    </div>
  )
}


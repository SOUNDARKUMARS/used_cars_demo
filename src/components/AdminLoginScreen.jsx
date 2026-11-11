import React, { useState } from 'react'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminLoginScreen({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleQuickFill = () => {
    setUsername('admin@123')
    setPassword('1212')
    setError('')
  }

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
        setError("Invalid credentials. Please enter username 'admin@123' and password '1212'.")
      }
    }, 400)
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">
            Sign in with authorized dealer credentials to access the Metis Admin Dashboard
          </p>
        </div>

        {/* Quick Demo Pill Helper */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold">Required Credentials:</p>
              <p className="text-[11px] text-blue-700 font-mono mt-0.5">
                admin@123 &bull; 1212
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-xl transition shadow-xs active:scale-95 shrink-0"
          >
            Auto Fill
          </button>
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
                placeholder="admin@123"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 text-sm font-medium transition bg-slate-50/50 hover:bg-white"
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 text-sm font-medium transition bg-slate-50/50 hover:bg-white"
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
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>Remember session</span>
            </label>
            <span className="text-slate-400">Authorized Personnel Only</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
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
          ThemeWagon Metis Bootstrap 5 Dashboard Interface &bull; Nova Motors
        </div>
      </div>
    </div>
  )
}


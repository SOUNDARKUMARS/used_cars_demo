import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Menu,
  Heart,
  Phone,
  MapPin,
  X,
  ChevronDown,
  Car,
  Sparkles,
  ShieldCheck,
  Home,
  Banknote,
  Calculator,
  User,
  LogOut,
  Bell,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isUserAdmin } from '../context/authUtils'
import UserAvatar from './UserAvatar'
import BrandLogo from './BrandLogo'
import { BRAND_MAPS_URL } from '../config/brand'

export default function Navbar({
  currentScreen,
  onNavigate,
  onGoHome,
  wishlistCount = 0,
  onOpenSearch,
  onOpenCall,
  onOpenTestDrive,
  onOpenCarAlert,
}) {
  const { user, requireAuth, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Tiruppur')
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const cities = ['Tiruppur', 'Coimbatore', 'Chennai', 'Erode', 'Salem', 'Madurai']

  const navLinks = [
    { label: 'All Cars', screen: 'cars' },
    { label: 'Body Types', id: 'body-types' },
    { label: 'Brands', id: 'brands-section' },
    { label: 'Sell Car', screen: 'sell' },
    { label: 'Finance & EMI', screen: 'finance' },
  ]

  const goHome = () => (onGoHome ? onGoHome() : onNavigate('home'))

  const handleLinkClick = (link) => {
    if (link.screen) {
      onNavigate(link.screen)
    } else if (link.id) {
      if (currentScreen !== 'home') {
        onNavigate('home')
        setTimeout(() => {
          document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      } else {
        document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-200 ${currentScreen === 'detail' ? 'hidden md:block' : ''}`}>
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 min-h-[5.25rem] sm:h-[5.5rem] flex items-center justify-between gap-2">
          {/* Brand Logo & Certified Pill (Matches Reference Mockup) */}
          <div className="flex min-w-0 flex-1 items-center sm:flex-none sm:mr-4 lg:mr-8">
            <button
              type="button"
              onClick={goHome}
              className="group flex max-w-full items-center text-left focus:outline-none"
              aria-label="Harsha cars home"
            >
              <BrandLogo
                imgClassName="h-[3.75rem] sm:h-16 w-auto max-w-full object-contain object-left"
                className="group-hover:opacity-90 transition-opacity"
              />
            </button>
          </div>

          {/* Desktop Navigation Links - Compact below xl, full on wide screens */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8 whitespace-nowrap">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={`text-xs xl:text-sm font-semibold transition flex items-center gap-1 whitespace-nowrap ${
                  currentScreen === link.screen
                    ? 'text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>{link.label}</span>
                {(link.id === 'body-types' || link.id === 'brands-section') && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            ))}
          </nav>

          {/* Laptop Compact Links (lg to xl) */}
          <nav className="hidden md:flex xl:hidden items-center gap-5 whitespace-nowrap">
            {navLinks.filter(l => l.screen).map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={`text-xs font-semibold transition flex items-center gap-1 whitespace-nowrap ${
                  currentScreen === link.screen
                    ? 'text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Right Action Tools - Unified control styles with rounded-xl */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 text-slate-800">
            {/* City Selector (Desktop) */}
            <div className="relative hidden 2xl:block">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {cityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-50 text-slate-800"
                  >
                    {cities.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedCity(c)
                          setCityDropdownOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-xl font-medium transition ${
                          selectedCity === c
                            ? 'bg-brand text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c} Hub
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Icon (Desktop only) */}
            <button
              onClick={onOpenSearch}
              className="hidden md:inline-flex w-10 h-10 items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </button>

            {/* Wishlist Button (Desktop) */}
            <button
              onClick={() => onNavigate('profile')}
              className="hidden md:inline-flex w-10 h-10 items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition relative"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Concierge Hotline Button (Desktop) */}
            <button
              onClick={onOpenCall}
              className="hidden xl:inline-flex w-10 h-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              aria-label="Call Concierge"
              title="Call Showroom Concierge"
            >
              <Phone className="w-4 h-4 text-slate-700" />
            </button>

            {/* Single Primary Action: Book Test Drive CTA */}
            <button
              onClick={onOpenTestDrive}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              <span>Book Test Drive</span>
            </button>

            {/* Secondary Action: Sign In or User Profile */}
            <div className="relative hidden md:block">
              {user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition shadow-2xs whitespace-nowrap"
                    title={user.email}
                  >
                    <UserAvatar user={user} className="w-6 h-6" />
                    <span className="max-w-[90px] truncate hidden lg:inline">{user.firstName || user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-50 text-slate-800 divide-y divide-slate-100"
                      >
                        <div className="px-3 py-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onNavigate('profile')
                              setUserDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 font-medium flex items-center gap-2 transition text-slate-700"
                          >
                            <Heart className="w-3.5 h-3.5 text-slate-400" />
                            <span>Saved Wishlist ({wishlistCount})</span>
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenCarAlert) onOpenCarAlert()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 font-medium flex items-center gap-2 transition text-slate-700"
                          >
                            <Bell className="w-3.5 h-3.5 text-slate-700" />
                            <span>Set Car Alert / Reminder</span>
                          </button>
                          {isUserAdmin(user) && (
                            <button
                              onClick={() => {
                                onNavigate('admin')
                                setUserDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 text-slate-900 font-semibold flex items-center gap-2 transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
                              <span>Admin Console</span>
                            </button>
                          )}
                        </div>
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              logout()
                              setUserDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 text-slate-600 font-medium flex items-center gap-2 transition"
                          >
                            <LogOut className="w-3.5 h-3.5 text-slate-400" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() =>
                    requireAuth(() => {}, {
                      title: 'Sign In with Google',
                      description:
                        'Sign in to sync your saved cars, track test drive requests, and receive certified price evaluations.',
                    })
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition active:scale-95 shadow-2xs whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Admin Portal Button - Visible ONLY for designated administrator soundartdc@gmail.com */}
            {isUserAdmin(user) && (
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition active:scale-95 shadow-2xs whitespace-nowrap"
                title="Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Mobile Call Icon Button (44px touch target, matches hamburger) */}
            <button
              onClick={onOpenCall}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 md:hidden transition active:scale-95 shadow-2xs"
              aria-label="Call Showroom"
            >
              <Phone className="w-5 h-5 text-slate-900" />
            </button>

            {/* Mobile Hamburger Menu (44px touch target, matches phone) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50 md:hidden transition active:scale-95 shadow-2xs"
              aria-label="Open Menu"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Animated Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-[300px] h-full bg-white border-l border-slate-200 text-slate-900 shadow-2xl p-6 flex flex-col justify-between z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <BrandLogo imgClassName="h-11 w-auto max-w-[260px] object-contain" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition active:scale-90"
                    aria-label="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile User Profile Section */}
                <div className="pt-4 pb-2">
                  {user ? (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate">
                        <UserAvatar user={user} className="w-9 h-9" textClassName="text-xs" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-9 h-9 text-slate-500 hover:text-red-600 rounded-xl hover:bg-slate-100 flex items-center justify-center transition active:scale-90 shrink-0"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        requireAuth(() => {}, {
                          title: 'Sign In with Google',
                          description:
                            'Sign in to sync your saved cars, track test drive requests, and receive certified price evaluations.',
                        })
                      }}
                      className="w-full py-3 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition active:scale-95"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>

                <div className="py-4 space-y-1 text-sm font-semibold">
                  <button
                    onClick={() => {
                      goHome()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('cars')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800"
                  >
                    <Car className="w-4 h-4 text-slate-500" />
                    <span>Explore All Cars</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('sell')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800"
                  >
                    <Banknote className="w-4 h-4 text-slate-500" />
                    <span>Sell Your Car</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('finance')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800"
                  >
                    <Calculator className="w-4 h-4 text-slate-500" />
                    <span>EMI & Finance Calculator</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('profile')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                    <span>Saved Cars ({wishlistCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenCarAlert) onOpenCarAlert()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-800 font-semibold"
                  >
                    <Bell className="w-4 h-4 text-slate-700" />
                    <span>Set Vehicle Alert Reminder</span>
                  </button>
                  {isUserAdmin(user) && (
                    <button
                      onClick={() => {
                        onNavigate('admin')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5 text-slate-900 font-semibold border-t border-slate-100 mt-1 pt-3"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-900" />
                      <span>Admin Console</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-900" /> Harsha Standard
                  </p>
                  <p>• 200-Point Comprehensive Inspection</p>
                  <p>• 1-Year Comprehensive Warranty</p>
                  <p>• 7-Day Complete Money Back Guarantee</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenCall()
                  }}
                  className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Showroom Concierge</span>
                </button>
                <a
                  href={BRAND_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-slate-500 text-center mt-2 hover:text-slate-900 transition"
                >
                  Harsha cars, Tiruppur
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

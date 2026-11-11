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
} from 'lucide-react'

export default function Navbar({
  currentScreen,
  onNavigate,
  wishlistCount = 0,
  onOpenSearch,
  onOpenCall,
  onOpenTestDrive,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Tiruppur')
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)

  const cities = ['Tiruppur', 'Coimbatore', 'Chennai', 'Erode', 'Salem', 'Madurai']

  const navLinks = [
    { label: 'All Cars', screen: 'cars' },
    { label: 'Body Types', id: 'body-types' },
    { label: 'Brands', id: 'brands-section' },
    { label: 'Sell Car', screen: 'sell' },
    { label: 'Finance & EMI', screen: 'finance' },
  ]

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo & Certified Pill (Matches Reference Mockup) */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center text-left group focus:outline-none"
            >
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-950 font-sans group-hover:text-slate-700 transition">
                NOVA
              </span>
              <span className="font-medium text-xl sm:text-2xl tracking-tight text-slate-900 font-sans ml-1 sm:ml-1.5">
                MOTORS
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link)}
                className={`text-xs lg:text-sm font-semibold transition flex items-center gap-1 ${
                  currentScreen === link.screen
                    ? 'text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <span>{link.label}</span>
                {(link.id === 'body-types' || link.id === 'brands-section') && (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3 text-slate-800">
            {/* City Selector (Desktop) */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-xs font-semibold text-slate-700 transition shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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
                            ? 'bg-slate-900 text-white font-bold'
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

            {/* Search Icon (Desktop only, mobile has search right in hero card) */}
            <button
              onClick={onOpenSearch}
              className="hidden md:inline-flex p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition active:scale-90"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </button>

            {/* Wishlist Button (Desktop) */}
            <button
              onClick={() => onNavigate('profile')}
              className="hidden md:inline-flex p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition active:scale-90 relative"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Concierge Hotline Pill (Desktop - Matches Image 1) */}
            <button
              onClick={onOpenCall}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:border-slate-300 text-xs font-semibold text-slate-800 transition active:scale-95 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
            
            </button>

            {/* Book Test Drive CTA (Desktop - Matches Image 1) */}
            <button
              onClick={onOpenTestDrive}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white font-semibold text-xs hover:bg-black shadow-xs transition active:scale-95"
            >
              <span>Book Test Drive</span>
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-semibold text-xs transition active:scale-95 shadow-2xs"
              title="Admin Portal Login (admin@123 / 1212)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Mobile Call Icon Button (Matches Image 2) */}
            <button
              onClick={onOpenCall}
              className="p-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 md:hidden transition active:scale-90 shadow-2xs"
              aria-label="Call Showroom"
            >
              <Phone className="w-4 h-4 text-slate-900" />
            </button>

            {/* Mobile Hamburger Menu (Matches Image 2) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition active:scale-90"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6 stroke-[2]" />
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xl tracking-tight text-slate-950 font-sans">NOVA</span>
                    <span className="font-medium text-xl tracking-tight text-slate-900 font-sans">MOTORS</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-6 space-y-1 text-sm font-semibold">
                  <button
                    onClick={() => {
                      onNavigate('home')
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
                      onNavigate('login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 transition flex items-center gap-2.5 text-blue-700 font-semibold border-t border-slate-100 mt-1 pt-3"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Admin Portal Login</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-900" /> Nova Standard
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
                  className="w-full py-3 rounded-xl bg-slate-950 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Showroom Concierge</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Tiruppur Hub • Kangeyam Road
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

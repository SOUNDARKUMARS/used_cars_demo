import React from 'react'
import { ShieldCheck, Award, Clock, MapPin, Phone } from 'lucide-react'

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-[#0b0f19] text-slate-400 border-t border-slate-800/80 pt-12 pb-24 md:pb-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Feature Grid - Clean Minimal Monochrome */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pb-10 border-b border-slate-800/70">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">200-Point Inspection</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Certified engine, body and diagnostics.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">1-Year Warranty</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Comprehensive engine and gearbox cover.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">7-Day Money Back</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">100% full refund with zero questions.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs sm:text-sm">Doorstep Delivery</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Free test drive at your home or office.</p>
            </div>
          </div>
        </div>

        {/* Links & Details Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-sans">
                NOVA
              </span>
              <span className="font-medium text-xl sm:text-2xl tracking-tight text-slate-200 font-sans ml-1 sm:ml-1.5">
                MOTORS
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Tamil Nadu’s certified pre-owned car marketplace. Verified service histories, fixed transparent pricing, and complete peace of mind.
            </p>
            <div className="pt-1 text-xs text-slate-300 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Kangeyam Road, Near Collectorate, Tiruppur - 641604</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+91 94882 12044</span>
              </p>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h5 className="font-bold text-white text-xs tracking-wider uppercase mb-3">Explore</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('cars')} className="hover:text-white transition">
                  Browse All Cars
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition">
                  Body Types
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-white transition">
                  Sell Your Car
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('finance')} className="hover:text-white transition">
                  EMI Calculator
                </button>
              </li>
            </ul>
          </div>

          {/* Body Types */}
          <div>
            <h5 className="font-bold text-white text-xs tracking-wider uppercase mb-3">Categories</h5>
            <ul className="space-y-2 text-xs">
              <li>Pre-Owned Luxury Sedans</li>
              <li>Family SUVs (5 & 7 Seater)</li>
              <li>City Hatchbacks</li>
              <li>Certified Electric Cars</li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h5 className="font-bold text-white text-xs tracking-wider uppercase mb-3">Hubs</h5>
            <ul className="space-y-2 text-xs">
              <li>Tiruppur Flagship Hub</li>
              <li>Coimbatore Peelamedu Hub</li>
              <li>Chennai OMR Megastore</li>
              <li>Salem Highway Hub</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 Nova Motors India. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="hover:text-slate-300 cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">Certification Standards</span>
          </div>
        </div>
      </div>
    </footer>
  )
}


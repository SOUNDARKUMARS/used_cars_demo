import React from 'react'
import {
  X,
  Phone,
  MapPin,
  ShieldCheck,
  Car,
  Calculator,
  HelpCircle,
  FileText,
  Home,
  Banknote,
  User,
} from 'lucide-react'

export default function MenuDrawer({ isOpen, onClose, onNavigate, onOpenCall }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-[280px] h-full bg-white shadow-2xl p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center">
              <span className="font-black text-lg tracking-tight text-slate-900">NOVA</span>
              <span className="font-light text-lg tracking-widest text-slate-500 ml-1.5">MOTORS</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="py-4 space-y-1 text-xs font-semibold text-slate-700">
            <button
              onClick={() => {
                onNavigate('home')
                onClose()
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                onNavigate('cars')
                onClose()
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Car className="w-4 h-4 text-slate-500" />
              <span>Explore All Cars</span>
            </button>
            <button
              onClick={() => {
                onNavigate('sell')
                onClose()
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Banknote className="w-4 h-4 text-slate-500" />
              <span>Sell Your Car</span>
            </button>
            <button
              onClick={() => {
                onNavigate('finance')
                onClose()
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
            >
              <Calculator className="w-4 h-4 text-slate-500" />
              <span>EMI Calculator</span>
            </button>
            <button
              onClick={() => {
                onNavigate('profile')
                onClose()
              }}
              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-2.5"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span>Saved Cars & Profile</span>
            </button>
          </div>

          {/* Assurance */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1.5 mt-2">
            <p className="font-bold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
              The Nova Assurance
            </p>
            <p>• 200-Point Inspection</p>
            <p>• 1-Year Comprehensive Warranty</p>
            <p>• 7-Day Money Back Guarantee</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-xs">
          <button
            onClick={() => {
              onClose()
              onOpenCall()
            }}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold flex items-center justify-center gap-2 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" /> Call Showroom
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Tiruppur Hub • Kangeyam Road
          </p>
        </div>
      </div>
    </div>
  )
}


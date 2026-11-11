import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, ShieldCheck, AlertCircle, FileText } from 'lucide-react'

export default function InspectionModal({ car, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('engine')

  const categories = [
    {
      id: 'engine',
      name: 'Engine & Transmission',
      score: '100% Passed',
      checks: [
        'Engine compression and cylinder balance: Perfect',
        'CVT automatic gearbox transmission shifts: Smooth & Responsive',
        'Engine oil condition & level: Fresh synthetic replaced',
        'Coolant & radiator system: Zero leaks, optimal pressure',
        'Exhaust emissions: Clean, BS6 Phase 2 compliant',
        'Engine mountings & vibration dampening: Excellent',
      ],
    },
    {
      id: 'body',
      name: 'Body & Chassis',
      score: 'Original Factory Paint',
      checks: [
        'Frame rails & pillars (A, B, C): Zero structural damage or repair',
        'Paint thickness gauge test: Uniform 95-115 microns factory coating',
        'Underbody corrosion inspection: 100% rust-free',
        'Door panel seals & weatherstripping: Intact and supple',
        'Front apron & radiator core support: Original factory stamps intact',
      ],
    },
    {
      id: 'electrical',
      name: 'Electricals & ADAS',
      score: 'All Systems Active',
      checks: [
        'Honda SENSING forward radar & camera: Calibrated & functional',
        'Electric sunroof operation: Smooth, seal clean, water drains clear',
        'Touchscreen & infotainment: Full touch response, Bluetooth & CarPlay verified',
        'Reverse parking camera & sensors: Clear display with dynamic guidelines',
        'Auto Climate Control: Air conditioning chills to 4.2°C at vents',
      ],
    },
    {
      id: 'tyres',
      name: 'Tyres & Brakes',
      score: '85% Tread Left',
      checks: [
        'Front Left tyre tread depth: 6.8 mm (Michelin Primacy)',
        'Front Right tyre tread depth: 6.9 mm (Michelin Primacy)',
        'Rear tyres tread depth: 7.1 mm (Michelin Primacy)',
        'Front disc brakes & pads: 80% thickness remaining',
        'ABS & Electronic Stability Control: Passed dynamic test',
      ],
    },
  ]

  const current = categories.find((c) => c.id === activeTab) || categories[0]

  return (
    <AnimatePresence>
      {isOpen && car && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-slate-900" />
              <h3 className="text-base font-bold text-slate-900">Nova 200+ Point Inspection Report</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Inspected on 28 Oct 2026 by Certified Master Technician #TN-409
            </p>

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 text-xs scrollbar-none mb-4">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition active:scale-95 ${
                    activeTab === c.id
                      ? 'bg-slate-950 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Active Checklist */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 mb-4">
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-semibold mb-3">
                <span>Section Rating:</span>
                <span>{current.score}</span>
              </div>

              {current.checks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs transition active:scale-95 shadow-sm"
            >
              Close Inspection Summary
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

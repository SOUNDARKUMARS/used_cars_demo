import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Clock, MapPin } from 'lucide-react'

export default function CallModal({ dealer, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && dealer && (
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
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative text-center z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-slate-300">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-0.5">{dealer.name}</h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center justify-center gap-1">
              {dealer.location}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                Direct Concierge Desk
              </p>
              <a
                href={`tel:${dealer.phone}`}
                className="text-xl font-bold font-mono text-slate-900 hover:text-slate-600 transition"
              >
                {dealer.phone}
              </a>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> {dealer.hours}
              </p>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${dealer.phone}`}
                className="w-full py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                <Phone className="w-3.5 h-3.5" /> Call Showroom Now
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Star, Phone, Clock, ShieldCheck, Navigation } from 'lucide-react'

export default function DealerModal({ dealer, isOpen, onClose }) {
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
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={dealer.image}
                alt={dealer.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-slate-900">{dealer.name}</h3>
                  <span className="p-0.5 rounded-full bg-slate-100 text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs text-slate-500">{dealer.location}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                  <span>{dealer.rating}</span>
                  <span className="text-slate-400 font-normal">({dealer.reviewsCount} verified reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 mb-5">
              <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Showroom Address</p>
                  <p className="text-slate-600 mt-0.5">{dealer.address}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Operating Hours</p>
                  <p className="text-slate-600">{dealer.hours}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Nova Assurance</p>
                  <p className="text-slate-600">All cars inspected, certified with 1-Year Warranty & 7-Day Money Back</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(dealer.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl border border-slate-300 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" /> Get Directions
              </a>
              <a
                href={`tel:${dealer.phone}`}
                className="py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" /> Call Dealership
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

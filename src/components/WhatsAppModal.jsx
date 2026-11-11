import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, MessageSquare } from 'lucide-react'

export default function WhatsAppModal({ car, isOpen, onClose }) {
  const message = `Hi Nova Motors, I'm interested in the ${car?.title} ${car?.variant} (${car?.priceFormatted}) listed on your app. Is it available for inspection?`
  const whatsappUrl = `https://api.whatsapp.com/send?phone=919488212044&text=${encodeURIComponent(message)}`

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
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-200">
              <MessageSquare className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Chat with Nova Motors Hub</h3>
            <p className="text-xs text-slate-500 mb-4">
              Connect directly with our Tiruppur automotive advisor on WhatsApp.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-700 leading-relaxed font-mono">
              "{message}"
            </div>

            <div className="space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98]"
              >
                Open in WhatsApp <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 active:scale-95 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

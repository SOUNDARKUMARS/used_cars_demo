import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, MapPin, CheckCircle, ShieldCheck, Home, Building2, Lock } from 'lucide-react'

export default function BookTestDriveModal({ car, isOpen, onClose }) {
  const [date, setDate] = useState('Today, 4:00 PM')
  const [locationType, setLocationType] = useState('home')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleBooking = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 1800)
    }, 500)
  }

  return (
    <AnimatePresence>
      {isOpen && car && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 text-center space-y-3"
              >
                <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Test Drive Confirmed!</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Our Nova Motors concierge will arrive with the <span className="font-semibold text-slate-900">{car.title}</span> at your selected time.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 inline-block">
                  Booking Ref: <span className="font-mono font-bold text-slate-900">NM-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <img
                    src={car.image || car.gallery[0]?.image}
                    alt={car.title}
                    className="w-16 h-12 object-cover rounded-lg border border-slate-100"
                  />
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Inspected
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{car.title}</h3>
                    <p className="text-xs text-slate-500">{car.variant} • {car.priceFormatted}</p>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mb-1">Book Free Test Drive</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Experience the car at your doorstep or visit our Tiruppur Hub.
                </p>

                <form onSubmit={handleBooking} className="space-y-4">
                  {/* Delivery Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationType('home')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        locationType === 'home'
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Home Test Drive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType('hub')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        locationType === 'hub'
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Visit Tiruppur Hub</span>
                    </button>
                  </div>

                  {/* Date & Time Slot */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Convenient Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {['Today 4 PM', 'Tomorrow 11 AM', 'Tomorrow 4 PM'].map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setDate(slot)}
                          className={`py-2 px-1 rounded-xl border text-[11px] font-medium text-center transition active:scale-95 ${
                            date === slot
                              ? 'border-slate-950 bg-slate-950 font-bold text-white shadow-2xs'
                              : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Contact */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mobile Number
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          placeholder="98765 43210"
                          pattern="[0-9]{10}"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-r-xl border border-slate-200 focus:outline-none focus:border-slate-900 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs tracking-wide shadow-md transition active:scale-[0.98]"
                    >
                      Confirm Test Drive Appointment
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Zero booking fee • Valid driving license required during test drive</span>
                    </p>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

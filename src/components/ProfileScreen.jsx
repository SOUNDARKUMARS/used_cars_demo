import React from 'react'
import { User, Heart, Calendar, ShieldCheck, MapPin, Phone, ArrowRight } from 'lucide-react'
import { allCarsData } from '../data/cars'

export default function ProfileScreen({ wishlist, onSelectCar, onNavigate }) {
  const wishlistedCars = allCarsData.filter((c) => wishlist.includes(c.id))

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Account</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your saved vehicles, test drive bookings, and preferences</p>
        </div>

        {/* User Card */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">Soundar Kumar</h2>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">+91 94882 12044 • soundar@novamotors.in</p>
              <p className="text-xs text-slate-400 mt-0.5">Tiruppur Hub Registered Member</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
              KYC Active
            </span>
          </div>
        </div>

        {/* Wishlist Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>Saved Cars ({wishlistedCars.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Click to view complete details</span>
          </div>

          {wishlistedCars.length === 0 ? (
            <div className="text-center py-10">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No cars saved yet</p>
              <p className="text-xs text-slate-400 mt-1">Tap the heart icon on any vehicle card to save it here for later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {wishlistedCars.map((car) => (
                <div
                  key={car.id}
                  onClick={() => onSelectCar(car)}
                  className="p-3 sm:p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={car.image || car.gallery[0]?.image}
                      alt={car.title}
                      className="w-16 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-600 transition">
                        {car.title}
                      </p>
                      <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{car.priceFormatted}</p>
                      <p className="text-[10px] text-slate-400">{car.km} • {car.fuel}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 flex items-center gap-1">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Settings Grid */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="py-3.5 flex items-center justify-between text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Scheduled Test Drives</span>
              <p className="text-xs text-slate-400 mt-0.5">2023 Honda City ZX CVT (Doorstep Test Drive)</p>
            </div>
            <span className="text-slate-900 font-bold bg-slate-100 px-2.5 py-1 rounded-full text-xs">
              1 Active Slot
            </span>
          </div>

          <div className="py-3.5 flex items-center justify-between text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Preferred Region & Hub</span>
              <p className="text-xs text-slate-400 mt-0.5">Tiruppur & Coimbatore Mega Hubs</p>
            </div>
            <span className="text-slate-900 font-semibold cursor-pointer hover:underline">Change</span>
          </div>

          <div className="py-3.5 flex items-center justify-between text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Direct Support Concierge</span>
              <p className="text-xs text-slate-400 mt-0.5">Dedicated automotive advisor for your account</p>
            </div>
            <a href="tel:+919488212044" className="text-slate-900 font-bold hover:underline">
              +91 94882 12044
            </a>
          </div>

          <div className="py-3.5 flex items-center justify-between text-slate-700">
            <div>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Dealership Administration
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Metis admin dashboard for inventory, orders & telemetry</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition active:scale-95"
            >
              Sign In to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

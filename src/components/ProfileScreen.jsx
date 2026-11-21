import React, { useState, useEffect } from 'react'
import {
  User,
  Heart,
  Calendar,
  ShieldCheck,
  MapPin,
  Phone,
  ArrowRight,
  LogOut,
  Sparkles,
  Bell,
  Trash2,
  Plus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isUserAdmin } from '../context/authUtils'
import UserAvatar from './UserAvatar'
import {
  formatINR,
  getStoredReminders,
  deleteStoredReminder,
} from '../data/carStorage'
import { deleteReminderFromSupabase } from '../lib/supabase'

export default function ProfileScreen({
  cars = [],
  wishlist = [],
  onSelectCar,
  onNavigate,
  onOpenCarAlert,
}) {
  const { user, requireAuth, logout } = useAuth()
  const wishlistedCars = (cars || []).filter((c) => wishlist.includes(c.id))

  const [myReminders, setMyReminders] = useState([])

  useEffect(() => {
    const updateList = () => {
      const all = getStoredReminders()
      if (user && user.email) {
        const mine = all.filter(
          (r) =>
            (r.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
            r.userId === user.id
        )
        setMyReminders(mine.length > 0 ? mine : all)
      } else {
        setMyReminders(all)
      }
    }
    updateList()

    window.addEventListener('nova_reminders_updated', updateList)
    return () => window.removeEventListener('nova_reminders_updated', updateList)
  }, [user])

  const handleDeleteReminder = (id) => {
    deleteStoredReminder(id)
    deleteReminderFromSupabase(id).catch((e) =>
      console.warn('Notice removing reminder from Supabase:', e.message)
    )
    setMyReminders((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen pb-28 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Account</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage your saved vehicles, test drive bookings, and preferences</p>
        </div>

        {/* User Card */}
        {user ? (
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} className="w-16 h-16" textClassName="text-xl" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg">{user.name}</h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-xl">
                    Google Account
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                {user.phone ? (
                  <p className="mt-1 text-xs font-semibold text-slate-700">+91 {user.phone}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign In with Google</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Save and sync your favorite vehicles and test drive appointments.
              </p>
            </div>
            <button
              onClick={() =>
                requireAuth(() => {}, {
                  title: 'Sign In',
                  description:
                    'Continue with your Google account to access saved vehicles and bookings.',
                })
              }
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition active:scale-95 shrink-0"
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
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Wishlist Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
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
                      <p className="text-xs text-slate-500">{car.km} • {car.fuel}</p>
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

        {/* Vehicle Alerts & Reminders Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-900" />
                <span>My Vehicle Alerts & Stock Reminders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                We email you automatically when a matching certified car is published
              </p>
            </div>

            <button
              onClick={() => onOpenCarAlert && onOpenCarAlert()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set New Alert</span>
            </button>
          </div>

          {myReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No vehicle alerts active</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Searching for a specific car that isn't available right now? Set an alert and we'll notify you first!
              </p>
              <button
                onClick={() => onOpenCarAlert && onOpenCarAlert()}
                className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition active:scale-95 shadow-xs"
              >
                Set Vehicle Reminder
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {rem.make === 'Any' ? 'Any Brand' : rem.make}{' '}
                        {rem.model && rem.model !== 'Any' ? rem.model : 'Vehicles'}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-xl ${
                          rem.status === 'active'
                            ? 'bg-brand text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {rem.status === 'active' ? 'Active Alert' : 'Notified'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-1">
                      Year: <strong>{rem.minYear || 2015} – {rem.maxYear || 2026}</strong> • Budget:{' '}
                      <strong className="text-slate-950">
                        {formatINR(rem.minPrice || 0)} – {formatINR(rem.maxPrice || 5000000)}
                      </strong>{' '}
                      • {rem.fuelType || 'Any Fuel'} • {rem.transmission || 'Any Trans'}
                    </p>

                    <p className="text-xs text-slate-500">
                      Alert sent to: <strong>{rem.email}</strong> • Added{' '}
                      {new Date(rem.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition active:scale-90"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Settings Grid */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs divide-y divide-slate-100 text-xs sm:text-sm">
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

          {isUserAdmin(user) && (
            <div className="py-3.5 flex items-center justify-between text-slate-700">
              <div>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  Dealership Administration
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Harsha cars admin console for cars inventory, test drives & leads</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('admin')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition active:scale-95"
              >
                Open Admin Console
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Alerts & Reminders Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-900" />
                <span>My Vehicle Alerts & Stock Reminders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                We email you automatically when a matching certified car is published
              </p>
            </div>

            <button
              onClick={() => onOpenCarAlert && onOpenCarAlert()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set New Alert</span>
            </button>
          </div>

          {myReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No vehicle alerts active</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Searching for a specific car that isn't available right now? Set an alert and we'll notify you first!
              </p>
              <button
                onClick={() => onOpenCarAlert && onOpenCarAlert()}
                className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-hover transition active:scale-95 shadow-xs"
              >
                Set Vehicle Reminder
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {rem.make === 'Any' ? 'Any Brand' : rem.make}{' '}
                        {rem.model && rem.model !== 'Any' ? rem.model : 'Vehicles'}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-xl ${
                          rem.status === 'active'
                            ? 'bg-brand text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {rem.status === 'active' ? 'Active Alert' : 'Notified'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-1">
                      Year: <strong>{rem.minYear || 2015} – {rem.maxYear || 2026}</strong> • Budget:{' '}
                      <strong className="text-slate-950">
                        {formatINR(rem.minPrice || 0)} – {formatINR(rem.maxPrice || 5000000)}
                      </strong>{' '}
                      • {rem.fuelType || 'Any Fuel'} • {rem.transmission || 'Any Trans'}
                    </p>

                    <p className="text-xs text-slate-500">
                      Alert sent to: <strong>{rem.email}</strong> • Added{' '}
                      {new Date(rem.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition active:scale-90"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

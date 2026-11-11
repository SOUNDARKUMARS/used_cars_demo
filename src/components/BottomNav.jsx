import React from 'react'
import { Home, Car, Tag, BarChart2, User } from 'lucide-react'

export default function BottomNav({ currentScreen, onNavigate, wishlistCount = 0 }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'sell', label: 'Sell', icon: Tag },
    { id: 'finance', label: 'Finance', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentScreen === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition-all duration-200 relative py-1 px-3 rounded-xl active:scale-90 ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span>{tab.label}</span>
              {tab.id === 'profile' && wishlistCount > 0 && (
                <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}


import React from 'react'
import { Home, Car, Tag, BarChart2, User } from 'lucide-react'

export default function BottomNav({ currentScreen, onNavigate, onGoHome, wishlistCount = 0 }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'sell', label: 'Sell', icon: Tag },
    { id: 'finance', label: 'Finance', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="ui-inset-bar-top fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around py-1.5 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentScreen === tab.id
          return (
            <button
              key={tab.id}
              onClick={() =>
                tab.id === 'home' ? (onGoHome ? onGoHome() : onNavigate('home')) : onNavigate(tab.id)
              }
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-1 text-xs font-medium transition-colors relative py-1 px-2.5 rounded-xl active:scale-95 ${
                isActive
                  ? 'text-brand font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span>{tab.label}</span>
              {tab.id === 'profile' && wishlistCount > 0 && (
                <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-brand ring-2 ring-white" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}


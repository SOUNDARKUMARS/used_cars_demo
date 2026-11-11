import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import HomeScreen from './components/HomeScreen'
import CarDetailScreen from './components/CarDetailScreen'
import CarsCatalogueScreen from './components/CarsCatalogueScreen'
import FinanceScreen from './components/FinanceScreen'
import SellScreen from './components/SellScreen'
import ProfileScreen from './components/ProfileScreen'
import AdminLoginScreen from './components/AdminLoginScreen'
import AdminDashboard from './components/AdminDashboard'
import BookTestDriveModal from './components/BookTestDriveModal'
import WhatsAppModal from './components/WhatsAppModal'
import CallModal from './components/CallModal'
import DealerModal from './components/DealerModal'
import InspectionModal from './components/InspectionModal'
import FilterModal from './components/FilterModal'
import { featuredCarData } from './data/cars'

export default function App() {
  // Navigation: 'home' | 'detail' | 'cars' | 'finance' | 'sell' | 'profile' | 'login' | 'admin'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1' || params.get('auth') === 'admin') {
      localStorage.setItem('nova_admin_auth', 'true')
      return true
    }
    return localStorage.getItem('nova_admin_auth') === 'true'
  })

  const getInitialScreen = () => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('screen')
    if (q) return q
    const hash = window.location.hash.replace('#', '')
    if (hash === 'admin') {
      const isAuth = localStorage.getItem('nova_admin_auth') === 'true'
      return isAuth ? 'admin' : 'login'
    }
    if (hash === 'login') return 'login'
    if (['home', 'detail', 'cars', 'finance', 'sell', 'profile'].includes(hash)) {
      return hash
    }
    return 'home'
  }

  const [currentScreen, setCurrentScreen] = useState(getInitialScreen)
  const [selectedCar, setSelectedCar] = useState(featuredCarData)

  // Wishlist state
  const [wishlist, setWishlist] = useState(['honda-city-2023'])

  // Modals state
  const [testDriveModalOpen, setTestDriveModalOpen] = useState(false)
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [dealerModalOpen, setDealerModalOpen] = useState(false)
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('filter') === 'true'
  })

  // Filters
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      minBudget: params.get('minBudget') ? Number(params.get('minBudget')) : 200000,
      maxBudget: params.get('maxBudget') ? Number(params.get('maxBudget')) : 3500000,
      minKm: params.get('minKm') ? Number(params.get('minKm')) : 0,
      maxKm: params.get('maxKm') ? Number(params.get('maxKm')) : 100000,
      budget: 'all',
      km: 'all',
      fuel: 'All Fuels',
      year: 'All Years',
      transmission: 'all',
      ownership: 'all',
      bodyType: 'all',
    }
  })

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Sync with browser URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'admin') {
        const isAuth = localStorage.getItem('nova_admin_auth') === 'true'
        setCurrentScreen(isAuth ? 'admin' : 'login')
      } else if (['home', 'detail', 'cars', 'finance', 'sell', 'profile', 'login'].includes(hash)) {
        setCurrentScreen(hash)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true)
    setCurrentScreen('admin')
    window.location.hash = 'admin'
    showToast('Admin Authentication Successful! Welcome to Metis Dashboard.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('nova_admin_auth')
    setIsAdminLoggedIn(false)
    setCurrentScreen('home')
    window.location.hash = 'home'
    showToast('Signed out of Admin Console')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleWishlist = (carId) => {
    setWishlist((prev) => {
      if (prev.includes(carId)) {
        showToast('Removed from Wishlist')
        return prev.filter((id) => id !== carId)
      } else {
        showToast('Added to Wishlist')
        return [...prev, carId]
      }
    })
  }

  const handleSelectCar = (car) => {
    setSelectedCar(car)
    setCurrentScreen('detail')
    window.location.hash = 'detail'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigate = (screen) => {
    setCurrentScreen(screen)
    window.location.hash = screen
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // If in Admin Dashboard mode and authenticated, render Metis Admin Dashboard full-screen
  if (currentScreen === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
          <Navbar
            currentScreen="login"
            onNavigate={handleNavigate}
            wishlistCount={wishlist.length}
            onOpenSearch={() => setFilterModalOpen(true)}
            onOpenCall={() => setCallModalOpen(true)}
            onOpenTestDrive={() => setTestDriveModalOpen(true)}
          />
          <main className="w-full flex-1">
            <AdminLoginScreen
              onLoginSuccess={handleAdminLoginSuccess}
              onBack={() => handleNavigate('home')}
            />
          </main>
          <Footer onNavigate={handleNavigate} />
        </div>
      )
    }

    return (
      <AdminDashboard
        onLogout={handleAdminLogout}
        onReturnToStore={() => handleNavigate('home')}
      />
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Real Full-Width Responsive Header */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        wishlistCount={wishlist.length}
        onOpenSearch={() => setFilterModalOpen(true)}
        onOpenCall={() => setCallModalOpen(true)}
        onOpenTestDrive={() => setTestDriveModalOpen(true)}
      />

      {/* Main Responsive Page Content */}
      <main className="w-full flex-1">
        {currentScreen === 'login' && (
          <AdminLoginScreen
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onSelectCar={handleSelectCar}
            onBookTestDrive={(car) => {
              setSelectedCar(car)
              setTestDriveModalOpen(true)
            }}
            onOpenWhatsApp={(car) => {
              setSelectedCar(car)
              setWhatsAppModalOpen(true)
            }}
            onOpenFilter={() => setFilterModalOpen(true)}
            activeTab="home"
            setActiveTab={handleNavigate}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onOpenCall={() => setCallModalOpen(true)}
            filters={filters}
            setFilters={setFilters}
          />
        )}

        {currentScreen === 'detail' && (
          <CarDetailScreen
            car={selectedCar}
            onBack={() => handleNavigate('home')}
            onBookTestDrive={(car) => {
              setSelectedCar(car)
              setTestDriveModalOpen(true)
            }}
            onOpenWhatsApp={(car) => {
              setSelectedCar(car)
              setWhatsAppModalOpen(true)
            }}
            onOpenCall={() => setCallModalOpen(true)}
            onOpenDealer={() => setDealerModalOpen(true)}
            onOpenInspection={() => setInspectionModalOpen(true)}
            onOpenEmi={() => handleNavigate('finance')}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentScreen === 'cars' && (
          <CarsCatalogueScreen
            onSelectCar={handleSelectCar}
            onBookTestDrive={(car) => {
              setSelectedCar(car)
              setTestDriveModalOpen(true)
            }}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            onBack={() => handleNavigate('home')}
            onOpenFilter={() => setFilterModalOpen(true)}
            filters={filters}
            setFilters={setFilters}
          />
        )}

        {currentScreen === 'finance' && (
          <FinanceScreen
            onBack={() => handleNavigate('home')}
            onBookTestDrive={() => setTestDriveModalOpen(true)}
          />
        )}

        {currentScreen === 'sell' && (
          <SellScreen
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            wishlist={wishlist}
            onSelectCar={handleSelectCar}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation Bar (Visible on mobile on all tabs except car detail which has its own sticky bar!) */}
      {currentScreen !== 'detail' && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          wishlistCount={wishlist.length}
        />
      )}

      {/* Real Full-Width Responsive Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 right-1/2 translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Animated Modals */}
      <BookTestDriveModal
        car={selectedCar}
        isOpen={testDriveModalOpen}
        onClose={() => setTestDriveModalOpen(false)}
      />

      <WhatsAppModal
        car={selectedCar}
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      <CallModal
        dealer={selectedCar.dealer}
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
      />

      <DealerModal
        dealer={selectedCar.dealer}
        isOpen={dealerModalOpen}
        onClose={() => setDealerModalOpen(false)}
      />

      <InspectionModal
        car={selectedCar}
        isOpen={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
      />

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={() => {
          showToast('Filters applied')
        }}
      />
    </div>
  )
}

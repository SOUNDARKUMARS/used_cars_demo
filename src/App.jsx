import React, { useState, useEffect, useRef } from 'react'
import RemoteCameraPhoneScreen from './components/RemoteCameraPhoneScreen'
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
import GoogleAuthModal from './components/GoogleAuthModal'
import PhoneNumberPrompt from './components/PhoneNumberPrompt'
import SetCarAlertModal from './components/SetCarAlertModal'
import { useAuth } from './context/AuthContext'
import { isUserAdmin } from './context/authUtils'
import { getStoredCars, saveStoredCars } from './data/carStorage'
import {
  fetchCarsFromSupabase,
  fetchCarByIdFromSupabase,
  fetchSavedCarsFromSupabase,
  addSavedCarToSupabase,
  removeSavedCarFromSupabase,
  trackWishlist,
  trackFilter,
} from './lib/supabase'

const DEFAULT_STORE_FILTERS = {
  minBudget: 200000,
  maxBudget: 3500000,
  minKm: 0,
  maxKm: 100000,
  budget: 'all',
  km: 'all',
  fuel: 'All Fuels',
  year: 'All Years',
  transmission: 'all',
  ownership: 'all',
  bodyType: 'all',
}

function getRemoteCameraSessionId() {
  if (typeof window === 'undefined') return null
  const pathname = window.location.pathname || ''
  const matchPath = pathname.match(/^\/remote-camera\/([^/?#]+)/)
  if (matchPath) return matchPath[1]

  const hash = window.location.hash || ''
  const matchHash = hash.match(/^#\/?remote-camera\/([^/?#]+)/)
  if (matchHash) return matchHash[1]

  const search = new URLSearchParams(window.location.search)
  if (search.get('remote-camera')) return search.get('remote-camera')

  return null
}

export default function App() {
  const { user, requireAuth } = useAuth()
  const [remoteCameraSessionId, setRemoteCameraSessionId] = useState(getRemoteCameraSessionId)
  const [cars, setCars] = useState(getStoredCars)

  // Listen for navigation changes to or from the remote camera route
  useEffect(() => {
    const handleLocationChange = () => {
      setRemoteCameraSessionId(getRemoteCameraSessionId())
    }
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  // Listen for real-time changes to cars from Admin or other storage events
  useEffect(() => {
    const handleCarsUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCars(e.detail)
      }
    }
    window.addEventListener('nova_cars_updated', handleCarsUpdated)
    return () => window.removeEventListener('nova_cars_updated', handleCarsUpdated)
  }, [])

  // Synchronize inventory and drafts from Supabase cloud database on startup
  useEffect(() => {
    let isMounted = true
    async function syncFromCloud() {
      try {
        const cloudCars = await fetchCarsFromSupabase()
        if (isMounted && Array.isArray(cloudCars)) {
          setCars(cloudCars)
          saveStoredCars(cloudCars)
        }
      } catch (err) {
        console.warn('Initial Supabase inventory sync notice:', err.message)
      }
    }
    syncFromCloud()
    return () => {
      isMounted = false
    }
  }, [])

  // Navigation: 'home' | 'detail' | 'cars' | 'finance' | 'sell' | 'profile' | 'login' | 'admin'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === '1' || params.get('auth') === 'admin') {
      localStorage.setItem('nova_admin_auth', 'true')
      return true
    }
    return localStorage.getItem('nova_admin_auth') === 'true'
  })

  // Auto-authenticate admin if signed in with designated admin email
  useEffect(() => {
    if (isUserAdmin(user)) {
      localStorage.setItem('nova_admin_auth', 'true')
      setIsAdminLoggedIn(true)
    }
  }, [user])

  const getInitialScreen = () => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('screen')
    if (q) return q
    const hash = window.location.hash.replace('#', '')
    if (hash === 'admin' || hash === 'admin-add-car' || hash === 'admin/add-car' || hash === 'add-car') {
      const isAuth = localStorage.getItem('nova_admin_auth') === 'true' || isUserAdmin(user)
      return isAuth ? 'admin' : 'login'
    }
    if (hash === 'login') {
      const isAuth = localStorage.getItem('nova_admin_auth') === 'true' || isUserAdmin(user)
      return isAuth ? 'admin' : 'login'
    }
    if (['home', 'detail', 'cars', 'finance', 'sell', 'profile'].includes(hash)) {
      return hash
    }
    return 'home'
  }

  const [currentScreen, setCurrentScreen] = useState(getInitialScreen)
  const [selectedCar, setSelectedCar] = useState(null)
  const scrollMemory = useRef({})
  const detailReturnTo = useRef('home')
  const pendingRestore = useRef(null)

  useEffect(() => {
    if (currentScreen === 'detail') {
      const resetScroll = () => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      resetScroll()
      const frame = requestAnimationFrame(resetScroll)
      return () => cancelAnimationFrame(frame)
    }

    if (pendingRestore.current !== currentScreen) return
    const y = scrollMemory.current[currentScreen]
    pendingRestore.current = null
    if (typeof y !== 'number') return

    const apply = () => {
      window.scrollTo(0, y)
      document.documentElement.scrollTop = y
      document.body.scrollTop = y
    }
    apply()
    const frame = requestAnimationFrame(apply)
    const timer = window.setTimeout(apply, 50)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [currentScreen, selectedCar?.id])

  // Wishlist state with localStorage persistence
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem('nova_user_wishlist')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Synchronize wishlist from Supabase cloud database on mount or user sign-in
  useEffect(() => {
    let isMounted = true
    async function syncWishlist() {
      const userId = user?.id || user?.sub || user?.email
      if (!userId) return

      try {
        const cloudIds = await fetchSavedCarsFromSupabase(userId)
        if (isMounted && cloudIds && cloudIds.length > 0) {
          setWishlist((prev) => {
            const merged = Array.from(new Set([...prev, ...cloudIds]))
            try {
              localStorage.setItem('nova_user_wishlist', JSON.stringify(merged))
            } catch {}
            return merged
          })
        }
      } catch (e) {
        console.info('Notice syncing wishlist from cloud:', e.message)
      }
    }
    syncWishlist()
    return () => {
      isMounted = false
    }
  }, [user])

  // Modals state
  const [testDriveModalOpen, setTestDriveModalOpen] = useState(false)
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [dealerModalOpen, setDealerModalOpen] = useState(false)
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)
  const [carAlertModalOpen, setCarAlertModalOpen] = useState(false)
  const [carAlertInitialValues, setCarAlertInitialValues] = useState({})

  const handleOpenCarAlert = (initialValues = {}) => {
    setCarAlertInitialValues(initialValues)
    setCarAlertModalOpen(true)
  }

  const [filterModalOpen, setFilterModalOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('filter') === 'true'
  })

  // Filters
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      ...DEFAULT_STORE_FILTERS,
      minBudget: params.get('minBudget') ? Number(params.get('minBudget')) : DEFAULT_STORE_FILTERS.minBudget,
      maxBudget: params.get('maxBudget') ? Number(params.get('maxBudget')) : DEFAULT_STORE_FILTERS.maxBudget,
      minKm: params.get('minKm') ? Number(params.get('minKm')) : DEFAULT_STORE_FILTERS.minKm,
      maxKm: params.get('maxKm') ? Number(params.get('maxKm')) : DEFAULT_STORE_FILTERS.maxKm,
    }
  })

  const [homeResetKey, setHomeResetKey] = useState(0)

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
      const isAuth = localStorage.getItem('nova_admin_auth') === 'true' || isUserAdmin(user)
      if (hash === 'admin' || hash === 'admin-add-car' || hash === 'admin/add-car' || hash === 'add-car') {
        setCurrentScreen(isAuth ? 'admin' : 'login')
      } else if (hash === 'login') {
        setCurrentScreen(isAuth ? 'admin' : 'login')
      } else if (['home', 'detail', 'cars', 'finance', 'sell', 'profile'].includes(hash)) {
        setCurrentScreen(hash)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [user])

  // Support direct car navigation via URL param ?car=<id> or reload on #detail
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const carId = params.get('car')
    if (params.get('screen') === 'admin' || params.get('tab') === 'edit-car') return
    if (carId) {
      if (cars.length > 0) {
        const found = cars.find((c) => c.id === carId)
        if (found) {
          setSelectedCar(found)
          setCurrentScreen('detail')
          return
        }
      }
      // If not yet in memory state, directly query Supabase
      fetchCarByIdFromSupabase(carId).then((car) => {
        if (car) {
          setSelectedCar(car)
          setCurrentScreen('detail')
        }
      }).catch(() => {})
    } else if (currentScreen === 'detail' && !selectedCar && cars.length > 0) {
      setSelectedCar(cars[0])
    }
  }, [cars, selectedCar, currentScreen])

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
    requireAuth(
      () => {
        const targetCar = (cars || []).find((c) => c.id === carId) || { id: carId, title: 'Vehicle ' + carId }
        const userId = user?.id || user?.sub || user?.email || 'user'

        setWishlist((prev) => {
          const isRemoving = prev.includes(carId)
          const next = isRemoving ? prev.filter((id) => id !== carId) : [...prev, carId]

          try {
            localStorage.setItem('nova_user_wishlist', JSON.stringify(next))
          } catch {}

          showToast(isRemoving ? 'Removed from Wishlist' : 'Added to Wishlist')

          // Record analytics event and sync with database
          if (isRemoving) {
            trackWishlist('remove', targetCar, { screen: currentScreen })
            removeSavedCarFromSupabase(userId, carId)
          } else {
            trackWishlist('add', targetCar, { screen: currentScreen })
            addSavedCarToSupabase(userId, carId)
          }

          return next
        })
      },
      {
        title: 'Sign in to Save to Wishlist',
        description: 'Sign in with your Google account to save and sync your favorite certified vehicles across your phone and laptop.',
      }
    )
  }

  const handleBookTestDrive = (car = null) => {
    if (car) setSelectedCar(car)
    requireAuth(
      () => {
        setTestDriveModalOpen(true)
      },
      {
        title: 'Sign in to Book a Test Drive',
        description: 'Sign in with Google to schedule your 100% free doorstep test drive slot.',
      }
    )
  }

  const handleSelectCar = (car) => {
    if (currentScreen !== 'detail') {
      scrollMemory.current[currentScreen] = window.scrollY || document.documentElement.scrollTop || 0
      detailReturnTo.current = currentScreen
    }
    setSelectedCar(car)
    setCurrentScreen('detail')
    window.location.hash = 'detail'
  }

  const handleBackFromDetail = () => {
    const screen = detailReturnTo.current || 'home'
    pendingRestore.current = screen
    handleNavigate(screen, { preserveScroll: true })
  }

  const handleGoHome = () => {
    setFilters({ ...DEFAULT_STORE_FILTERS })
    setHomeResetKey((key) => key + 1)
    setSelectedCar(null)
    pendingRestore.current = null
    detailReturnTo.current = 'home'
    setCurrentScreen('home')
    window.location.hash = 'home'

    try {
      const url = new URL(window.location.href)
      ;['q', 'search', 'query', 'minBudget', 'maxBudget', 'minKm', 'maxKm', 'filter', 'car'].forEach(
        (param) => url.searchParams.delete(param)
      )
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {
      // ignore
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigate = (screen, { preserveScroll = false } = {}) => {
    const isAuth = isAdminLoggedIn || isUserAdmin(user) || localStorage.getItem('nova_admin_auth') === 'true'
    if (screen === 'admin' || screen === 'login') {
      if (isAuth) {
        localStorage.setItem('nova_admin_auth', 'true')
        setIsAdminLoggedIn(true)
        setCurrentScreen('admin')
        window.location.hash = 'admin'
        window.scrollTo(0, 0)
        return
      }
    }
    if (!preserveScroll) pendingRestore.current = null
    setCurrentScreen(screen)
    window.location.hash = screen
    if (!preserveScroll) window.scrollTo(0, 0)
  }

  const isAuthorizedAdmin = isAdminLoggedIn || isUserAdmin(user) || localStorage.getItem('nova_admin_auth') === 'true'

  // Public remote camera screen for mobile devices (outside any auth guard)
  if (remoteCameraSessionId) {
    return <RemoteCameraPhoneScreen sessionId={remoteCameraSessionId} />
  }

  // If in Admin Dashboard mode (or admin navigating to login/admin), render Metis Admin Dashboard full-screen
  if (currentScreen === 'admin' || (currentScreen === 'login' && isAuthorizedAdmin)) {
    if (!isAuthorizedAdmin) {
      return (
        <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
          <Navbar
            currentScreen="login"
            onNavigate={handleNavigate}
            onGoHome={handleGoHome}
            wishlistCount={wishlist.length}
            onOpenSearch={() => setFilterModalOpen(true)}
            onOpenCall={() => setCallModalOpen(true)}
            onOpenTestDrive={() => handleBookTestDrive(selectedCar || cars[0])}
            onOpenCarAlert={handleOpenCarAlert}
          />
          <main className="w-full flex-1">
            <AdminLoginScreen
              onLoginSuccess={handleAdminLoginSuccess}
              onBack={handleGoHome}
            />
          </main>
          <Footer onNavigate={handleNavigate} onGoHome={handleGoHome} />
        </div>
      )
    }

    return (
      <AdminDashboard
        onLogout={handleAdminLogout}
        onReturnToStore={handleGoHome}
        cars={cars}
      />
    )
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Real Full-Width Responsive Header */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onGoHome={handleGoHome}
        wishlistCount={wishlist.length}
        onOpenSearch={() => setFilterModalOpen(true)}
        onOpenCall={() => setCallModalOpen(true)}
        onOpenTestDrive={() => handleBookTestDrive(selectedCar || cars[0])}
        onOpenCarAlert={handleOpenCarAlert}
      />

      {/* Main Responsive Page Content */}
      <main className="w-full flex-1">
        {currentScreen === 'login' && !isAuthorizedAdmin && (
          <AdminLoginScreen
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={handleGoHome}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            homeResetKey={homeResetKey}
            cars={cars}
            onSelectCar={handleSelectCar}
            onBookTestDrive={handleBookTestDrive}
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
            onOpenCarAlert={handleOpenCarAlert}
          />
        )}

        {currentScreen === 'detail' && (
          <CarDetailScreen
            car={selectedCar}
            onBack={handleBackFromDetail}
            onBookTestDrive={handleBookTestDrive}
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
            cars={cars}
            onSelectCar={handleSelectCar}
            onBookTestDrive={handleBookTestDrive}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            onBack={() => handleNavigate('home')}
            onOpenFilter={() => setFilterModalOpen(true)}
            filters={filters}
            setFilters={setFilters}
            onOpenCarAlert={handleOpenCarAlert}
          />
        )}

        {currentScreen === 'finance' && (
          <FinanceScreen
            onBack={() => handleNavigate('home')}
            onBookTestDrive={() => handleBookTestDrive(selectedCar || cars[0])}
          />
        )}

        {currentScreen === 'sell' && (
          <SellScreen
            onBack={() => handleNavigate('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            cars={cars}
            wishlist={wishlist}
            onSelectCar={handleSelectCar}
            onNavigate={handleNavigate}
            onOpenCarAlert={handleOpenCarAlert}
          />
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation Bar (Visible on mobile on all tabs except car detail which has its own sticky bar!) */}
      {currentScreen !== 'detail' && (
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onGoHome={handleGoHome}
        wishlistCount={wishlist.length}
      />
      )}

      {/* Real Full-Width Responsive Footer */}
      <Footer onNavigate={handleNavigate} onGoHome={handleGoHome} />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-8 right-1/2 translate-x-1/2 z-50 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Google Authentication Modal */}
      <GoogleAuthModal />
      <PhoneNumberPrompt />

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
        dealer={selectedCar?.dealer}
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
      />

      <DealerModal
        dealer={selectedCar?.dealer}
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
        onApply={(appliedFilters) => {
          showToast('Filters applied')
          const f = appliedFilters || filters
          trackFilter(f, cars.length, { screen: currentScreen, source: 'filter_modal' })
        }}
      />

      <SetCarAlertModal
        isOpen={carAlertModalOpen}
        onClose={() => setCarAlertModalOpen(false)}
        initialValues={carAlertInitialValues}
        onSuccess={(rem) => {
          showToast('Vehicle alert reminder activated! We will notify you via email when matching cars arrive.')
        }}
      />
    </div>
  )
}

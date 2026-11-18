import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  getStoredCars,
  addCar,
  updateCar,
  deleteCar,
  resetCars,
  getStoredTestDrives,
  updateTestDriveStatus,
  deleteTestDrive,
  addTestDrive,
  getStoredSellRequests,
  updateSellRequestStatus,
  deleteSellRequest,
  getStoredLeads,
  INITIAL_ACTIVITIES,
  formatINR,
  formatINRLakhsOrCrore
} from '../data/carStorage'

// Sample preset car images for quick selection in Add Car Modal
const PRESET_CAR_IMAGES = [
  { label: 'Honda City (Sedan)', path: '/mock_cars/honda_city_front.jpg' },
  { label: 'Toyota Fortuner (SUV)', path: '/hero-fortuner.png' },
  { label: 'Maruti Swift (Hatchback)', path: '/mock_cars/maruti_swift_black.jpg' },
  { label: 'VW Vento (Sedan)', path: '/mock_cars/vw_vento_white.jpg' },
  { label: 'Hyundai Grand i10 (Hatchback)', path: '/mock_cars/hyundai_grand_i10_white.jpg' },
  { label: 'Ford EcoSport (SUV)', path: '/mock_cars/ford_ecosport_orange.jpg' },
  { label: 'Maruti S-Cross (Crossover)', path: '/mock_cars/maruti_scross_brown.jpg' },
  { label: 'Tata Tiago (Hatchback)', path: '/mock_cars/tata_tiago_silver.jpg' },
  { label: 'Skoda Rapid (Sedan)', path: '/mock_cars/skoda_rapid_silver.jpg' },
  { label: 'Renault Triber (MPV)', path: '/mock_cars/renault_triber_blue.jpg' },
]

export default function AdminDashboard({ onLogout, onReturnToStore }) {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('theme') || localStorage.getItem('metis_theme') || 'light'
  })

  // Navigation tab: 'dashboard' | 'inventory' | 'bookings' | 'sell-requests' | 'leads' | 'analytics' | 'settings'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || 'dashboard'
  })

  // Sidebar responsive state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Top header dropdowns
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResultsOpen, setSearchResultsOpen] = useState(false)

  // Live Dealership State (Synced via localStorage & CustomEvents)
  const [cars, setCars] = useState(getStoredCars)
  const [testDrives, setTestDrives] = useState(getStoredTestDrives)
  const [sellRequests, setSellRequests] = useState(getStoredSellRequests)
  const [leads, setLeads] = useState(getStoredLeads)
  const [activities] = useState(INITIAL_ACTIVITIES)

  // Inventory Table filters & state
  const [carSearch, setCarSearch] = useState('')
  const [bodyFilter, setBodyFilter] = useState('all')
  const [fuelFilter, setFuelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCarIds, setSelectedCarIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Modals state
  const [addCarModalOpen, setAddCarModalOpen] = useState(false)
  const [editCarModalOpen, setEditCarModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState(null)
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false)

  // Add Car Form State
  const [newCarForm, setNewCarForm] = useState({
    title: '',
    make: 'Toyota',
    model: 'Fortuner',
    year: '2023',
    variant: '4x4 Sigma AT',
    price: 3450000,
    kmNumeric: 28000,
    fuel: 'Diesel',
    transmission: 'Automatic',
    bodyType: 'SUV',
    ownership: '1st Owner',
    location: 'Tiruppur, Tamil Nadu',
    color: 'Silver Metallic',
    image: '/hero-fortuner.png',
    inspected: true,
    listingStatus: 'Available'
  })

  // Quick manual booking form state
  const [newBookingForm, setNewBookingForm] = useState({
    carId: '',
    customerName: '',
    phone: '',
    slot: 'Tomorrow, 11:00 AM',
    locationType: 'home',
    address: 'Tiruppur'
  })

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Search input ref for Ctrl+K
  const searchInputRef = useRef(null)

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('metis_theme', theme)
  }, [theme])

  // Attach Metis CSS dynamically while in admin dashboard
  useEffect(() => {
    let link = document.getElementById('metis-theme-css')
    if (!link) {
      link = document.createElement('link')
      link.id = 'metis-theme-css'
      link.rel = 'stylesheet'
      link.href = '/metis.css'
      document.head.appendChild(link)
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      const existingLink = document.getElementById('metis-theme-css')
      if (existingLink) {
        existingLink.remove()
      }
      document.documentElement.removeAttribute('data-bs-theme')
    }
  }, [])

  // Two-way synchronization event listeners:
  // If user books test drive or submits sell request in frontend, admin updates in real-time!
  useEffect(() => {
    const handleCarsChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setCars(e.detail)
    }
    const handleTDChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setTestDrives(e.detail)
    }
    const handleSRChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setSellRequests(e.detail)
    }
    const handleLeadsChange = (e) => {
      if (e.detail && Array.isArray(e.detail)) setLeads(e.detail)
    }

    window.addEventListener('nova_cars_updated', handleCarsChange)
    window.addEventListener('nova_test_drives_updated', handleTDChange)
    window.addEventListener('nova_sell_requests_updated', handleSRChange)
    window.addEventListener('nova_leads_updated', handleLeadsChange)

    return () => {
      window.removeEventListener('nova_cars_updated', handleCarsChange)
      window.removeEventListener('nova_test_drives_updated', handleTDChange)
      window.removeEventListener('nova_sell_requests_updated', handleSRChange)
      window.removeEventListener('nova_leads_updated', handleLeadsChange)
    }
  }, [])

  // Computed KPI Metrics
  const kpis = useMemo(() => {
    const totalCount = cars.length
    const availableCount = cars.filter((c) => (c.listingStatus || 'Available') === 'Available').length
    const soldCount = cars.filter((c) => (c.listingStatus || '') === 'Sold').length
    const totalInventoryValue = cars.reduce((acc, c) => acc + (Number(c.price) || 0), 0)
    const inspectedCount = cars.filter((c) => c.inspected).length
    const inspectedPct = totalCount > 0 ? Math.round((inspectedCount / totalCount) * 100) : 100
    const pendingTestDrives = testDrives.filter((td) => td.status === 'Pending').length
    const pendingSellRequests = sellRequests.filter((sr) => sr.status === 'Under Review').length

    return {
      totalCount,
      availableCount,
      soldCount,
      totalInventoryValue,
      totalInventoryFormatted: formatINRLakhsOrCrore(totalInventoryValue),
      inspectedPct,
      testDrivesTotal: testDrives.length,
      pendingTestDrives,
      sellRequestsTotal: sellRequests.length,
      pendingSellRequests,
      leadsTotal: leads.length
    }
  }, [cars, testDrives, sellRequests, leads])

  // Filtered cars for inventory table
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (carSearch) {
        const q = carSearch.toLowerCase()
        const matches =
          car.title?.toLowerCase().includes(q) ||
          car.make?.toLowerCase().includes(q) ||
          car.model?.toLowerCase().includes(q) ||
          car.variant?.toLowerCase().includes(q) ||
          car.location?.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (bodyFilter !== 'all' && car.bodyType?.toLowerCase() !== bodyFilter.toLowerCase()) {
        return false
      }
      if (fuelFilter !== 'all' && car.fuel?.toLowerCase() !== fuelFilter.toLowerCase()) {
        return false
      }
      if (statusFilter !== 'all') {
        const currentStatus = (car.listingStatus || 'Available').toLowerCase()
        if (currentStatus !== statusFilter.toLowerCase()) return false
      }
      return true
    })
  }, [cars, carSearch, bodyFilter, fuelFilter, statusFilter])

  // Pagination for inventory table
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage) || 1
  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredCars.slice(start, start + itemsPerPage)
  }, [filteredCars, currentPage])

  // Body type breakdown for Donut Chart
  const bodyTypeStats = useMemo(() => {
    const counts = { Sedan: 0, SUV: 0, Hatchback: 0, MPV: 0 }
    cars.forEach((c) => {
      const type = c.bodyType || 'Sedan'
      if (counts[type] !== undefined) counts[type]++
      else counts.SUV++
    })
    const total = cars.length || 1
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    }))
  }, [cars])

  // Global search across cars, bookings, and sell requests
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const results = []

    cars.filter((c) => c.title?.toLowerCase().includes(q)).slice(0, 3).forEach((c) => {
      results.push({
        title: `${c.title} • ${c.priceFormatted}`,
        type: 'Car Listing',
        tab: 'inventory'
      })
    })

    testDrives.filter((td) => td.customerName?.toLowerCase().includes(q) || td.ref?.toLowerCase().includes(q)).slice(0, 2).forEach((td) => {
      results.push({
        title: `Test Drive: ${td.customerName} (${td.carTitle})`,
        type: 'Test Drive',
        tab: 'bookings'
      })
    })

    sellRequests.filter((sr) => sr.regNumber?.toLowerCase().includes(q) || sr.customerName?.toLowerCase().includes(q)).slice(0, 2).forEach((sr) => {
      results.push({
        title: `Trade-in: ${sr.regNumber} • ${sr.carTitle}`,
        type: 'Sell Request',
        tab: 'sell-requests'
      })
    })

    return results
  }, [searchQuery, cars, testDrives, sellRequests])

  // Handlers for Add Car Form
  const handleSaveNewCar = (e) => {
    e.preventDefault()
    if (!newCarForm.title && (!newCarForm.make || !newCarForm.model)) {
      showToast('Please enter car title or make and model', 'danger')
      return
    }

    const created = addCar({
      ...newCarForm,
      title: newCarForm.title || `${newCarForm.year} ${newCarForm.make} ${newCarForm.model}`,
      price: Number(newCarForm.price),
      kmNumeric: Number(newCarForm.kmNumeric),
    })

    setAddCarModalOpen(false)
    showToast(`Vehicle "${created.title}" added to live inventory & customer store!`)
    // Reset form
    setNewCarForm({
      title: '',
      make: 'Toyota',
      model: 'Fortuner',
      year: '2023',
      variant: '4x4 Sigma AT',
      price: 3450000,
      kmNumeric: 28000,
      fuel: 'Diesel',
      transmission: 'Automatic',
      bodyType: 'SUV',
      ownership: '1st Owner',
      location: 'Tiruppur, Tamil Nadu',
      color: 'Silver Metallic',
      image: '/hero-fortuner.png',
      inspected: true,
      listingStatus: 'Available'
    })
  }

  // Handlers for Quick Edit Car
  const handleOpenEditCar = (car) => {
    setEditingCar({ ...car })
    setEditCarModalOpen(true)
  }

  const handleSaveEditCar = (e) => {
    e.preventDefault()
    if (!editingCar) return
    updateCar(editingCar.id, {
      price: Number(editingCar.price),
      kmNumeric: Number(editingCar.kmNumeric),
      location: editingCar.location,
      inspected: editingCar.inspected,
      listingStatus: editingCar.listingStatus,
      transmission: editingCar.transmission,
      fuel: editingCar.fuel,
    })
    setEditCarModalOpen(false)
    showToast(`Updated "${editingCar.title}" successfully! Synced to store.`)
  }

  // Delete Car
  const handleDeleteCar = (id, title) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from inventory and customer catalog?`)) {
      deleteCar(id)
      setSelectedCarIds((prev) => prev.filter((i) => i !== id))
      showToast(`Removed "${title}" from live store`, 'warning')
    }
  }

  // Quick status toggle
  const handleToggleCarStatus = (car, newStatus) => {
    updateCar(car.id, { listingStatus: newStatus })
    showToast(`Marked "${car.title}" as ${newStatus}`)
  }

  // Quick toggle Nova inspection
  const handleToggleInspection = (car) => {
    const updatedStatus = !car.inspected
    updateCar(car.id, { inspected: updatedStatus })
    showToast(`Inspection status set to ${updatedStatus ? 'Certified A+' : 'Standard'}`)
  }

  // Reset to default factory inventory
  const handleResetCars = () => {
    if (window.confirm('Reset car inventory to default factory showroom list? Any custom added cars will be restored.')) {
      resetCars()
      showToast('Inventory reset to default showroom cars!')
    }
  }

  // Export Cars to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Make', 'Model', 'Year', 'Variant', 'Price_INR', 'KM_Driven', 'Fuel', 'Transmission', 'Body_Type', 'Location', 'Status', 'Nova_Certified']
    const rows = cars.map((c) => [
      c.id,
      `"${c.make}"`,
      `"${c.model}"`,
      c.year,
      `"${c.variant}"`,
      c.price,
      c.kmNumeric || c.km,
      c.fuel,
      c.transmission,
      c.bodyType,
      `"${c.location}"`,
      c.listingStatus || 'Available',
      c.inspected ? 'Yes' : 'No'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Nova_Motors_Inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Cars inventory exported to CSV')
  }

  // Export Test Drives to CSV
  const handleExportTestDrivesCSV = () => {
    const headers = ['Booking_Ref', 'Customer_Name', 'Phone', 'Vehicle', 'Preferred_Slot', 'Location_Type', 'Address', 'Status', 'Booked_At']
    const rows = testDrives.map((td) => [
      td.ref,
      `"${td.customerName}"`,
      `"${td.phone}"`,
      `"${td.carTitle}"`,
      `"${td.slot}"`,
      td.locationType,
      `"${td.address}"`,
      td.status,
      `"${td.bookedAt}"`
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Nova_Test_Drives_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Test drive bookings exported to CSV')
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  return (
    <div className="admin-app" style={{ minHeight: '100vh', width: '100%' }}>
      <div className={`admin-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="admin-wrapper">

        {/* ==============================================================
            HEADER / NAVBAR
        ============================================================== */}
        <header className="admin-header">
          <nav className="navbar navbar-expand-lg bg-body border-bottom px-3">
            <div className="container-fluid px-0 d-flex align-items-center flex-nowrap">

              {/* Brand Logo & Name */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="navbar-brand d-flex align-items-center border-0 bg-transparent text-decoration-none me-2"
                style={{ cursor: 'pointer' }}
              >
                <div className="bg-primary text-white p-1 rounded-2 me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-shield-check" style={{ fontSize: '1.15rem' }}></i>
                </div>
                <div className="text-start">
                  <div className="h6 mb-0 fw-bold text-primary-emphasis lh-1">NOVA MOTORS</div>
                  <small className="text-muted d-block" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>DEALERSHIP ADMIN</small>
                </div>
              </button>

              {/* Hamburger Sidebar Toggle */}
              <button
                className="hamburger-menu btn btn-link p-1 text-body"
                type="button"
                onClick={() => {
                  if (window.innerWidth < 992) {
                    setMobileSidebarOpen(!mobileSidebarOpen)
                  } else {
                    setSidebarCollapsed(!sidebarCollapsed)
                  }
                }}
                aria-label="Toggle sidebar"
                style={{ textDecoration: 'none' }}
              >
                <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
              </button>

              {/* Two-Way Live Sync Indicator */}
              <div className="d-none d-xl-flex align-items-center ms-3 flex-shrink-0">
                <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
                  <span className="spinner-grow spinner-grow-sm" style={{ width: '8px', height: '8px' }} role="status"></span>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Live Sync Active &bull; Store Connected</span>
                </span>
              </div>

              {/* Search Bar with Ctrl+K shortcut */}
              <div className="search-container flex-grow-1 mx-3 d-none d-lg-block position-relative">
                <div className="position-relative">
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search cars, bookings, trade-ins... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setSearchResultsOpen(true)
                    }}
                    onFocus={() => setSearchResultsOpen(true)}
                    onBlur={() => setTimeout(() => setSearchResultsOpen(false), 250)}
                    aria-label="Search"
                  />
                  <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3 text-muted pointer-events-none"></i>

                  {/* Search Results Dropdown */}
                  {searchResultsOpen && globalSearchResults.length > 0 && (
                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-2 shadow-lg mt-1 z-3 overflow-hidden">
                      {globalSearchResults.map((res, idx) => (
                        <div
                          key={idx}
                          onMouseDown={() => {
                            setActiveTab(res.tab)
                            setSearchQuery('')
                            setSearchResultsOpen(false)
                          }}
                          className="d-flex align-items-center px-3 py-2 text-decoration-none text-dark border-bottom cursor-pointer hover-bg-light"
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-arrow-right-circle me-2 text-primary"></i>
                          <span className="small">{res.title}</span>
                          <small className="ms-auto badge bg-light text-muted border">
                            {res.type}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="navbar-nav flex-row align-items-center ms-auto">
                {/* Switch to Frontend Storefront Button */}
                <button
                  type="button"
                  onClick={onReturnToStore}
                  className="btn btn-sm btn-outline-primary me-2 d-inline-flex align-items-center gap-1.5"
                  title="View user side store"
                >
                  <i className="bi bi-shop"></i>
                  <span className="d-none d-sm-inline font-semibold">Storefront</span>
                </button>

                {/* Theme Toggle Button */}
                <button
                  className="btn btn-sm btn-outline-secondary me-2 d-flex align-items-center justify-content-center"
                  type="button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  title="Toggle light / dark theme"
                  style={{ width: '34px', height: '34px' }}
                >
                  {theme === 'light' ? (
                    <i className="bi bi-moon-fill"></i>
                  ) : (
                    <i className="bi bi-sun-fill text-warning"></i>
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  className="btn btn-sm btn-outline-secondary me-2 d-none d-md-inline-flex align-items-center justify-content-center"
                  type="button"
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                  style={{ width: '34px', height: '34px' }}
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </button>

                {/* Notifications Dropdown: Pending Test Drives & Leads */}
                <div className="position-relative me-2">
                  <button
                    className="btn btn-sm btn-outline-secondary position-relative d-flex align-items-center justify-content-center"
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    style={{ width: '34px', height: '34px' }}
                  >
                    <i className="bi bi-bell"></i>
                    {(kpis.pendingTestDrives > 0 || kpis.pendingSellRequests > 0) && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                        {kpis.pendingTestDrives + kpis.pendingSellRequests}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 p-0"
                      style={{ minWidth: '300px', zIndex: 1050 }}
                    >
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                        <span className="fw-bold small">Dealership Alerts</span>
                        <span className="badge bg-primary rounded-pill small">
                          {kpis.pendingTestDrives + kpis.pendingSellRequests} Pending
                        </span>
                      </div>
                      <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {kpis.pendingTestDrives > 0 ? (
                          <button
                            type="button"
                            className="list-group-item list-group-item-action p-2.5 small"
                            onClick={() => {
                              setActiveTab('bookings')
                              setNotificationsOpen(false)
                            }}
                          >
                            <div className="d-flex align-items-center text-primary fw-semibold mb-1">
                              <i className="bi bi-calendar-event me-2"></i>
                              <span>{kpis.pendingTestDrives} Test Drive(s) Awaiting Confirmation</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              Users booked doorstep test drives on frontend
                            </span>
                          </button>
                        ) : null}

                        {kpis.pendingSellRequests > 0 ? (
                          <button
                            type="button"
                            className="list-group-item list-group-item-action p-2.5 small"
                            onClick={() => {
                              setActiveTab('sell-requests')
                              setNotificationsOpen(false)
                            }}
                          >
                            <div className="d-flex align-items-center text-success fw-semibold mb-1">
                              <i className="bi bi-tag me-2"></i>
                              <span>{kpis.pendingSellRequests} Car Sell Inquiries Pending</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '11px' }}>
                              Customer vehicle trade-in evaluations from SellScreen
                            </span>
                          </button>
                        ) : null}

                        {testDrives.slice(0, 2).map((td) => (
                          <div key={td.id} className="list-group-item p-2.5 small text-muted">
                            <div className="fw-medium text-dark">{td.customerName} &bull; {td.carTitle}</div>
                            <div style={{ fontSize: '11px' }}>{td.slot} &bull; {td.locationType === 'home' ? 'Doorstep' : 'Showroom Hub'}</div>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-top text-center bg-light">
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none py-0"
                          onClick={() => {
                            setActiveTab('bookings')
                            setNotificationsOpen(false)
                          }}
                        >
                          View All Bookings &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="position-relative">
                  <button
                    className="btn btn-link text-decoration-none d-flex align-items-center p-0"
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <div className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                      AD
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 p-2"
                      style={{ minWidth: '220px', zIndex: 1050 }}
                    >
                      <div className="px-2 py-1.5 border-bottom mb-1">
                        <div className="fw-bold small">Dealership Superadmin</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>admin@123</div>
                      </div>
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 d-flex align-items-center gap-2"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onReturnToStore()
                        }}
                      >
                        <i className="bi bi-shop text-primary"></i>
                        <span>Return to Storefront</span>
                      </button>
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 d-flex align-items-center gap-2"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setActiveTab('settings')
                        }}
                      >
                        <i className="bi bi-gear text-secondary"></i>
                        <span>Dealership Settings</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        type="button"
                        className="dropdown-item small rounded py-1.5 text-danger d-flex align-items-center gap-2"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onLogout()
                        }}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Sign Out of Admin</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </nav>
        </header>

        {/* ==============================================================
            SIDEBAR NAVIGATION
        ============================================================== */}
        <aside
          className={`admin-sidebar ${mobileSidebarOpen ? 'show' : ''}`}
          id="admin-sidebar"
        >
          <div className="sidebar-content d-flex flex-column h-100">
            {/* Sidebar Brand / Quick Info */}
            <div className="p-3 border-bottom sidebar-hide-collapsed">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary px-2 py-1 rounded">Nova 2.0</span>
                <span className="small text-muted fw-semibold">Tamil Nadu Hub</span>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="sidebar-nav flex-grow-1 p-2 overflow-y-auto">
              <ul className="nav nav-pills flex-column gap-1">
                {/* 1. Dashboard Overview */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'dashboard' ? 'active' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    <span>Overview</span>
                  </button>
                </li>

                {/* 2. Cars Inventory */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('inventory')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'inventory' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-car-front me-2"></i>
                      <span>Cars Inventory</span>
                    </div>
                    <span className={`badge rounded-pill ${activeTab === 'inventory' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {kpis.totalCount}
                    </span>
                  </button>
                </li>

                {/* 3. Test Drive Bookings */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('bookings')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'bookings' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar-check me-2"></i>
                      <span>Test Drives</span>
                    </div>
                    {kpis.pendingTestDrives > 0 ? (
                      <span className="badge bg-danger rounded-pill">
                        {kpis.pendingTestDrives}
                      </span>
                    ) : (
                      <span className={`badge rounded-pill ${activeTab === 'bookings' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                        {kpis.testDrivesTotal}
                      </span>
                    )}
                  </button>
                </li>

                {/* 4. Sell Car Requests */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sell-requests')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'sell-requests' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-tag me-2"></i>
                      <span>Sell Requests</span>
                    </div>
                    {kpis.pendingSellRequests > 0 ? (
                      <span className="badge bg-warning text-dark rounded-pill">
                        {kpis.pendingSellRequests}
                      </span>
                    ) : (
                      <span className={`badge rounded-pill ${activeTab === 'sell-requests' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                        {kpis.sellRequestsTotal}
                      </span>
                    )}
                  </button>
                </li>

                {/* 5. Customer Leads */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('leads')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center justify-content-between ${activeTab === 'leads' ? 'active' : ''}`}
                  >
                    <div className="d-flex align-items-center">
                      <i className="bi bi-chat-dots me-2"></i>
                      <span>Customer Leads</span>
                    </div>
                    <span className={`badge rounded-pill ${activeTab === 'leads' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {kpis.leadsTotal}
                    </span>
                  </button>
                </li>

                {/* 6. Analytics */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('analytics')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'analytics' ? 'active' : ''}`}
                  >
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    <span>Analytics</span>
                  </button>
                </li>

                {/* 7. Settings */}
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings')
                      setMobileSidebarOpen(false)
                    }}
                    className={`nav-link w-100 text-start border-0 d-flex align-items-center ${activeTab === 'settings' ? 'active' : ''}`}
                  >
                    <i className="bi bi-gear me-2"></i>
                    <span>Settings</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-top mt-auto bg-body-tertiary">
              <button
                type="button"
                onClick={onReturnToStore}
                className="btn btn-outline-secondary btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2 sidebar-bottom-btn"
                title="Customer Storefront"
              >
                <i className="bi bi-arrow-left"></i>
                <span>Customer Storefront</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 sidebar-bottom-btn"
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="modal-backdrop fade show d-lg-none"
            style={{ zIndex: 1040 }}
            onClick={() => setMobileSidebarOpen(false)}
          ></div>
        )}

        {/* ==============================================================
            MAIN PAGE CONTENT
        ============================================================== */}
        <main id="main-content" className="admin-main">
          <div className="container-fluid p-3 p-lg-4">

            {/* ==========================================================
                TAB 1: DEALERSHIP OVERVIEW DASHBOARD
            ========================================================== */}
            {activeTab === 'dashboard' && (
              <>
                {/* Header Row */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Dealership Overview</h1>
                    <p className="text-muted mb-0 small">
                      Live telemetry across Nova Motors inventory, test drives & trade-in evaluations &bull; Synced with frontend
                    </p>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center gap-1.5 shadow-sm"
                      onClick={() => setAddCarModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add Vehicle</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={handleExportCSV}
                      title="Export Cars CSV"
                    >
                      <i className="bi bi-download me-1"></i>
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={() => {
                        setCars(getStoredCars())
                        setTestDrives(getStoredTestDrives())
                        setSellRequests(getStoredSellRequests())
                        showToast('Data refreshed from local store')
                      }}
                      title="Refresh"
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>

                {/* 4 Car Dealership KPI Cards */}
                <div className="row g-3 g-lg-4 mb-4">
                  {/* Card 1: Active Cars Inventory */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100 border-0 shadow-sm">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-primary bg-opacity-10 text-primary me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-car-front" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Live Inventory</p>
                            <h3 className="mb-0 fw-bold">{kpis.totalCount} Cars</h3>
                            <small className="text-success fw-medium">
                              {kpis.totalInventoryFormatted} Total Value
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Test Drive Appointments */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100 border-0 shadow-sm">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-success bg-opacity-10 text-success me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-calendar2-check" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Test Drives</p>
                            <h3 className="mb-0 fw-bold">{kpis.testDrivesTotal} Booked</h3>
                            <small className={kpis.pendingTestDrives > 0 ? 'text-danger fw-semibold' : 'text-success fw-medium'}>
                              {kpis.pendingTestDrives > 0 ? `${kpis.pendingTestDrives} Pending Confirmation` : 'All Confirmed'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Sell Car Trade-Ins */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100 border-0 shadow-sm">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-warning bg-opacity-10 text-warning me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-tag" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Sell Requests</p>
                            <h3 className="mb-0 fw-bold">{kpis.sellRequestsTotal} Enquiries</h3>
                            <small className="text-warning-emphasis fw-medium">
                              {kpis.pendingSellRequests} Valuations Pending
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: 200-Pt Nova Certification */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100 border-0 shadow-sm">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-info bg-opacity-10 text-info me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-shield-check" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Nova Certified</p>
                            <h3 className="mb-0 fw-bold">{kpis.inspectedPct}% Inspected</h3>
                            <small className="text-info-emphasis fw-medium">
                              200-Point Vetted Stock
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Vehicle Sales Volume Chart & Body Type Distribution */}
                <div className="row g-4 mb-4">
                  {/* Left Column: Monthly Vehicle Sales Volume SVG Chart */}
                  <div className="col-lg-8">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="h5 card-title mb-0 fw-bold">Dealership Sales & Revenue Trend</h2>
                          <small className="text-muted">Monthly vehicle deliveries (INR Lakhs)</small>
                        </div>
                        <span className="badge bg-primary-subtle text-primary fw-semibold px-2.5 py-1">
                          Tamil Nadu Region
                        </span>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div style={{ height: '260px', width: '100%' }}>
                          <svg viewBox="0 0 600 220" className="w-100 h-100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="carRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            <line x1="30" y1="30" x2="580" y2="30" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="90" x2="580" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="150" x2="580" y2="150" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="190" x2="580" y2="190" stroke="currentColor" strokeOpacity="0.15" />

                            <polygon
                              points="40,160 120,130 200,105 280,120 360,70 440,80 550,35 550,190 40,190"
                              fill="url(#carRevenueGrad)"
                            />
                            <polyline
                              points="40,160 120,130 200,105 280,120 360,70 440,80 550,35"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            {[
                              { x: 40, y: 160, val: '₹ 28L' },
                              { x: 120, y: 130, val: '₹ 42L' },
                              { x: 200, y: 105, val: '₹ 56L' },
                              { x: 280, y: 120, val: '₹ 48L' },
                              { x: 360, y: 70, val: '₹ 74L' },
                              { x: 440, y: 80, val: '₹ 68L' },
                              { x: 550, y: 35, val: '₹ 92L' }
                            ].map((p, idx) => (
                              <g key={idx}>
                                <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
                              </g>
                            ))}
                          </svg>
                          <div className="d-flex justify-content-between text-muted small px-3 mt-1">
                            {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov (Current)'].map((m) => (
                              <span key={m}>{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Body Type Distribution */}
                  <div className="col-lg-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Body Type Mix</h2>
                        <small className="text-muted">Live inventory segmentation</small>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div className="space-y-3">
                          {bodyTypeStats.map((item, idx) => {
                            const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info']
                            return (
                              <div key={item.name} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1 small">
                                  <span className="fw-semibold">{item.name}</span>
                                  <span className="text-muted">{item.count} Cars ({item.pct}%)</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                  <div
                                    className={`progress-bar ${colors[idx % colors.length]}`}
                                    role="progressbar"
                                    style={{ width: `${item.pct}%` }}
                                    aria-valuenow={item.pct}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="mt-4 p-3 rounded bg-light border small">
                          <div className="fw-bold mb-1">
                            <i className="bi bi-lightning-charge text-warning me-1"></i>
                            Market Insight:
                          </div>
                          <span className="text-muted">
                            SUVs and premium automatic sedans (City, Fortuner, Vento) have 2.4x higher test drive booking velocity this week in Tiruppur.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Live Test Drives Table & Recent Activity */}
                <div className="row g-4">
                  {/* Left: Latest Test Drive Appointments */}
                  <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <div>
                          <h2 className="h5 card-title mb-0 fw-bold">Recent Test Drive Requests</h2>
                          <small className="text-muted">Booked from customer frontend</small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setActiveTab('bookings')}
                        >
                          View All ({testDrives.length})
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Ref / Customer</th>
                              <th>Vehicle</th>
                              <th>Slot & Type</th>
                              <th>Status</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testDrives.slice(0, 5).map((td) => (
                              <tr key={td.id}>
                                <td>
                                  <div className="fw-bold small">{td.customerName}</div>
                                  <div className="text-muted" style={{ fontSize: '11px' }}>
                                    <span className="font-monospace text-primary">{td.ref}</span> &bull; {td.phone}
                                  </div>
                                </td>
                                <td>
                                  <div className="small fw-semibold text-truncate" style={{ maxWidth: '180px' }}>
                                    {td.carTitle}
                                  </div>
                                  <small className="text-muted">{td.carPrice}</small>
                                </td>
                                <td>
                                  <div className="small">{td.slot}</div>
                                  <span className={`badge ${td.locationType === 'home' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '10px' }}>
                                    {td.locationType === 'home' ? 'Home Doorstep' : 'Showroom Hub'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    td.status === 'Confirmed' ? 'bg-success' :
                                    td.status === 'Completed' ? 'bg-secondary' :
                                    td.status === 'Cancelled' ? 'bg-danger' :
                                    'bg-warning text-dark'
                                  }`}>
                                    {td.status}
                                  </span>
                                </td>
                                <td className="text-end">
                                  {td.status === 'Pending' ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success py-0 px-2"
                                      style={{ fontSize: '11px' }}
                                      onClick={() => {
                                        updateTestDriveStatus(td.id, 'Confirmed')
                                        showToast(`Confirmed test drive for ${td.customerName}`)
                                      }}
                                    >
                                      Confirm
                                    </button>
                                  ) : td.status === 'Confirmed' ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                                      style={{ fontSize: '11px' }}
                                      onClick={() => {
                                        updateTestDriveStatus(td.id, 'Completed')
                                        showToast(`Marked test drive as completed`)
                                      }}
                                    >
                                      Complete
                                    </button>
                                  ) : (
                                    <span className="text-muted small">&bull;</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right: Dealership Activity Feed */}
                  <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Live Activity Log</h2>
                        <small className="text-muted">Real-time showroom events</small>
                      </div>
                      <div className="card-body p-3">
                        <div className="timeline">
                          {activities.map((act) => (
                            <div key={act.id} className="d-flex align-items-start mb-3">
                              <div className={`bg-${act.color} bg-opacity-10 text-${act.color} p-2 rounded-circle me-3 shrink-0 d-flex align-items-center justify-content-center`} style={{ width: '32px', height: '32px' }}>
                                <i className={`bi ${act.icon}`} style={{ fontSize: '0.9rem' }}></i>
                              </div>
                              <div className="flex-grow-1">
                                <div className="fw-semibold small">{act.title}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{act.subtitle}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 2: CARS INVENTORY MANAGEMENT
            ========================================================== */}
            {activeTab === 'inventory' && (
              <>
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Cars Inventory Management</h1>
                    <p className="text-muted mb-0 small">
                      Manage vehicle specs, pricing (₹), Nova 200-Pt inspection badges, and live store listings
                    </p>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
                      onClick={handleExportCSV}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-warning d-flex align-items-center gap-1.5"
                      onClick={handleResetCars}
                      title="Reset inventory to default seed"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      <span>Reset Factory Cars</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center gap-1.5 shadow-sm"
                      onClick={() => setAddCarModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add New Vehicle</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar Card */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-3">
                    <div className="row g-2 align-items-center">
                      {/* Search */}
                      <div className="col-md-4">
                        <div className="position-relative">
                          <input
                            type="search"
                            className="form-control form-control-sm"
                            placeholder="Search make, model, variant..."
                            value={carSearch}
                            onChange={(e) => {
                              setCarSearch(e.target.value)
                              setCurrentPage(1)
                            }}
                          />
                          <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted small"></i>
                        </div>
                      </div>

                      {/* Body Type Filter */}
                      <div className="col-6 col-md-2">
                        <select
                          className="form-select form-select-sm"
                          value={bodyFilter}
                          onChange={(e) => {
                            setBodyFilter(e.target.value)
                            setCurrentPage(1)
                          }}
                        >
                          <option value="all">All Body Types</option>
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="Hatchback">Hatchback</option>
                          <option value="MPV">MPV</option>
                        </select>
                      </div>

                      {/* Fuel Filter */}
                      <div className="col-6 col-md-2">
                        <select
                          className="form-select form-select-sm"
                          value={fuelFilter}
                          onChange={(e) => {
                            setFuelFilter(e.target.value)
                            setCurrentPage(1)
                          }}
                        >
                          <option value="all">All Fuels</option>
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="CNG">CNG</option>
                        </select>
                      </div>

                      {/* Listing Status */}
                      <div className="col-6 col-md-2">
                        <select
                          className="form-select form-select-sm"
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setCurrentPage(1)
                          }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="Available">Available</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>

                      {/* Result Counter */}
                      <div className="col-6 col-md-2 text-end">
                        <span className="small text-muted">
                          Showing <strong>{filteredCars.length}</strong> of <strong>{cars.length}</strong> cars
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inventory Table Card */}
                <div className="card border-0 shadow-sm">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedCarIds.length === paginatedCars.length && paginatedCars.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCarIds(paginatedCars.map((c) => c.id))
                                else setSelectedCarIds([])
                              }}
                            />
                          </th>
                          <th>Vehicle</th>
                          <th>Specs</th>
                          <th>Price & EMI</th>
                          <th>Nova 200-Pt Check</th>
                          <th>Listing Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCars.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              <i className="bi bi-car-front fs-2 d-block mb-2"></i>
                              No vehicles matched your filter. Click "Reset Factory Cars" to restore.
                            </td>
                          </tr>
                        ) : (
                          paginatedCars.map((car) => (
                            <tr key={car.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedCarIds.includes(car.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedCarIds([...selectedCarIds, car.id])
                                    else setSelectedCarIds(selectedCarIds.filter((i) => i !== car.id))
                                  }}
                                />
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={car.image || '/mock_cars/honda_city_front.jpg'}
                                    alt={car.title}
                                    className="rounded me-2.5 border"
                                    style={{ width: '56px', height: '40px', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.src = '/mock_cars/honda_city_front.jpg'
                                    }}
                                  />
                                  <div>
                                    <div className="fw-bold small">{car.title}</div>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                      {car.variant} &bull; {car.year} &bull; {car.location}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small fw-semibold">{car.km || `${car.kmNumeric?.toLocaleString('en-IN')} km`}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {car.fuel} &bull; {car.transmission} &bull; {car.bodyType}
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold text-dark small">{car.priceFormatted || formatINR(car.price)}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{car.emi}</div>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleToggleInspection(car)}
                                  className="border-0 bg-transparent p-0 cursor-pointer"
                                  title="Click to toggle inspection status"
                                >
                                  {car.inspected ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                                      <i className="bi bi-shield-check"></i> Certified A+
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary-subtle text-secondary border">
                                      Standard
                                    </span>
                                  )}
                                </button>
                              </td>
                              <td>
                                <div className="dropdown">
                                  <button
                                    className={`btn btn-sm dropdown-toggle py-0 px-2 fw-semibold ${
                                      (car.listingStatus || 'Available') === 'Available' ? 'btn-outline-success' :
                                      (car.listingStatus || '') === 'Reserved' ? 'btn-outline-warning' :
                                      'btn-outline-secondary'
                                    }`}
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    onClick={() => {
                                      const nextStatus =
                                        (car.listingStatus || 'Available') === 'Available' ? 'Reserved' :
                                        car.listingStatus === 'Reserved' ? 'Sold' : 'Available'
                                      handleToggleCarStatus(car, nextStatus)
                                    }}
                                    title="Click to cycle status: Available -> Reserved -> Sold"
                                  >
                                    {car.listingStatus || 'Available'}
                                  </button>
                                </div>
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleOpenEditCar(car)}
                                    title="Edit Price, KM & Details"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteCar(car.id, car.title)}
                                    title="Delete from inventory"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="card-footer bg-transparent py-3 d-flex justify-content-between align-items-center">
                      <span className="small text-muted">
                        Page {currentPage} of {totalPages}
                      </span>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          >
                            &laquo; Prev
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          >
                            Next &raquo;
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 3: TEST DRIVE APPOINTMENTS (Submitted by Frontend)
            ========================================================== */}
            {activeTab === 'bookings' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Test Drive Bookings</h1>
                    <p className="text-muted mb-0 small">
                      Appointments submitted by frontend users across Tiruppur & Coimbatore hubs
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
                      onClick={handleExportTestDrivesCSV}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export Bookings CSV</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center gap-1.5"
                      onClick={() => setNewBookingModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Manual Booking</span>
                    </button>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Ref</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Time Slot</th>
                          <th>Location / Address</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testDrives.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              No test drive bookings recorded yet.
                            </td>
                          </tr>
                        ) : (
                          testDrives.map((td) => (
                            <tr key={td.id}>
                              <td>
                                <span className="font-monospace fw-bold text-primary small">{td.ref}</span>
                              </td>
                              <td>
                                <div className="fw-bold small">{td.customerName}</div>
                                <a href={`tel:${td.phone}`} className="text-decoration-none small text-muted">
                                  <i className="bi bi-telephone me-1"></i>{td.phone}
                                </a>
                              </td>
                              <td>
                                <div className="fw-semibold small">{td.carTitle}</div>
                                <small className="text-muted">{td.carPrice}</small>
                              </td>
                              <td>
                                <div className="small fw-medium">{td.slot}</div>
                                <small className="text-muted">{td.bookedAt}</small>
                              </td>
                              <td>
                                <span className={`badge ${td.locationType === 'home' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} mb-1`}>
                                  {td.locationType === 'home' ? 'Home Delivery' : 'Tiruppur Hub'}
                                </span>
                                <div className="text-muted text-truncate" style={{ fontSize: '11px', maxWidth: '200px' }}>
                                  {td.address}
                                </div>
                              </td>
                              <td>
                                <select
                                  className={`form-select form-select-sm fw-semibold ${
                                    td.status === 'Confirmed' ? 'text-success border-success' :
                                    td.status === 'Completed' ? 'text-secondary' :
                                    td.status === 'Cancelled' ? 'text-danger border-danger' :
                                    'text-warning border-warning'
                                  }`}
                                  value={td.status}
                                  onChange={(e) => {
                                    updateTestDriveStatus(td.id, e.target.value)
                                    showToast(`Booking ${td.ref} updated to ${e.target.value}`)
                                  }}
                                  style={{ width: '130px' }}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0 px-2"
                                  onClick={() => {
                                    if (window.confirm(`Delete booking ${td.ref}?`)) {
                                      deleteTestDrive(td.id)
                                      showToast(`Removed booking ${td.ref}`)
                                    }
                                  }}
                                  title="Delete booking"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 4: SELL CAR REQUESTS (From SellScreen)
            ========================================================== */}
            {activeTab === 'sell-requests' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Customer Car Sell Enquiries</h1>
                    <p className="text-muted mb-0 small">
                      Trade-in & evaluation requests submitted by car owners from the SellScreen valuation tool
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
                      onClick={() => {
                        const headers = ['Request_ID', 'Reg_Number', 'Vehicle', 'Year', 'KM', 'Estimated_Range', 'Phone', 'Status', 'Submitted']
                        const rows = sellRequests.map((sr) => [
                          sr.id,
                          `"${sr.regNumber}"`,
                          `"${sr.carTitle}"`,
                          sr.year,
                          `"${sr.km}"`,
                          `"${sr.estimatedRange}"`,
                          `"${sr.phone}"`,
                          sr.status,
                          `"${sr.submittedAt}"`
                        ])
                        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
                        const link = document.createElement('a')
                        link.href = encodeURI(csv)
                        link.download = `Nova_Sell_Requests_${new Date().toISOString().slice(0, 10)}.csv`
                        link.click()
                        showToast('Sell requests exported to CSV')
                      }}
                    >
                      <i className="bi bi-download"></i>
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <div className="card border-0 shadow-sm">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID / Reg No</th>
                          <th>Vehicle Spec</th>
                          <th>Instant Valuation Range</th>
                          <th>Owner Contact</th>
                          <th>Doorstep Inspection</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellRequests.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              No vehicle sell requests submitted yet.
                            </td>
                          </tr>
                        ) : (
                          sellRequests.map((sr) => (
                            <tr key={sr.id}>
                              <td>
                                <div className="font-monospace fw-bold text-primary small">{sr.id}</div>
                                <div className="badge bg-dark font-monospace text-uppercase" style={{ fontSize: '11px' }}>
                                  {sr.regNumber}
                                </div>
                              </td>
                              <td>
                                <div className="fw-semibold small">{sr.carTitle}</div>
                                <small className="text-muted">
                                  {sr.km} &bull; Year {sr.year}
                                </small>
                              </td>
                              <td>
                                <span className="fw-bold text-success font-monospace small">
                                  {sr.estimatedRange}
                                </span>
                                {sr.photoCount > 0 && (
                                  <div className="text-muted" style={{ fontSize: '11px' }}>
                                    <i className="bi bi-camera me-1"></i>{sr.photoCount} photos uploaded
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className="small fw-medium">{sr.customerName}</div>
                                <a href={`tel:${sr.phone}`} className="text-decoration-none small text-muted">
                                  <i className="bi bi-telephone me-1"></i>{sr.phone}
                                </a>
                              </td>
                              <td>
                                <span className="small text-muted">{sr.inspectionScheduled || 'Pending Hub Contact'}</span>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm fw-semibold"
                                  value={sr.status}
                                  onChange={(e) => {
                                    updateSellRequestStatus(sr.id, e.target.value)
                                    showToast(`Sell request ${sr.id} updated to ${e.target.value}`)
                                  }}
                                  style={{ width: '160px' }}
                                >
                                  <option value="Under Review">Under Review</option>
                                  <option value="Inspection Scheduled">Inspection Scheduled</option>
                                  <option value="Offer Accepted">Offer Accepted</option>
                                  <option value="Purchased">Purchased</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger py-0 px-2"
                                  onClick={() => {
                                    if (window.confirm(`Delete sell request ${sr.id}?`)) {
                                      deleteSellRequest(sr.id)
                                      showToast(`Removed request ${sr.id}`)
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 5: CUSTOMER LEADS & INQUIRIES
            ========================================================== */}
            {activeTab === 'leads' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Customer Leads & Consultations</h1>
                    <p className="text-muted mb-0 small">
                      Inquiries generated via WhatsApp button, direct telephone calls, and EMI financing consultations
                    </p>
                  </div>
                </div>

                <div className="row g-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="col-md-6 col-lg-4">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge bg-primary-subtle text-primary fw-semibold">
                              {lead.type}
                            </span>
                            <small className="text-muted">{lead.date}</small>
                          </div>
                          <h5 className="card-title fw-bold small mb-1">{lead.carTitle}</h5>
                          <p className="text-muted small mb-2">{lead.customerName}</p>
                          <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                            <span className="badge bg-secondary-subtle text-secondary">
                              {lead.status}
                            </span>
                            <a
                              href={`tel:${lead.phone}`}
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            >
                              <i className="bi bi-telephone"></i>
                              <span>Call {lead.phone}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 6: ANALYTICS & MARKET METRICS
            ========================================================== */}
            {activeTab === 'analytics' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Dealership Market Analytics</h1>
                    <p className="text-muted mb-0 small">
                      Conversion telemetry and regional demand metrics across Tamil Nadu used car market
                    </p>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center">
                      <div className="text-muted small fw-semibold mb-1">Avg. Inventory Holding Period</div>
                      <h2 className="fw-bold text-primary mb-0">16.4 Days</h2>
                      <small className="text-success mt-1 d-block">&darr; 3.2 days vs market avg (26 days)</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center">
                      <div className="text-muted small fw-semibold mb-1">Test Drive to Sale Conversion</div>
                      <h2 className="fw-bold text-success mb-0">38.2%</h2>
                      <small className="text-success mt-1 d-block">&uarr; Industry benchmark (22%)</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-center">
                      <div className="text-muted small fw-semibold mb-1">Average Realized Car Price</div>
                      <h2 className="fw-bold text-dark mb-0">₹ 8,95,000</h2>
                      <small className="text-muted mt-1 d-block">Coimbatore &bull; Tiruppur belt</small>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm p-4">
                  <h4 className="fw-bold small mb-3">Top In-Demand Vehicles on Platform</h4>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Model</th>
                          <th>Views</th>
                          <th>Test Drive Requests</th>
                          <th>Demand Velocity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { rank: 1, model: 'Honda City ZX CVT', views: '1,420', td: '14', speed: 'Very High' },
                          { rank: 2, model: 'Maruti Suzuki Swift ZXi', views: '1,190', td: '11', speed: 'High' },
                          { rank: 3, model: 'Toyota Fortuner 4x4', views: '980', td: '9', speed: 'High' },
                          { rank: 4, model: 'Volkswagen Vento 1.0 TSI', views: '780', td: '7', speed: 'Moderate' },
                          { rank: 5, model: 'Hyundai Grand i10 Nios', views: '650', td: '6', speed: 'Moderate' },
                        ].map((item) => (
                          <tr key={item.rank}>
                            <td className="fw-bold">{item.rank}</td>
                            <td>{item.model}</td>
                            <td>{item.views}</td>
                            <td>{item.td}</td>
                            <td>
                              <span className="badge bg-success-subtle text-success">{item.speed}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ==========================================================
                TAB 7: DEALERSHIP SETTINGS
            ========================================================== */}
            {activeTab === 'settings' && (
              <>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Dealership Hub Settings</h1>
                    <p className="text-muted mb-0 small">
                      Configure Nova Motors showroom location, concierge telephone numbers, and inventory state
                    </p>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4">
                      <h4 className="fw-bold small mb-3">Showroom Location & Contact</h4>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Primary Hub Name</label>
                        <input type="text" className="form-control form-control-sm" readOnly value="Nova Motors - Certified Pre-Owned Cars" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Hub Address (Tiruppur)</label>
                        <textarea className="form-control form-control-sm" rows="2" readOnly value="14, Avinashi Main Road, Gandhi Nagar, Tiruppur, Tamil Nadu - 641603" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold">Concierge Phone Line</label>
                        <input type="text" className="form-control form-control-sm" readOnly value="+91 94882 12044" />
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4">
                      <h4 className="fw-bold small mb-3">Local Storage & Demo Data Management</h4>
                      <p className="text-muted small">
                        The admin console utilizes live browser localStorage (two-way sync) connected to the customer-facing store.
                      </p>
                      <div className="p-3 bg-light rounded border mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold">Live Cars in Storage:</span>
                          <span className="badge bg-primary">{cars.length} vehicles</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold">Test Drives Logged:</span>
                          <span className="badge bg-success">{testDrives.length} bookings</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="small fw-semibold">Sell Requests Logged:</span>
                          <span className="badge bg-warning text-dark">{sellRequests.length} requests</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={handleResetCars}
                      >
                        <i className="bi bi-arrow-counterclockwise me-1.5"></i>
                        Reset All Cars to Factory Defaults
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="admin-footer border-top bg-body py-3 px-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small text-muted">
            <div>
              &copy; 2026 <strong>Nova Motors</strong> &bull; Certified Pre-Owned Automotive Platform
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success">&bull; Real-Time Frontend Sync Enabled</span>
              <button
                type="button"
                onClick={onReturnToStore}
                className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
              >
                Storefront &rarr;
              </button>
            </div>
          </div>
        </footer>

      </div>

      {/* ==============================================================
          MODALS
      ============================================================== */}

      {/* 1. Add Vehicle Modal */}
      {addCarModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Add New Vehicle to Inventory</h5>
                  <small className="text-muted">Will immediately appear on customer store and search filters</small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAddCarModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSaveNewCar}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Make & Model */}
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Car Make / Brand</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.make}
                        onChange={(e) => setNewCarForm({ ...newCarForm, make: e.target.value })}
                      >
                        {['Toyota', 'Honda', 'Maruti Suzuki', 'Hyundai', 'Tata', 'Volkswagen', 'Mahindra', 'Kia', 'BMW', 'Skoda', 'MG', 'Renault'].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Model Name</label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        placeholder="e.g. Fortuner / City / Swift"
                        value={newCarForm.model}
                        onChange={(e) => setNewCarForm({ ...newCarForm, model: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Manufacturing Year</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.year}
                        onChange={(e) => setNewCarForm({ ...newCarForm, year: e.target.value })}
                      >
                        {['2025', '2024', '2023', '2022', '2021', '2020', '2019'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    {/* Title & Variant */}
                    <div className="col-md-8">
                      <label className="form-label small fw-semibold">Listing Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 2023 Toyota Fortuner 4x4 Sigma"
                        value={newCarForm.title}
                        onChange={(e) => setNewCarForm({ ...newCarForm, title: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Trim / Variant</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. ZX CVT / 4x4 AT"
                        value={newCarForm.variant}
                        onChange={(e) => setNewCarForm({ ...newCarForm, variant: e.target.value })}
                      />
                    </div>

                    {/* Price & KM */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Price (in INR ₹)</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          required
                          className="form-control"
                          placeholder="e.g. 1150000"
                          value={newCarForm.price}
                          onChange={(e) => setNewCarForm({ ...newCarForm, price: e.target.value })}
                        />
                      </div>
                      <small className="text-muted font-monospace mt-1 d-block">
                        Formatted: {formatINR(newCarForm.price)}
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Kilometers Driven</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          required
                          className="form-control"
                          placeholder="e.g. 28000"
                          value={newCarForm.kmNumeric}
                          onChange={(e) => setNewCarForm({ ...newCarForm, kmNumeric: e.target.value })}
                        />
                        <span className="input-group-text">km</span>
                      </div>
                    </div>

                    {/* Body Type, Fuel & Transmission */}
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Body Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.bodyType}
                        onChange={(e) => setNewCarForm({ ...newCarForm, bodyType: e.target.value })}
                      >
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="MPV">MPV</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Fuel Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.fuel}
                        onChange={(e) => setNewCarForm({ ...newCarForm, fuel: e.target.value })}
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Transmission</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.transmission}
                        onChange={(e) => setNewCarForm({ ...newCarForm, transmission: e.target.value })}
                      >
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>

                    {/* Location & Status */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Hub Location</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={newCarForm.location}
                        onChange={(e) => setNewCarForm({ ...newCarForm, location: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Listing Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCarForm.listingStatus}
                        onChange={(e) => setNewCarForm({ ...newCarForm, listingStatus: e.target.value })}
                      >
                        <option value="Available">Available (Visible in Store)</option>
                        <option value="Reserved">Reserved</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>

                    {/* Image Preset Picker */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Select Car Photo Preset</label>
                      <div className="d-flex gap-2 flex-wrap mb-2">
                        {PRESET_CAR_IMAGES.map((preset) => (
                          <button
                            key={preset.path}
                            type="button"
                            onClick={() => setNewCarForm({ ...newCarForm, image: preset.path })}
                            className={`btn btn-sm d-flex align-items-center gap-1.5 ${
                              newCarForm.image === preset.path ? 'btn-primary' : 'btn-outline-secondary'
                            }`}
                          >
                            <img src={preset.path} alt="" style={{ width: '20px', height: '14px', objectFit: 'cover' }} />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Or enter custom image path (e.g. /mock_cars/vw_vento_white.jpg)"
                        value={newCarForm.image}
                        onChange={(e) => setNewCarForm({ ...newCarForm, image: e.target.value })}
                      />
                    </div>

                    {/* Nova 200-Point Inspection Toggle */}
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="novaInspectedSwitch"
                          checked={newCarForm.inspected}
                          onChange={(e) => setNewCarForm({ ...newCarForm, inspected: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold" htmlFor="novaInspectedSwitch">
                          Nova 200-Point Certified Inspection Badge (Passed A+ Grade)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setAddCarModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="bi bi-check-lg me-1"></i> Add Vehicle to Store
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Edit Vehicle Modal */}
      {editCarModalOpen && editingCar && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold mb-0">Quick Edit Vehicle</h5>
                  <small className="text-muted">{editingCar.title}</small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditCarModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSaveEditCar}>
                <div className="modal-body p-4 space-y-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Price (INR ₹)</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        required
                        className="form-control"
                        value={editingCar.price}
                        onChange={(e) => setEditingCar({ ...editingCar, price: e.target.value })}
                      />
                    </div>
                    <small className="text-muted font-monospace mt-1 d-block">
                      {formatINR(editingCar.price)}
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Kilometers Driven</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        className="form-control"
                        value={editingCar.kmNumeric || ''}
                        onChange={(e) => setEditingCar({ ...editingCar, kmNumeric: e.target.value })}
                      />
                      <span className="input-group-text">km</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Listing Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={editingCar.listingStatus || 'Available'}
                      onChange={(e) => setEditingCar({ ...editingCar, listingStatus: e.target.value })}
                    >
                      <option value="Available">Available (Live on Store)</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Showroom Hub Location</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editingCar.location || ''}
                      onChange={(e) => setEditingCar({ ...editingCar, location: e.target.value })}
                    />
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editInspectedSwitch"
                      checked={editingCar.inspected || false}
                      onChange={(e) => setEditingCar({ ...editingCar, inspected: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="editInspectedSwitch">
                      Nova Certified Inspected Badge
                    </label>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditCarModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Changes & Sync
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manual New Booking Quick Modal */}
      {newBookingModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Customer Test Drive</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setNewBookingModalOpen(false)}
                ></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const selectedCarObj = cars.find((c) => c.id === newBookingForm.carId) || cars[0]
                  addTestDrive({
                    carId: selectedCarObj.id,
                    carTitle: selectedCarObj.title,
                    carPrice: selectedCarObj.priceFormatted,
                    carImage: selectedCarObj.image,
                    customerName: newBookingForm.customerName || 'Walk-in Customer',
                    phone: newBookingForm.phone || '98421 00000',
                    slot: newBookingForm.slot,
                    locationType: newBookingForm.locationType,
                    address: newBookingForm.address
                  })
                  setNewBookingModalOpen(false)
                  showToast('Test drive appointment scheduled')
                }}
              >
                <div className="modal-body p-4 space-y-3">
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Select Vehicle</label>
                    <select
                      className="form-select form-select-sm"
                      value={newBookingForm.carId}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, carId: e.target.value })}
                    >
                      {cars.map((c) => (
                        <option key={c.id} value={c.id}>{c.title} ({c.priceFormatted})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-control form-control-sm"
                      placeholder="e.g. Suresh Kumar"
                      value={newBookingForm.customerName}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      className="form-control form-control-sm"
                      placeholder="e.g. 98421 54321"
                      value={newBookingForm.phone}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Time Slot</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newBookingForm.slot}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, slot: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Test Drive Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={newBookingForm.locationType}
                      onChange={(e) => setNewBookingForm({ ...newBookingForm, locationType: e.target.value })}
                    >
                      <option value="home">Home Doorstep</option>
                      <option value="hub">Tiruppur Hub Visit</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setNewBookingModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Create Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
          <div className="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-success"></i>
                <span>{toastMessage.msg}</span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-app {
          background-color: var(--bs-tertiary-bg, #f8fafc);
          color: var(--bs-body-color, #0f172a);
        }
        .admin-header .hamburger-menu {
          position: static !important;
          top: auto !important;
          left: auto !important;
          transform: none !important;
        }
        .admin-wrapper.sidebar-collapsed .admin-sidebar .sidebar-hide-collapsed {
          display: none !important;
        }
        .admin-wrapper.sidebar-collapsed .admin-sidebar .sidebar-bottom-btn span {
          display: none;
        }
        .admin-sidebar .nav-link:not(.active) {
          background-color: transparent;
          color: var(--bs-body-color);
        }
        .admin-sidebar .nav-link:not(.active):hover {
          background-color: var(--bs-secondary-bg, #f1f5f9);
        }
        .hover-bg-light:hover {
          background-color: var(--bs-tertiary-bg, #f8f9fa);
        }
      `}</style>

    </div>
  )
}

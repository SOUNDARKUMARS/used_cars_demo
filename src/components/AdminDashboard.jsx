import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  INITIAL_METIS_PRODUCTS,
  METIS_ORDERS,
  METIS_ACTIVITIES,
  REVENUE_DATA
} from '../data/metisMockData'

export default function AdminDashboard({ onLogout, onReturnToStore }) {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('theme') || localStorage.getItem('metis_theme') || 'light'
  })

  // Navigation tab: 'dashboard' | 'products' | 'orders' | 'analytics' | 'users' | 'settings'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || 'dashboard'
  })

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [elementsOpen, setElementsOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)

  // Top header dropdowns
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResultsOpen, setSearchResultsOpen] = useState(false)

  // Chart state (Dashboard Overview)
  const [revenuePeriod, setRevenuePeriod] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Product Management state
  const [products, setProducts] = useState(INITIAL_METIS_PRODUCTS)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [productSalesPeriod, setProductSalesPeriod] = useState('7d')
  const itemsPerPage = 8

  // Modals
  const [addProductModalOpen, setAddProductModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [newItemModalOpen, setNewItemModalOpen] = useState(false)

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'electronics',
    price: '',
    stock: '',
    description: '',
    status: 'published'
  })

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Search input ref for Ctrl+K shortcut
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

    // Ctrl+K keyboard shortcut
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      // When leaving admin dashboard, clean up link so user site is 100% untouched
      const existing = document.getElementById('metis-theme-css')
      if (existing) existing.remove()
      document.documentElement.removeAttribute('data-bs-theme')
    }
  }, [])

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Quick refresh animation
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      showToast('Dashboard metrics refreshed')
    }, 600)
  }

  // Filtered Products computation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())

      const matchesCat = !categoryFilter || p.category === categoryFilter

      let matchesStock = true
      if (stockFilter === 'in-stock') matchesStock = p.stock > 20
      else if (stockFilter === 'low-stock') matchesStock = p.stock > 0 && p.stock <= 20
      else if (stockFilter === 'out-of-stock') matchesStock = p.stock === 0

      return matchesSearch && matchesCat && matchesStock
    })
  }, [products, productSearch, categoryFilter, stockFilter])

  // Pagination for products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage])

  // Product Statistics
  const productStats = useMemo(() => {
    const total = products.length
    const inStock = products.filter((p) => p.stock > 20).length
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length
    const totalVal = products.reduce((acc, p) => acc + p.price * p.stock, 0)
    return {
      total,
      inStock,
      lowStock,
      totalValue: Math.round(totalVal)
    }
  }, [products])

  // Category Distribution stats
  const categoryStats = useMemo(() => {
    const counts = {}
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      percentage: Math.round((count / products.length) * 100)
    }))
  }, [products])

  // Handle select all products
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id))
    } else {
      setSelectedProductIds([])
    }
  }

  // Handle individual select
  const handleSelectProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Bulk actions
  const handleBulkAction = (action) => {
    if (selectedProductIds.length === 0) return
    if (action === 'delete') {
      if (confirm(`Delete ${selectedProductIds.length} selected product(s)?`)) {
        setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)))
        setSelectedProductIds([])
        showToast('Products deleted successfully')
      }
    } else if (action === 'publish') {
      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id) ? { ...p, status: 'published' } : p
        )
      )
      setSelectedProductIds([])
      showToast('Products published')
    } else if (action === 'unpublish') {
      setProducts((prev) =>
        prev.map((p) =>
          selectedProductIds.includes(p.id) ? { ...p, status: 'draft' } : p
        )
      )
      setSelectedProductIds([])
      showToast('Products marked as draft')
    }
  }

  // Add Product form submission
  const handleSaveProduct = (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) {
      alert('Please provide product name and price.')
      return
    }

    const createdProd = {
      id: Date.now(),
      name: newProduct.name,
      sku: newProduct.sku || `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newProduct.category || 'electronics',
      price: parseFloat(newProduct.price) || 99.99,
      stock: parseInt(newProduct.stock) || 10,
      status: newProduct.status || 'published',
      created: new Date().toISOString().split('T')[0],
      image: '/metis/assets/images/product-placeholder.svg',
      description: newProduct.description || ''
    }

    setProducts([createdProd, ...products])
    setAddProductModalOpen(false)
    setNewProduct({
      name: '',
      sku: '',
      category: 'electronics',
      price: '',
      stock: '',
      description: '',
      status: 'published'
    })
    showToast(`Added product "${createdProd.name}"`)
  }

  // Delete single product
  const handleDeleteProduct = (prod) => {
    if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== prod.id))
      showToast(`Deleted ${prod.name}`)
    }
  }

  // Duplicate single product
  const handleDuplicateProduct = (prod) => {
    const copy = {
      ...prod,
      id: Date.now(),
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
      created: new Date().toISOString().split('T')[0]
    }
    setProducts([copy, ...products])
    showToast(`Duplicated ${prod.name}`)
  }

  // Export CSV download
  const handleExportCSV = () => {
    const headers = 'Name,SKU,Category,Price,Stock,Status,Created\n'
    const rows = filteredProducts
      .map(
        (p) =>
          `"${p.name}","${p.sku}","${p.category}","${p.price}","${p.stock}","${p.status}","${p.created}"`
      )
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'metis_products.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Products catalog exported to CSV')
  }

  // Search results suggestions
  const globalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return [
      { title: 'Products Catalog', type: 'Page', tab: 'products' },
      { title: 'Order Management', type: 'Page', tab: 'orders' },
      { title: 'Analytics & Trends', type: 'Reports', tab: 'analytics' },
      { title: 'Users & Permissions', type: 'Admin', tab: 'users' },
      ...products
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 3)
        .map((p) => ({ title: p.name, type: 'Product', tab: 'products' }))
    ]
  }, [searchQuery, products])

  return (
    <div className="admin-app" style={{ minHeight: '100vh', width: '100%' }}>
      <div className={`admin-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="admin-wrapper">
        
        {/* ==============================================================
            HEADER / NAVBAR
        ============================================================== */}
        <header className="admin-header">
          <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
            <div className="container-fluid px-0">
              {/* Brand Logo & Name */}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="navbar-brand d-flex align-items-center border-0 bg-transparent text-decoration-none cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="/metis/assets/images/logo.svg"
                  alt="Metis"
                  height="32"
                  className="d-inline-block align-text-top me-2"
                />
                <span className="h4 mb-0 fw-bold text-primary-emphasis">Metis</span>
              </button>

              {/* Hamburger Sidebar Toggle */}
              <button
                className="hamburger-menu btn btn-link p-1 text-dark"
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

              {/* Search Bar with Ctrl+K shortcut */}
              <div className="search-container flex-grow-1 mx-4 d-none d-md-block position-relative">
                <div className="position-relative">
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="form-control"
                    placeholder="Search... (Ctrl+K)"
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
                          <i className="bi bi-file-text me-2 text-muted"></i>
                          <span>{res.title}</span>
                          <small className="ms-auto badge bg-light text-muted border">
                            {res.type}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Icons */}
              <div className="navbar-nav flex-row align-items-center ms-auto">
                {/* Theme Toggle Button */}
                <button
                  className="btn btn-outline-secondary me-2 d-flex align-items-center justify-center"
                  type="button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  title="Toggle theme"
                  style={{ width: '38px', height: '38px' }}
                >
                  {theme === 'light' ? (
                    <i className="bi bi-moon-fill"></i>
                  ) : (
                    <i className="bi bi-sun-fill text-warning"></i>
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  className="btn btn-outline-secondary me-2 d-none d-lg-inline-flex align-items-center justify-center"
                  type="button"
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                  style={{ width: '38px', height: '38px' }}
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </button>

                {/* Notifications Dropdown */}
                <div className="position-relative me-2">
                  <button
                    className="btn btn-outline-secondary position-relative d-flex align-items-center justify-center"
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    style={{ width: '38px', height: '38px' }}
                  >
                    <i className="bi bi-bell"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                      3
                    </span>
                  </button>

                  {notificationsOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 p-0"
                      style={{ minWidth: '280px', zIndex: 1050 }}
                    >
                      <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">Notifications</h6>
                        <span className="badge bg-primary-subtle text-primary">3 New</span>
                      </div>
                      <div className="list-group list-group-flush small">
                        <a href="#!" className="list-group-item list-group-item-action py-2.5">
                          <div className="fw-semibold">New user registered</div>
                          <small className="text-muted">Priya Raman &bull; 2 min ago</small>
                        </a>
                        <a href="#!" className="list-group-item list-group-item-action py-2.5">
                          <div className="fw-semibold">Server status update</div>
                          <small className="text-muted">High capacity &bull; 15 min ago</small>
                        </a>
                        <a href="#!" className="list-group-item list-group-item-action py-2.5">
                          <div className="fw-semibold">New message received</div>
                          <small className="text-muted">Support concierge &bull; 1 hour ago</small>
                        </a>
                      </div>
                      <div className="p-2 text-center border-top">
                        <small className="text-primary fw-semibold cursor-pointer">View all notifications</small>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu Dropdown */}
                <div className="position-relative">
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center py-1 px-2"
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <img
                      src="/metis/assets/images/avatar-placeholder.svg"
                      alt="User Avatar"
                      width="24"
                      height="24"
                      className="rounded-circle me-2"
                    />
                    <span className="d-none d-md-inline fw-semibold small">John Doe</span>
                    <i className="bi bi-chevron-down ms-1 small"></i>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute shadow-lg border mt-2 end-0 py-1"
                      style={{ minWidth: '200px', zIndex: 1050 }}
                    >
                      <div className="px-3 py-2 border-bottom">
                        <p className="mb-0 fw-bold small">John Doe</p>
                        <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>admin@123 &bull; Superadmin</p>
                      </div>
                      <button
                        className="dropdown-item py-2 d-flex align-items-center small"
                        onClick={() => {
                          setActiveTab('dashboard')
                          setUserDropdownOpen(false)
                        }}
                      >
                        <i className="bi bi-person me-2"></i>Profile
                      </button>
                      <button
                        className="dropdown-item py-2 d-flex align-items-center small"
                        onClick={() => {
                          setActiveTab('settings')
                          setUserDropdownOpen(false)
                        }}
                      >
                        <i className="bi bi-gear me-2"></i>Settings
                      </button>
                      <hr className="dropdown-divider my-1" />
                      <button
                        className="dropdown-item py-2 d-flex align-items-center small text-primary fw-medium"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onReturnToStore()
                        }}
                      >
                        <i className="bi bi-shop me-2"></i>View Nova Motors Store
                      </button>
                      <button
                        className="dropdown-item py-2 d-flex align-items-center small text-danger fw-semibold"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onLogout()
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Sign Out
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </nav>
        </header>

        {/* ==============================================================
            SIDEBAR (Exact Metis Navigation)
        ============================================================== */}
        <aside
          className={`admin-sidebar ${mobileSidebarOpen ? 'show' : ''}`}
          id="admin-sidebar"
        >
          <div className="sidebar-content">
            <nav className="sidebar-nav">
              <ul className="nav flex-column">
                
                {/* 1. Dashboard */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('dashboard')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                  </button>
                </li>

                {/* 2. Go Pro */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-rocket-takeoff"></i>
                    <span>Go Pro</span>
                    <span className="badge bg-danger rounded-pill ms-auto">Hot</span>
                  </a>
                </li>

                {/* 3. Analytics */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('analytics')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-graph-up"></i>
                    <span>Analytics</span>
                  </button>
                </li>

                {/* 4. Users */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('users')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-people"></i>
                    <span>Users</span>
                  </button>
                </li>

                {/* 5. Products (Catalog - matches products.html) */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('products')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-box"></i>
                    <span>Products</span>
                    <span className="badge bg-primary-subtle text-primary rounded-pill ms-auto">
                      {products.length}
                    </span>
                  </button>
                </li>

                {/* 6. Orders */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('orders')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-bag-check"></i>
                    <span>Orders</span>
                  </button>
                </li>

                {/* 7. Forms */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => { e.preventDefault(); showToast('Form builder component'); }}>
                    <i className="bi bi-ui-checks"></i>
                    <span>Forms</span>
                    <span className="badge bg-success rounded-pill ms-auto">New</span>
                  </a>
                </li>

                {/* 8. Elements (Collapsible) */}
                <li className="nav-item">
                  <button
                    className="nav-link w-100 text-start border-0 bg-transparent d-flex align-items-center"
                    type="button"
                    onClick={() => setElementsOpen(!elementsOpen)}
                  >
                    <i className="bi bi-puzzle"></i>
                    <span>Elements</span>
                    <span className="badge bg-primary rounded-pill ms-2 me-2" style={{ fontSize: '10px' }}>New</span>
                    <i className={`bi bi-chevron-down ms-auto transition-transform ${elementsOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  {elementsOpen && (
                    <div className="ps-3 py-1">
                      <ul className="nav nav-submenu flex-column">
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-grid me-2"></i>Overview</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-square me-2"></i>Buttons</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-exclamation-triangle me-2"></i>Alerts</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-award me-2"></i>Badges</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-card-text me-2"></i>Cards</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-table me-2"></i>Tables</a></li>
                      </ul>
                    </div>
                  )}
                </li>

                {/* 9. Reports */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => { e.preventDefault(); showToast('Generating monthly PDF report...'); }}>
                    <i className="bi bi-file-earmark-text"></i>
                    <span>Reports</span>
                  </a>
                </li>

                {/* 10. Messages */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => { e.preventDefault(); showToast('3 unread client inquiries'); }}>
                    <i className="bi bi-chat-dots"></i>
                    <span>Messages</span>
                    <span className="badge bg-danger rounded-pill ms-auto">3</span>
                  </a>
                </li>

                {/* 11. Calendar */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-calendar-event"></i>
                    <span>Calendar</span>
                  </a>
                </li>

                {/* 12. Files */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-folder2-open"></i>
                    <span>Files</span>
                  </a>
                </li>

                {/* 13. Pages (Collapsible) */}
                <li className="nav-item">
                  <button
                    className="nav-link w-100 text-start border-0 bg-transparent d-flex align-items-center"
                    type="button"
                    onClick={() => setPagesOpen(!pagesOpen)}
                  >
                    <i className="bi bi-file-earmark"></i>
                    <span>Pages</span>
                    <i className={`bi bi-chevron-down ms-auto transition-transform ${pagesOpen ? 'rotate-180' : ''}`}></i>
                  </button>
                  {pagesOpen && (
                    <div className="ps-3 py-1">
                      <ul className="nav nav-submenu flex-column">
                        <li className="nav-item"><button className="nav-link py-1 border-0 bg-transparent text-start" onClick={onReturnToStore}><i className="bi bi-box-arrow-in-right me-2"></i>Sign in</button></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-person-plus me-2"></i>Create account</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-envelope me-2"></i>Forgot password</a></li>
                        <li className="nav-item"><a className="nav-link py-1" href="#!"><i className="bi bi-lock me-2"></i>Lock screen</a></li>
                      </ul>
                    </div>
                  )}
                </li>

                {/* Section header: ADMIN */}
                <li className="nav-item mt-3">
                  <small className="text-muted px-3 text-uppercase fw-bold" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                    Admin
                  </small>
                </li>

                {/* 14. Settings */}
                <li className="nav-item">
                  <button
                    className={`nav-link w-100 text-start border-0 bg-transparent ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('settings')
                      setMobileSidebarOpen(false)
                    }}
                  >
                    <i className="bi bi-gear"></i>
                    <span>Settings</span>
                  </button>
                </li>

                {/* 15. Security */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => { e.preventDefault(); showToast('Security check: All protocols OK (2FA active)'); }}>
                    <i className="bi bi-shield-check"></i>
                    <span>Security</span>
                  </a>
                </li>

                {/* 16. Help & Support */}
                <li className="nav-item">
                  <a className="nav-link" href="#!" onClick={(e) => { e.preventDefault(); showToast('Support Documentation: Metis v1.0'); }}>
                    <i className="bi bi-question-circle"></i>
                    <span>Help & Support</span>
                  </a>
                </li>

                {/* Quick Link back to Store */}
                <li className="nav-item mt-4 pt-3 border-top border-secondary-subtle">
                  <button
                    onClick={onReturnToStore}
                    className="nav-link w-100 text-start border-0 bg-primary-subtle text-primary fw-semibold rounded-2 py-2"
                  >
                    <i className="bi bi-arrow-left-circle me-2"></i>
                    <span>Back to Nova Motors</span>
                  </button>
                </li>

              </ul>
            </nav>
          </div>
        </aside>

        {/* Sidebar Backdrop for mobile drawer */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop show"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}

        {/* ==============================================================
            MAIN CONTENT AREA
        ============================================================== */}
        <main id="main-content" className="admin-main">
          <div className="container-fluid p-3 p-lg-4">

            {/* TAB 1: DASHBOARD OVERVIEW (Metis index.html) */}
            {activeTab === 'dashboard' && (
              <>
                {/* Page Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Dashboard</h1>
                    <p className="text-muted mb-0 small">Last 30 days &bull; updated 5 minutes ago</p>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center"
                      onClick={() => setNewItemModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      <span>New Item</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={handleRefresh}
                      title="Refresh data"
                    >
                      <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-none d-sm-inline-flex align-items-center"
                      onClick={handleExportCSV}
                      title="Export data"
                    >
                      <i className="bi bi-download"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-none d-sm-inline-flex align-items-center"
                      onClick={() => setActiveTab('settings')}
                      title="Settings"
                    >
                      <i className="bi bi-gear"></i>
                    </button>
                  </div>
                </div>

                {/* 4 Stats Cards */}
                <div className="row g-3 g-lg-4 mb-4">
                  {/* Total Users */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-primary bg-opacity-10 text-primary me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-people" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Total Users</p>
                            <h3 className="mb-0 fw-bold">12,426</h3>
                            <small className="text-success-emphasis fw-medium">
                              <i className="bi bi-arrow-up"></i> +12.5%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-success bg-opacity-10 text-success me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-graph-up" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Revenue</p>
                            <h3 className="mb-0 fw-bold">$54,320</h3>
                            <small className="text-success-emphasis fw-medium">
                              <i className="bi bi-arrow-up"></i> +8.2%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orders */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-warning bg-opacity-10 text-warning me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-bag-check" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Orders</p>
                            <h3 className="mb-0 fw-bold">1,852</h3>
                            <small className="text-danger-emphasis fw-medium">
                              <i className="bi bi-arrow-down"></i> -2.1%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Avg Response */}
                  <div className="col-sm-6 col-xl-3">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-info bg-opacity-10 text-info me-3 p-3 rounded-3 d-flex align-items-center justify-content-center">
                            <i className="bi bi-clock-history" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Avg. Response</p>
                            <h3 className="mb-0 fw-bold">2.3s</h3>
                            <small className="text-success-emphasis fw-medium">
                              <i className="bi bi-arrow-up"></i> +5.4%
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Revenue Overview Chart & Recent Activity Feed */}
                <div className="row g-4 mb-4">
                  {/* Revenue Overview Interactive Chart */}
                  <div className="col-lg-8">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Revenue Overview</h2>
                        <div className="btn-group btn-group-sm" role="group">
                          {['7d', '30d', '90d', '1y'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              className={`btn ${revenuePeriod === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => setRevenuePeriod(p)}
                            >
                              {p.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        {/* Custom SVG Area Chart */}
                        <div className="position-relative" style={{ height: '300px', width: '100%' }}>
                          <svg viewBox="0 0 600 250" className="w-100 h-100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Horizontal guide lines */}
                            <line x1="40" y1="40" x2="580" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="40" y1="100" x2="580" y2="100" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="40" y1="160" x2="580" y2="160" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="40" y1="210" x2="580" y2="210" stroke="currentColor" strokeOpacity="0.15" />

                            {/* Dynamic polygon and line based on period */}
                            {revenuePeriod === '7d' && (
                              <>
                                <polygon
                                  points="50,170 120,135 200,110 280,90 360,105 440,70 550,45 550,210 50,210"
                                  fill="url(#revenueGrad)"
                                />
                                <polyline
                                  points="50,170 120,135 200,110 280,90 360,105 440,70 550,45"
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                />
                                {[
                                  { x: 50, y: 170, val: '$65k' },
                                  { x: 120, y: 135, val: '$78k' },
                                  { x: 200, y: 110, val: '$85k' },
                                  { x: 280, y: 90, val: '$92k' },
                                  { x: 360, y: 105, val: '$88k' },
                                  { x: 440, y: 70, val: '$95k' },
                                  { x: 550, y: 45, val: '$102k' }
                                ].map((pt, i) => (
                                  <g key={i} className="chart-point">
                                    <circle cx={pt.x} cy={pt.y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
                                    <title>{pt.val}</title>
                                  </g>
                                ))}
                              </>
                            )}

                            {revenuePeriod === '30d' && (
                              <>
                                <polygon
                                  points="70,180 210,130 380,85 530,50 530,210 70,210"
                                  fill="url(#revenueGrad)"
                                />
                                <polyline
                                  points="70,180 210,130 380,85 530,50"
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                />
                                {[
                                  { x: 70, y: 180, val: '$280k' },
                                  { x: 210, y: 130, val: '$310k' },
                                  { x: 380, y: 85, val: '$345k' },
                                  { x: 530, y: 50, val: '$390k' }
                                ].map((pt, i) => (
                                  <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
                                ))}
                              </>
                            )}

                            {(revenuePeriod === '90d' || revenuePeriod === '1y') && (
                              <>
                                <polygon
                                  points="80,160 240,115 400,80 540,40 540,210 80,210"
                                  fill="url(#revenueGrad)"
                                />
                                <polyline
                                  points="80,160 240,115 400,80 540,40"
                                  fill="none"
                                  stroke="#2563eb"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                />
                                {[
                                  { x: 80, y: 160 },
                                  { x: 240, y: 115 },
                                  { x: 400, y: 80 },
                                  { x: 540, y: 40 }
                                ].map((pt, i) => (
                                  <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
                                ))}
                              </>
                            )}
                          </svg>

                          {/* X-Axis Labels */}
                          <div className="d-flex justify-content-between text-muted small px-3 mt-1">
                            {REVENUE_DATA[revenuePeriod].labels.map((lbl, idx) => (
                              <span key={idx}>{lbl}</span>
                            ))}
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-4 pt-3 border-top">
                          <div>
                            <span className="text-muted small">Total in period:</span>
                            <span className="ms-2 fw-bold text-dark">$184,500</span>
                          </div>
                          <div>
                            <span className="badge bg-success-subtle text-success">
                              <i className="bi bi-arrow-up-right me-1"></i>
                              {REVENUE_DATA[revenuePeriod].growth} vs previous
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="col-lg-4">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <h2 className="h5 card-title mb-0 fw-bold">Recent Activity</h2>
                        <span className="badge bg-secondary-subtle text-secondary small">Live</span>
                      </div>
                      <div className="card-body p-3 overflow-auto" style={{ maxHeight: '380px' }}>
                        <div className="activity-feed">
                          {METIS_ACTIVITIES.map((act, index) => (
                            <div key={index} className="activity-item d-flex mb-3">
                              <div
                                className={`activity-icon bg-${act.color} bg-opacity-10 text-${act.color} rounded-circle me-3 d-flex align-items-center justify-content-center shrink-0`}
                                style={{ width: '36px', height: '36px', minWidth: '36px' }}
                              >
                                <i className={`bi ${act.icon}`}></i>
                              </div>
                              <div className="activity-content">
                                <p className="mb-0 fw-semibold small text-dark">{act.title}</p>
                                <small className="text-muted">{act.subtitle}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Secondary Charts (User Growth & Order Status Distribution) */}
                <div className="row g-4 mb-4">
                  {/* User Growth */}
                  <div className="col-lg-6">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">User Growth (Last 7 Days)</h2>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-end justify-content-between gap-2 pt-4" style={{ height: '220px' }}>
                          {[
                            { day: 'Mon', h: 60, val: '240' },
                            { day: 'Tue', h: 75, val: '310' },
                            { day: 'Wed', h: 85, val: '380' },
                            { day: 'Thu', h: 70, val: '290' },
                            { day: 'Fri', h: 90, val: '430' },
                            { day: 'Sat', h: 95, val: '490' },
                            { day: 'Sun', h: 100, val: '540' }
                          ].map((bar, i) => (
                            <div key={i} className="d-flex flex-column align-items-center flex-grow-1 h-100 justify-content-end">
                              <span className="text-muted small mb-1" style={{ fontSize: '10px' }}>{bar.val}</span>
                              <div
                                className="w-100 rounded-top bg-primary"
                                style={{
                                  height: `${bar.h}%`,
                                  maxWidth: '42px',
                                  opacity: 0.85
                                }}
                              ></div>
                              <span className="text-muted small mt-2">{bar.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Distribution */}
                  <div className="col-lg-6">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Order Status Distribution</h2>
                      </div>
                      <div className="card-body p-3 p-lg-4 d-flex flex-column flex-sm-row align-items-center justify-content-around">
                        {/* Donut Chart representation */}
                        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '180px', height: '180px' }}>
                          <svg viewBox="0 0 36 36" className="w-100 h-100">
                            {/* Background circle */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="3.8"
                            />
                            {/* Delivered 65% (green) */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="4"
                              strokeDasharray="65, 100"
                            />
                            {/* Processing 20% (blue) */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="4"
                              strokeDasharray="20, 100"
                              strokeDashoffset="-65"
                            />
                            {/* Shipped 10% (orange) */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="4"
                              strokeDasharray="10, 100"
                              strokeDashoffset="-85"
                            />
                            {/* Cancelled 5% (red) */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="4"
                              strokeDasharray="5, 100"
                              strokeDashoffset="-95"
                            />
                          </svg>
                          <div className="position-absolute text-center">
                            <span className="h4 mb-0 fw-bold d-block">1,852</span>
                            <small className="text-muted" style={{ fontSize: '10px' }}>Total</small>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-3 mt-sm-0">
                          <div className="d-flex align-items-center mb-2">
                            <span className="d-inline-block rounded-circle bg-success me-2" style={{ width: '10px', height: '10px' }}></span>
                            <span className="small text-muted me-3">Delivered</span>
                            <span className="small fw-bold ms-auto">65% (1,204)</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="d-inline-block rounded-circle bg-primary me-2" style={{ width: '10px', height: '10px' }}></span>
                            <span className="small text-muted me-3">Processing</span>
                            <span className="small fw-bold ms-auto">20% (370)</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <span className="d-inline-block rounded-circle bg-warning me-2" style={{ width: '10px', height: '10px' }}></span>
                            <span className="small text-muted me-3">Shipped</span>
                            <span className="small fw-bold ms-auto">10% (185)</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <span className="d-inline-block rounded-circle bg-danger me-2" style={{ width: '10px', height: '10px' }}></span>
                            <span className="small text-muted me-3">Cancelled</span>
                            <span className="small fw-bold ms-auto">5% (93)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Recent Orders & Storage Status */}
                <div className="row g-4 mb-4">
                  {/* Recent Orders Table */}
                  <div className="col-lg-8">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                        <h2 className="h5 card-title mb-0 fw-bold">Recent Orders</h2>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-decoration-none"
                          onClick={() => setActiveTab('orders')}
                        >
                          View All
                        </button>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {METIS_ORDERS.map((ord) => (
                                <tr key={ord.id}>
                                  <td className="fw-medium text-primary">{ord.id}</td>
                                  <td>{ord.customer}</td>
                                  <td className="fw-bold">{ord.amount}</td>
                                  <td>
                                    <span
                                      className={`badge rounded-pill ${
                                        ord.status === 'completed'
                                          ? 'bg-success-subtle text-success'
                                          : ord.status === 'processing'
                                          ? 'bg-primary-subtle text-primary'
                                          : 'bg-warning-subtle text-warning'
                                      }`}
                                    >
                                      {ord.status}
                                    </span>
                                  </td>
                                  <td className="text-muted small">{ord.date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Status */}
                  <div className="col-lg-4">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Storage Status</h2>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div className="text-center py-2">
                          <i className="bi bi-hdd-network text-primary mb-2 d-inline-block" style={{ fontSize: '2.5rem' }}></i>
                          <h4 className="fw-bold mb-1">68.4 GB <span className="text-muted fw-normal fs-6">/ 100 GB</span></h4>
                          <p className="text-muted small mb-3">Enterprise Cloud Storage Usage</p>
                          <div className="progress mb-3" style={{ height: '8px' }}>
                            <div className="progress-bar bg-primary" style={{ width: '68.4%' }}></div>
                          </div>
                        </div>
                        <div className="small border-top pt-3 space-y-2">
                          <div className="d-flex justify-content-between mb-1.5">
                            <span className="text-muted"><i className="bi bi-file-image me-1"></i> Car Media & Images</span>
                            <span className="fw-bold">42.1 GB</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1.5">
                            <span className="text-muted"><i className="bi bi-database me-1"></i> Database & Backups</span>
                            <span className="fw-bold">18.3 GB</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted"><i className="bi bi-file-earmark-pdf me-1"></i> Inspection Reports</span>
                            <span className="fw-bold">8.0 GB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                TAB 2: PRODUCT MANAGEMENT (Exact Clone of Metis products.html)
            ============================================================== */}
            {activeTab === 'products' && (
              <>
                {/* Page Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                  <div>
                    <h1 className="h3 mb-0 fw-bold">Product Management</h1>
                    <p className="text-muted mb-0 small">Manage your product catalog and inventory</p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={handleExportCSV}
                    >
                      <i className="bi bi-download me-2"></i>Export
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={() => setImportModalOpen(true)}
                    >
                      <i className="bi bi-upload me-2"></i>Import
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center"
                      onClick={() => setAddProductModalOpen(true)}
                    >
                      <i className="bi bi-plus-lg me-2"></i>Add Product
                    </button>
                  </div>
                </div>

                {/* 4 Product Stats Widgets */}
                <div className="row g-4 mb-4">
                  {/* Total Products */}
                  <div className="col-xl-3 col-lg-6">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-primary bg-opacity-10 text-primary me-3 p-3 rounded-3">
                            <i className="bi bi-box" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Total Products</p>
                            <div className="h3 mb-0 fw-bold">{productStats.total}</div>
                            <small className="text-success-emphasis fw-medium">
                              <i className="bi bi-arrow-up"></i> +5% from last month
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* In Stock */}
                  <div className="col-xl-3 col-lg-6">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-success bg-opacity-10 text-success me-3 p-3 rounded-3">
                            <i className="bi bi-check-circle" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">In Stock</p>
                            <div className="h3 mb-0 fw-bold">{productStats.inStock}</div>
                            <small className="text-success-emphasis fw-medium">
                              <i className="bi bi-arrow-up"></i> Well stocked
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Low Stock */}
                  <div className="col-xl-3 col-lg-6">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-warning bg-opacity-10 text-warning me-3 p-3 rounded-3">
                            <i className="bi bi-exclamation-triangle" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Low Stock</p>
                            <div className="h3 mb-0 fw-bold">{productStats.lowStock}</div>
                            <small className="text-warning fw-medium">
                              <i className="bi bi-exclamation-circle"></i> Needs attention
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Value */}
                  <div className="col-xl-3 col-lg-6">
                    <div className="card stats-card h-100">
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center">
                          <div className="stats-icon bg-info bg-opacity-10 text-info me-3 p-3 rounded-3">
                            <i className="bi bi-currency-dollar" style={{ fontSize: '1.4rem' }}></i>
                          </div>
                          <div>
                            <p className="h6 mb-0 text-muted small">Total Value</p>
                            <div className="h3 mb-0 fw-bold">${productStats.totalValue.toLocaleString()}</div>
                            <small className="text-info fw-medium">
                              <i className="bi bi-info-circle"></i> Inventory value
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Row: Sales Performance & Category Distribution */}
                <div className="row g-4 mb-4">
                  {/* Sales Performance Area Chart */}
                  <div className="col-lg-8">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Sales Performance</h2>
                        <div className="btn-group btn-group-sm" role="group">
                          {['7d', '30d', '90d'].map((sp) => (
                            <button
                              key={sp}
                              type="button"
                              className={`btn ${productSalesPeriod === sp ? 'btn-primary' : 'btn-outline-secondary'}`}
                              onClick={() => setProductSalesPeriod(sp)}
                            >
                              {sp.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div style={{ height: '260px', width: '100%' }}>
                          <svg viewBox="0 0 600 220" className="w-100 h-100" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="prodSalesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            <line x1="30" y1="30" x2="580" y2="30" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="90" x2="580" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="150" x2="580" y2="150" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                            <line x1="30" y1="190" x2="580" y2="190" stroke="currentColor" strokeOpacity="0.15" />

                            <polygon
                              points="40,150 120,120 200,95 280,110 360,75 440,85 550,40 550,190 40,190"
                              fill="url(#prodSalesGrad)"
                            />
                            <polyline
                              points="40,150 120,120 200,95 280,110 360,75 440,85 550,40"
                              fill="none"
                              stroke="#2563eb"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            {[
                              { x: 40, y: 150 },
                              { x: 120, y: 120 },
                              { x: 200, y: 95 },
                              { x: 280, y: 110 },
                              { x: 360, y: 75 },
                              { x: 440, y: 85 },
                              { x: 550, y: 40 }
                            ].map((p, idx) => (
                              <circle key={idx} cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
                            ))}
                          </svg>
                          <div className="d-flex justify-content-between text-muted small px-3 mt-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                              <span key={d}>{d}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Distribution Donut Chart */}
                  <div className="col-lg-4">
                    <div className="card h-100">
                      <div className="card-header bg-transparent py-3">
                        <h2 className="h5 card-title mb-0 fw-bold">Category Distribution</h2>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        <div className="d-flex align-items-center justify-content-center mb-3">
                          <div className="position-relative" style={{ width: '160px', height: '160px' }}>
                            <svg viewBox="0 0 36 36" className="w-100 h-100">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="4"
                                strokeDasharray="32, 100"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="4"
                                strokeDasharray="28, 100"
                                strokeDashoffset="-32"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="4"
                                strokeDasharray="24, 100"
                                strokeDashoffset="-60"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth="4"
                                strokeDasharray="16, 100"
                                strokeDashoffset="-84"
                              />
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                              <span className="h4 mb-0 fw-bold">{products.length}</span>
                              <small className="text-muted d-block" style={{ fontSize: '10px' }}>Items</small>
                            </div>
                          </div>
                        </div>

                        {/* List */}
                        <div className="mt-2">
                          {categoryStats.map((cat, i) => (
                            <div key={i} className="d-flex justify-content-between align-items-center mb-2 small">
                              <span>{cat.name}</span>
                              <div className="d-flex align-items-center">
                                <span className="text-muted me-2">{cat.percentage}%</span>
                                <span className="fw-bold">{cat.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Catalog Table Card */}
                <div className="card">
                  <div className="card-header bg-transparent py-3">
                    <div className="row align-items-center g-2">
                      <div className="col">
                        <h2 className="h5 card-title mb-0 fw-bold">Product Catalog</h2>
                      </div>
                      <div className="col-auto">
                        <div className="d-flex flex-wrap gap-2">
                          {/* Search */}
                          <div className="position-relative">
                            <input
                              type="search"
                              className="form-control form-control-sm"
                              placeholder="Search products..."
                              value={productSearch}
                              onChange={(e) => {
                                setProductSearch(e.target.value)
                                setCurrentPage(1)
                              }}
                              style={{ width: '180px' }}
                            />
                            <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-2 text-muted small"></i>
                          </div>

                          {/* Category Filter */}
                          <select
                            className="form-select form-select-sm"
                            value={categoryFilter}
                            onChange={(e) => {
                              setCategoryFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            style={{ width: '140px' }}
                          >
                            <option value="">All Categories</option>
                            <option value="electronics">Electronics</option>
                            <option value="clothing">Clothing</option>
                            <option value="books">Books</option>
                            <option value="home">Home & Garden</option>
                          </select>

                          {/* Stock Filter */}
                          <select
                            className="form-select form-select-sm"
                            value={stockFilter}
                            onChange={(e) => {
                              setStockFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            style={{ width: '130px' }}
                          >
                            <option value="">All Stock</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    {/* Bulk Actions Bar */}
                    {selectedProductIds.length > 0 && (
                      <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                        <span className="text-muted small">
                          <strong>{selectedProductIds.length}</strong> product(s) selected
                        </span>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleBulkAction('publish')}
                          >
                            <i className="bi bi-eye me-1"></i>Publish
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleBulkAction('unpublish')}
                          >
                            <i className="bi bi-eye-slash me-1"></i>Unpublish
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleBulkAction('delete')}
                          >
                            <i className="bi bi-trash me-1"></i>Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={
                                  selectedProductIds.length > 0 &&
                                  paginatedProducts.every((p) => selectedProductIds.includes(p.id))
                                }
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                            </th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th style={{ width: '120px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProducts.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-5 text-muted">
                                <i className="bi bi-inbox d-block mb-2" style={{ fontSize: '2rem' }}></i>
                                No products found matching your filters.
                              </td>
                            </tr>
                          ) : (
                            paginatedProducts.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedProductIds.includes(p.id)}
                                    onChange={() => handleSelectProduct(p.id)}
                                  />
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded me-3 bg-light d-flex align-items-center justify-content-center p-1 border"
                                      style={{ width: '40px', height: '40px', minWidth: '40px' }}
                                    >
                                      <img
                                        src="/metis/assets/images/product-placeholder.svg"
                                        alt={p.name}
                                        style={{ width: '28px', height: '28px' }}
                                      />
                                    </div>
                                    <div>
                                      <div className="fw-semibold text-dark">{p.name}</div>
                                      <small className="text-muted font-monospace">SKU: {p.sku}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border text-capitalize">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="fw-bold">${p.price.toFixed(2)}</td>
                                <td>
                                  <span
                                    className={`badge stock-badge ${
                                      p.stock > 20
                                        ? 'bg-success-subtle text-success'
                                        : p.stock > 0
                                        ? 'bg-warning-subtle text-warning'
                                        : 'bg-danger-subtle text-danger'
                                    }`}
                                  >
                                    {p.stock} units
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`badge text-capitalize ${
                                      p.status === 'published'
                                        ? 'bg-success'
                                        : p.status === 'draft'
                                        ? 'bg-secondary'
                                        : 'bg-warning text-dark'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="small text-muted">{p.created}</td>
                                <td>
                                  <div className="dropdown">
                                    <button
                                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                      type="button"
                                      data-bs-toggle="dropdown"
                                      onClick={(e) => {
                                        const menu = e.currentTarget.nextElementSibling
                                        if (menu) menu.classList.toggle('show')
                                      }}
                                    >
                                      <i className="bi bi-three-dots"></i>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                      <li>
                                        <button
                                          className="dropdown-item small"
                                          onClick={() => showToast(`Edit modal for ${p.name}`)}
                                        >
                                          <i className="bi bi-pencil me-2"></i>Edit
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item small"
                                          onClick={() => showToast(`Product details for ${p.name}`)}
                                        >
                                          <i className="bi bi-eye me-2"></i>View Details
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          className="dropdown-item small"
                                          onClick={() => handleDuplicateProduct(p)}
                                        >
                                          <i className="bi bi-copy me-2"></i>Duplicate
                                        </button>
                                      </li>
                                      <li><hr className="dropdown-divider my-1" /></li>
                                      <li>
                                        <button
                                          className="dropdown-item small text-danger"
                                          onClick={() => handleDeleteProduct(p)}
                                        >
                                          <i className="bi bi-trash me-2"></i>Delete
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2">
                      <div className="text-muted small">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{' '}
                        {filteredProducts.length} results
                      </div>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </button>
                          </li>
                          {Array.from({ length: totalPages }).map((_, idx) => (
                            <li
                              key={idx}
                              className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}
                            >
                              <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                                {idx + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === 'orders' && (
              <div className="card">
                <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                  <h2 className="h5 card-title mb-0 fw-bold">Order Management</h2>
                  <button className="btn btn-sm btn-primary" onClick={() => showToast('Order creation modal')}>
                    <i className="bi bi-plus-lg me-1"></i>Create Order
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total Amount</th>
                          <th>Payment Status</th>
                          <th>Fulfillment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {METIS_ORDERS.map((o) => (
                          <tr key={o.id}>
                            <td className="fw-bold text-primary">{o.id}</td>
                            <td>{o.customer}</td>
                            <td>2 items</td>
                            <td className="fw-bold">{o.amount}</td>
                            <td><span className="badge bg-success-subtle text-success">Paid</span></td>
                            <td>
                              <span className={`badge ${o.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="text-muted small">{o.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: USERS */}
            {activeTab === 'users' && (
              <div className="card">
                <div className="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                  <h2 className="h5 card-title mb-0 fw-bold">Users &amp; Administrators</h2>
                  <button className="btn btn-sm btn-primary" onClick={() => showToast('Invite user')}>
                    <i className="bi bi-person-plus me-1"></i>Add User
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'John Doe', role: 'Superadmin', email: 'admin@123', status: 'Active', active: 'Now' },
                          { name: 'Priya Raman', role: 'Staff Manager', email: 'priya@novamotors.in', status: 'Active', active: '5 min ago' },
                          { name: 'Soundar Kumar', role: 'Dealership Head', email: 'soundar@novamotors.in', status: 'Active', active: '1 hour ago' },
                          { name: 'Jane Smith', role: 'Sales Advisor', email: 'jane@novamotors.in', status: 'Away', active: '3 hours ago' }
                        ].map((u, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">
                              <div className="d-flex align-items-center">
                                <img
                                  src="/metis/assets/images/avatar-placeholder.svg"
                                  alt={u.name}
                                  width="32"
                                  height="32"
                                  className="rounded-circle me-2"
                                />
                                <span>{u.name}</span>
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{u.role}</span></td>
                            <td className="font-monospace small">{u.email}</td>
                            <td><span className="badge bg-success-subtle text-success">{u.status}</span></td>
                            <td className="text-muted small">{u.active}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="row g-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-transparent py-3">
                      <h2 className="h5 card-title mb-0 fw-bold">Comprehensive Analytics</h2>
                    </div>
                    <div className="card-body p-4 text-center">
                      <i className="bi bi-bar-chart-line text-primary mb-3 d-inline-block" style={{ fontSize: '3rem' }}></i>
                      <h4>Conversion &amp; Visitor Metrics</h4>
                      <p className="text-muted max-w-md mx-auto">
                        Real-time visitor tracking and dealership test drive conversions are streaming properly. All systems operational.
                      </p>
                      <button className="btn btn-outline-primary" onClick={() => showToast('Report exported')}>
                        <i className="bi bi-file-earmark-pdf me-2"></i>Export Full Analytics Dossier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="card">
                <div className="card-header bg-transparent py-3">
                  <h2 className="h5 card-title mb-0 fw-bold">System Settings</h2>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Admin Workspace Name</label>
                      <input type="text" className="form-control" defaultValue="Metis Admin Portal &bull; Nova Motors" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Default Currency</label>
                      <select className="form-select" defaultValue="USD">
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div className="col-12 pt-3">
                      <button className="btn btn-primary" onClick={() => showToast('Settings saved successfully')}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ==============================================================
            FOOTER
        ============================================================== */}
        <footer className="admin-footer">
          <div className="container-fluid px-3">
            <div className="row align-items-center">
              <div className="col-md-6">
                <p className="mb-0 text-muted small">&copy; 2026 Modern Bootstrap Admin Template</p>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-0 text-muted small">
                  Built with Bootstrap 5 by{' '}
                  <a href="https://colorlib.com/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    Colorlib
                  </a>{' '}
                  &bull; Distributed by{' '}
                  <a href="https://themewagon.com/" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    ThemeWagon
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* ==============================================================
          MODALS
      ============================================================== */}

      {/* 1. Add Product Modal */}
      {addProductModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add New Product</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAddProductModalOpen(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Product Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. iPhone 15 Pro Max"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. IPHONE15-PRO"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      >
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="books">Books</option>
                        <option value="home">Home & Garden</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        required
                        placeholder="99.99"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Stock Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        required
                        placeholder="25"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Product description and specifications..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Status</label>
                      <select
                        className="form-select"
                        value={newProduct.status}
                        onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Product Image</label>
                      <input type="file" className="form-control" accept="image/*" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAddProductModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Import CSV Modal */}
      {importModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Import Products</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setImportModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Upload CSV File</label>
                  <input type="file" className="form-control" accept=".csv" />
                  <div className="form-text">Upload a CSV file with columns: name, sku, category, price, stock, status</div>
                </div>
                <div className="alert alert-info small mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>CSV Format:</strong> name, sku, category, price, stock, status<br />
                  <small>Example: iPhone 14, IPHONE14-128, electronics, 799.99, 50, published</small>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setImportModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setImportModalOpen(false)
                    showToast('CSV products imported successfully')
                  }}
                >
                  Import Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. New Item Quick Modal */}
      {newItemModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Quick Create Item</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setNewItemModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">Choose which item you would like to create in Metis:</p>
                <div className="list-group">
                  <button
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    onClick={() => {
                      setNewItemModalOpen(false)
                      setActiveTab('products')
                      setAddProductModalOpen(true)
                    }}
                  >
                    <i className="bi bi-box me-3 text-primary fs-5"></i>
                    <div>
                      <div className="fw-semibold">New Product</div>
                      <small className="text-muted">Add catalog inventory item</small>
                    </div>
                  </button>
                  <button
                    className="list-group-item list-group-item-action d-flex align-items-center"
                    onClick={() => {
                      setNewItemModalOpen(false)
                      setActiveTab('orders')
                      showToast('Opening Order creation flow')
                    }}
                  >
                    <i className="bi bi-bag-check me-3 text-success fs-5"></i>
                    <div>
                      <div className="fw-semibold">New Customer Order</div>
                      <small className="text-muted">Register a manual sale or invoice</small>
                    </div>
                  </button>
                </div>
              </div>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
          animation: spin 0.6s linear infinite;
        }
        .hover-bg-light:hover {
          background-color: var(--bs-light, #f8f9fa);
        }
      `}</style>

    </div>
  )
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import Test from './components/Test'
import { AuthProvider } from './context/AuthContext'
import './index.css'

function isTestRoute() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/test'
}

const root = ReactDOM.createRoot(document.getElementById('root'))

if (isTestRoute()) {
  root.render(
    <React.StrictMode>
      <Test />
    </React.StrictMode>
  )
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

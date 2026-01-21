import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useStore from './store/useStore'
import Header from './components/layout/Header'
import PrivateRoute from './components/auth/PrivateRoute'
import Home from './pages/Home'
import QRPage from './pages/QRPage'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/admin/AdminPanel'

function App() {
  const { theme, language } = useStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    // Apply language
    i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/q/:qrToken" element={<QRPage />} />
          <Route
            path="/register/:qrToken"
            element={<Register />}
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Header />
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <Header />
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              color: theme === 'dark' ? '#f9fafb' : '#111827',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App

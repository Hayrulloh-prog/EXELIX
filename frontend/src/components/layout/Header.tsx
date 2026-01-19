import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, Globe, Download, LogOut } from 'lucide-react'
import useStore from '@/store/useStore'
import { useNavigate } from 'react-router-dom'
import api from '@/utils/api'
import toast from 'react-hot-toast'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme, language, setLanguage, logout } = useStore()
  const navigate = useNavigate()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const languages = [
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
    { code: 'kg', label: 'Кыргызча' }
  ]

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
      logout()
      navigate('/')
      toast.success(t('common.success'))
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // PWA Install prompt
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast.success('Приложение установлено')
      }
      setDeferredPrompt(null)
    } else {
      toast.error('Установка недоступна')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              {t('common.appName')}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('header.language')}
              >
                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-fade-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as 'ru' | 'en' | 'kg')
                        i18n.changeLanguage(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        language === lang.code
                          ? 'text-primary-600 dark:text-primary-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Install App (PWA) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallApp}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('header.installApp')}
              </button>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('auth.logout')}
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close language menu */}
      {showLangMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLangMenu(false)}
        />
      )}
    </header>
  )
}

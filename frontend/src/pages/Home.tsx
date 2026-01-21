import { useTranslation } from 'react-i18next'
import { QrCode, Shield, Bell, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t('common.appName')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Быстрое и безопасное уведомление владельца автомобиля через QR-код
            без публичного раскрытия личных данных
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="card p-6 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <QrCode className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              QR-код
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Регистрация только через QR-код для максимальной безопасности
            </p>
          </div>

          <div className="card p-6 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Shield className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Безопасность
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Защита личных данных и контроль доступа
            </p>
          </div>

          <div className="card p-6 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Bell className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Уведомления
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Мгновенные уведомления через Web Push и Telegram
            </p>
          </div>

          <div className="card p-6 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Smartphone className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              PWA
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Работает как нативное приложение с поддержкой офлайн-режима
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Отсканируйте QR-код на вашем автомобиле для регистрации
          </p>
          <Link to="/dashboard">
            dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

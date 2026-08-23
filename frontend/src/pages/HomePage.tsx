import { useTranslation } from 'react-i18next';
import { QrCode, Car, Shield, Users, ArrowRight, Bell, Smartphone, Star, Lock, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { t } = useTranslation();

  const isLoggedIn = !!localStorage.getItem('token') || !!localStorage.getItem('userToken');
  const loginTo = isLoggedIn ? "/dashboard" : "/login";

  return (
    <div className="flex-1 h-full overflow-y-auto w-full hero-gradient">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center mb-16 sm:mb-20 lg:mb-24">
          <div className="mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 lg:mb-10 shadow-xl sm:shadow-2xl hover:shadow-3xl transition-all duration-300">
              <QrCode className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="gradient-text">{t('common.appName')}</span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 dark:text-gray-200 mb-6 sm:mb-8 font-semibold">
              {t('home.subtitle')}
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed mb-8 sm:mb-12 px-4">
              {t('home.description')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl sm:rounded-2xl border border-green-200 dark:border-green-800/50 shadow-sm hover:shadow-md transition-all duration-200">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">{t('home.features.protected')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">{t('home.features.mobile')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl sm:rounded-2xl border border-purple-200 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-all duration-200">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">{t('home.features.anonymous')}</span>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-7xl mx-auto mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16 lg:mb-20 text-gray-900 dark:text-white">
            {t('home.howItWorks')}
          </h2>

          <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 max-lg:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 relative">
            {/* Connection Line */}
            <div className="hidden sm:block max-lg:hidden absolute top-16 left-1/2 transform -translate-x-1/2 w-full h-1 bg-gradient-to-r from-blue-300 via-blue-500 to-purple-500 dark:from-blue-600 dark:via-blue-500 dark:to-purple-500"></div>

            <div className="feature-card text-center relative group transition-all duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 shadow-lg sm:shadow-xl group-hover:shadow-2xl transition-all duration-300">
                <QrCode className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold z-20 shadow-lg group-hover:scale-110 transition-all duration-300">
                1
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                {t('home.scan')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg px-2">
                {t('home.step1')}
              </p>
            </div>

            <div className="feature-card text-center relative group transition-all duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 shadow-lg sm:shadow-xl group-hover:shadow-2xl transition-all duration-300">
                <Car className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold z-20 shadow-lg group-hover:scale-110 transition-all duration-300">
                2
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                {t('home.choose')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg px-2">
                {t('home.step2')}
              </p>
            </div>

            <div className="feature-card text-center relative group transition-all duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 shadow-lg sm:shadow-xl group-hover:shadow-2xl transition-all duration-300">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold z-20 shadow-lg group-hover:scale-110 transition-all duration-300">
                3
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                {t('home.send')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg px-2">
                {t('home.step3')}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto mb-16 sm:mb-20 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16 lg:mb-20 text-gray-900 dark:text-white">
            {t('home.features.title', 'Возможности')}
          </h2>

          <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 max-lg:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group transition-transform shadow-lg group-hover:shadow-xl">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.confidential')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.confidentialDesc')}
              </p>
            </div>

            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:transition-transform shadow-lg group-hover:shadow-xl">
                <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.notifications')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.notificationsDesc')}
              </p>
            </div>

            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:transition-transform shadow-lg group-hover:shadow-xl">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.statusManagement')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.statusManagementDesc')}
              </p>
            </div>

            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:transition-transform shadow-lg group-hover:shadow-xl">
                <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.pwa')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.pwaDesc')}
              </p>
            </div>

            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:transition-transform shadow-lg group-hover:shadow-xl">
                <Car className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.types')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.typesDesc')}
              </p>
            </div>

            <div className="feature-card group hover:transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:transition-transform shadow-lg group-hover:shadow-xl">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">
                {t('home.features.protection')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {t('home.features.protectionDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto mb-16 sm:mb-20 lg:mb-24">
          <div className="grid max-sm:grid-cols-1 sm:grid-cols-2 max-lg:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">20K+</div>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">{t('home.stats.users')}</p>
            </div>
            <div className="text-center p-6 sm:p-8 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">24/7</div>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">{t('home.stats.uptime')}</p>
            </div>
            <div className="text-center p-6 sm:p-8 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">6</div>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">{t('home.stats.types')}</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto">
          <div className="section-gradient rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl hover:shadow-3xl transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              {t('home.readyToStart')}
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed px-4">
              {t('home.qrScanDescription')}
            </p>
            <div className="flex justify-center px-4">
              <Link to={loginTo} className="bg-white text-blue-600 px-8 sm:px-12 lg:px-16 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold hover:bg-gray-100 transition-all transform hover:-translate-y-1 shadow-lg sm:shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base">
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
                {t('auth.login', 'Войти')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

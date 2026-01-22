'use client';

import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { QrCode, Shield, Bell } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('home.subtitle')}
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('home.description')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8">
            {t('home.howItWorks')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1</h3>
              <p className="text-gray-600">{t('home.step1')}</p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2</h3>
              <p className="text-gray-600">{t('home.step2')}</p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3</h3>
              <p className="text-gray-600">{t('home.step3')}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Для доступа к сервису отсканируйте QR-код на автомобиле
          </p>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const notificationTypes = [
  { id: 'blocking', icon: '🚧', label: 'notifications.blocking' },
  { id: 'parking', icon: '🅿️', label: 'notifications.parking' },
  { id: 'alarm', icon: '🚨', label: 'notifications.alarm' },
  { id: 'evacuation', icon: '🚓', label: 'notifications.evacuation' },
  { id: 'minorAccident', icon: '🚗', label: 'notifications.minorAccident' },
  { id: 'majorAccident', icon: '🚑', label: 'notifications.majorAccident' },
];

export default function NotifyPage() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [qrToken, setQrToken] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Invalid QR code');
      return;
    }
    setQrToken(token);
  }, [searchParams]);

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select at least one notification type');
      return;
    }

    if (!qrToken) {
      toast.error('Invalid QR code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/notifications/send', {
        qrToken,
        types: selectedTypes,
      });
      toast.success(t('notifications.success'));
      setSelectedTypes([]);
    } catch (error: any) {
      const errorCode = error.response?.data?.error;
      if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        toast.error(t('notifications.rateLimit'));
      } else if (errorCode === 'OWNER_LIMIT_EXCEEDED') {
        toast.error(t('notifications.ownerLimit'));
      } else {
        toast.error(error.response?.data?.message || 'Failed to send notification');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!qrToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold mb-6">{t('notifications.title')}</h1>
            <p className="text-gray-600 mb-8">{t('notifications.selectTypes')}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {notificationTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleType(type.id)}
                  className={`card text-center cursor-pointer transition-all ${
                    selectedTypes.includes(type.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{t(type.label)}</div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || selectedTypes.length === 0}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('notifications.send')}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

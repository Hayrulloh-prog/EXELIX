'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function NotifyTokenPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = params.token as string;
    if (!token) {
      router.push('/');
      return;
    }
    setQrToken(token);
    validateAndLoad(token);
  }, [params, router]);

  const validateAndLoad = async (token: string) => {
    try {
      const response = await api.post('/qr/validate', { token });
      const data = response.data;

      if (!data.valid) {
        toast.error('Invalid QR code');
        router.push('/');
        return;
      }

      if (data.used && data.userId) {
        // Load user info if status is open
        try {
          const userResponse = await api.get(`/users/${data.userId}`);
          const userData = userResponse.data;
          if (userData.status === 'open') {
            setUser(userData);
          }
        } catch (err) {
          // User info not available or status is closed
        }
      }
    } catch (error) {
      toast.error('Error validating QR code');
      router.push('/');
    } finally {
      setValidating(false);
    }
  };

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

  if (validating) {
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
          {user && (
            <div className="card mb-6">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.phone}</p>
                </div>
              </div>
            </div>
          )}

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

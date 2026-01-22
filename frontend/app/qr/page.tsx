'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';

export default function QRPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Invalid QR code');
      setLoading(false);
      return;
    }

    const validateQR = async () => {
      try {
        const response = await api.post('/qr/validate', { token });
        const data = response.data;

        if (!data.valid) {
          setError('Invalid QR code');
          setLoading(false);
          return;
        }

        if (data.used && data.userId) {
          // Try to login
          try {
            const loginResponse = await api.post('/auth/login', { qrToken: token });
            localStorage.setItem('token', loginResponse.data.token);
            router.push('/dashboard');
          } catch (err: any) {
            if (err.response?.status === 400) {
              // User exists but login failed, redirect to dashboard anyway
              router.push('/dashboard');
            } else {
              setError('Failed to login');
              setLoading(false);
            }
          }
        } else if (!data.used) {
          // New registration
          router.push(`/register?token=${token}`);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error validating QR code');
        setLoading(false);
      }
    };

    validateQR();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto card text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{t('common.error')}</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

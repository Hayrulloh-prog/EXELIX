'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Upload, Lock, Unlock } from 'lucide-react';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phoneCountry: 'KG',
    telegram: '',
    avatar: '',
    status: 'closed',
  });

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    setQrToken(token);
  }, [searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!qrToken) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        qrToken,
        ...formData,
      });

      localStorage.setItem('token', response.data.token);
      toast.success(t('register.success'));
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('register.error'));
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
            <h1 className="text-3xl font-bold mb-8">{t('register.title')}</h1>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('register.step1')}</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('register.firstName')} *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('register.lastName')} *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('register.phone')} *
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="phoneCountry"
                      value={formData.phoneCountry}
                      onChange={handleInputChange}
                      className="input w-32"
                    >
                      <option value="KG">🇰🇬 Кыргызстан</option>
                      <option value="RU">🇷🇺 Россия</option>
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input flex-1"
                      placeholder="+996555123456"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('register.telegram')}
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('register.avatar')}
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.avatar && (
                      <img
                        src={formData.avatar}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    )}
                    <label className="btn btn-outline cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {t('common.upload') || 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <button onClick={handleNext} className="btn btn-primary w-full">
                  {t('common.next')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">{t('register.step2')}</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, status: 'open' })}
                    className={`card text-center cursor-pointer transition-all ${
                      formData.status === 'open'
                        ? 'border-primary-600 bg-primary-50'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <Unlock className="w-12 h-12 mx-auto mb-2 text-primary-600" />
                    <h3 className="font-semibold mb-1">{t('register.statusOpen')}</h3>
                    <p className="text-sm text-gray-600">{t('register.statusOpenDesc')}</p>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, status: 'closed' })}
                    className={`card text-center cursor-pointer transition-all ${
                      formData.status === 'closed'
                        ? 'border-primary-600 bg-primary-50'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <Lock className="w-12 h-12 mx-auto mb-2 text-primary-600" />
                    <h3 className="font-semibold mb-1">{t('register.statusClosed')}</h3>
                    <p className="text-sm text-gray-600">{t('register.statusClosedDesc')}</p>
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-secondary flex-1"
                  >
                    {t('common.back')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      t('register.title')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

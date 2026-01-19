import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Upload, Camera } from 'lucide-react'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import useStore from '@/store/useStore'

type ProfileType = 'open' | 'closed'

export default function Register() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setUser, setToken } = useStore()
  const [step, setStep] = useState(1)

  // Step 1: Personal Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    telegram: '',
    photo: null as File | null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Step 2: Profile Type
  const [profileType, setProfileType] = useState<ProfileType | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNext = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.photo
    ) {
      toast.error(t('errors.required'))
      return
    }
    setStep(2)
  }

  const handleRegister = async () => {
    if (!profileType) {
      toast.error('Выберите тип профиля')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('telegram', formData.telegram)
      formDataToSend.append('profileType', profileType)
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      const response = await api.post(`/auth/register/${qrToken}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { user, token } = response.data
      setUser(user)
      setToken(token)
      toast.success(t('auth.registerSuccess'))
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.register')}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                step >= 1 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div
              className={`w-3 h-3 rounded-full ${
                step >= 2 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          </div>
        </div>

        {/* Step 1: Personal Data */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-6 space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Данные
              </h2>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.photo')} *
                </label>
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-primary-500 transition-colors relative overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.firstName')} *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('auth.firstName')}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.lastName')} *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('auth.lastName')}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="+996 XXX XXX XXX"
                />
              </div>

              {/* Telegram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.telegram')}
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

              <button onClick={handleNext} className="btn-primary w-full">
                {t('common.next')}
              </button>
            </motion.div>
          )}

          {/* Step 2: Profile Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Тип профиля
                </h2>

                <div className="space-y-4">
                  {/* Open Profile */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileType('open')}
                    className={`card p-6 cursor-pointer transition-all ${
                      profileType === 'open'
                        ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          profileType === 'open'
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {profileType === 'open' && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('profile.openProfile')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t('profile.openProfileDesc')}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Closed Profile */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileType('closed')}
                    className={`card p-6 cursor-pointer transition-all ${
                      profileType === 'closed'
                        ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          profileType === 'closed'
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {profileType === 'closed' && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t('profile.closedProfile')}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t('profile.closedProfileDesc')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  {t('common.back')}
                </button>
                <button onClick={handleRegister} className="btn-primary flex-1">
                  {t('auth.register')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

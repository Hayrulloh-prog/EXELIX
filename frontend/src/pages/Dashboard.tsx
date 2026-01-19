import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Edit, Phone, MessageCircle, Car, Check } from 'lucide-react'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import useStore from '@/store/useStore'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, setUser } = useStore()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeNow, setActiveNow] = useState(user?.activeNow || false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    telegram: user?.telegram || '',
    photo: null as File | null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo || null)
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramInput, setTelegramInput] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        telegram: user.telegram || '',
        photo: null
      })
      setPhotoPreview(user.photo || null)
      setActiveNow(user.activeNow || false)
    }
  }, [user])

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

  const handleSave = async () => {
    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('firstName', formData.firstName)
      formDataToSend.append('lastName', formData.lastName)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('telegram', formData.telegram)
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      const response = await api.put('/auth/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setUser(response.data.user)
      setIsEditing(false)
      toast.success(t('auth.profileUpdated'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddTelegram = async () => {
    if (!telegramInput.trim()) {
      toast.error(t('errors.required'))
      return
    }

    setLoading(true)
    try {
      const response = await api.put('/auth/profile', {
        telegram: telegramInput.trim()
      })

      setUser(response.data.user)
      setShowTelegramModal(false)
      setTelegramInput('')
      toast.success(t('auth.telegramAdded'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleImAtMyCar = async () => {
    setLoading(true)
    try {
      const response = await api.post('/auth/active-now', { active: !activeNow })
      setActiveNow(response.data.activeNow)
      setUser(response.data.user)
      toast.success(
        response.data.activeNow
          ? 'Вы теперь активны'
          : 'Вы больше не активны'
      )
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Профиль
            </h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('common.edit')}
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Photo & Name */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {isEditing ? (
                  <label className="cursor-pointer">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-primary-500 transition-colors relative overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {user.firstName?.[0]}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                        {user.firstName?.[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input"
                      placeholder={t('auth.firstName')}
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input"
                      placeholder={t('auth.lastName')}
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </h2>
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.phone')}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder={t('auth.phone')}
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {/* Telegram */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.telegram')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="@username"
                />
              ) : user.telegram ? (
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span>{user.telegram}</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowTelegramModal(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('auth.addTelegram')}
                </button>
              )}
            </div>

            {/* Profile Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тип профиля
              </label>
              <div className="text-gray-900 dark:text-white">
                {user.profileType === 'open'
                  ? t('profile.openProfile')
                  : t('profile.closedProfile')}
              </div>
            </div>

            {/* Active Now Status */}
            {activeNow && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('profile.activeNow')}</span>
              </div>
            )}

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      phone: user.phone || '',
                      telegram: user.telegram || '',
                      photo: null
                    })
                    setPhotoPreview(user.photo || null)
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? t('common.loading') : t('common.save')}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* UX Button: I'm at my car */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleImAtMyCar}
            disabled={loading}
            className={`w-full btn-primary flex items-center justify-center gap-2 ${
              activeNow ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            <Car className="w-5 h-5" />
            {t('profile.imAtMyCar')}
          </button>
        </motion.div>
      </div>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('auth.addTelegram')}
            </h3>
            <input
              type="text"
              value={telegramInput}
              onChange={(e) => setTelegramInput(e.target.value)}
              className="input mb-4"
              placeholder="@username"
            />
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowTelegramModal(false)
                  setTelegramInput('')
                }}
                className="btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddTelegram}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

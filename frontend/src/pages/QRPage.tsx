
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe, User, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import useStore from '@/store/useStore'

const notificationTypes = [
  { id: 1, key: 'blocking', type: 'normal', critical: false },
  { id: 2, key: 'wrongParking', type: 'normal', critical: false },
  { id: 3, key: 'alarm', type: 'normal', critical: false },
  { id: 4, key: 'evacuation', type: 'critical', critical: true },
  { id: 5, key: 'minorAccident', type: 'normal', critical: false },
  { id: 6, key: 'seriousAccident', type: 'critical', critical: true }
]

export default function QRPage() {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { language } = useStore()
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadQRInfo()
  }, [qrToken])

  const loadQRInfo = async () => {
    try {
      const response = await api.get(`/qr/${qrToken}`)
      const data = response.data

      if (data.status === 'inactive') {
        navigate(`/register/${qrToken}`)
        return
      }

      setOwner(data.owner)
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error(t('errors.notFound'))
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = (id: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    )
  }

  const handleSend = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Выберите хотя бы одно уведомление')
      return
    }

    setSending(true)
    try {
      await api.post(`/notifications/send`, {
        qrToken,
        notificationIds: selectedNotifications
      })
      toast.success(t('notifications.notificationSent'))
      setSelectedNotifications([])
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.error'))
    } finally {
      setSending(false)
    }
  }

  const handleCall = async () => {
    if (owner?.phone) {
      window.location.href = `tel:${owner.phone}`
    }
  }

  const handleTelegramCopy = () => {
    if (owner?.telegram) {
      navigator.clipboard.writeText(owner.telegram)
      toast.success(t('contacts.telegramCopied'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('common.appName')}
          </h1>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Owner Info */}
        {owner && owner.profileType === 'open' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              {owner.photo && (
                <img
                  src={owner.photo}
                  alt={owner.firstName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {owner.firstName} {owner.lastName}
                </h3>
              </div>
            </div>
          </motion.div>
        )}

        {owner && owner.profileType === 'closed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8"
          >
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <Shield className="w-6 h-6" />
              <p>Профиль владельца скрыт</p>
            </div>
          </motion.div>
        )}

        {/* Notification Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('notifications.selectNotifications')}
          </h2>
          <div className="grid gap-3">
            {notificationTypes.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleNotificationToggle(notification.id)}
                className={`card p-4 cursor-pointer transition-all duration-200 ${
                  selectedNotifications.includes(notification.id)
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:shadow-md'
                } ${notification.critical ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notification.critical && (
                      <span className="text-red-500 text-xl">🔴</span>
                    )}
                    <p className="text-gray-900 dark:text-white font-medium">
                      {t(`notifications.types.${notification.key}`)}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedNotifications.includes(notification.id)
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selectedNotifications.includes(notification.id) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={selectedNotifications.length === 0 || sending}
          className="btn-primary w-full mb-8"
        >
          {sending ? t('common.loading') : t('notifications.sendNotification')}
        </motion.button>

        {/* Contact Buttons */}
        <div className="flex gap-4">
          {owner?.phone && (
            <button
              onClick={handleCall}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <span className="text-xl">📞</span>
              {t('contacts.call')}
            </button>
          )}
          {owner?.telegram && (
            <button
              onClick={handleTelegramCopy}
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
            >
              <span className="text-xl">💬</span>
              Telegram
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

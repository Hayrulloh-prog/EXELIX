import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Download, Users, BarChart3, QrCode } from 'lucide-react'
import api from '@/utils/api'
import toast from 'react-hot-toast'

interface Statistics {
  totalUsers: number
  successfulRequests: number
  failedRequests: number
  totalRequests: number
  inactiveQR: number
}

interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  telegram?: string
  photo?: string
}

export default function AdminPanel() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadStatistics()
    loadUsers(1)
  }, [])

  const loadStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadUsers = async (pageNum: number, append = false) => {
    try {
      const response = await api.get(`/admin/users?page=${pageNum}&limit=40`)
      const newUsers = response.data.users

      if (append) {
        setUsers((prev) => [...prev, ...newUsers])
      } else {
        setUsers(newUsers)
      }

      setHasMore(newUsers.length === 40)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error(t('errors.error'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleShowMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    await loadUsers(nextPage, true)
  }

  const handleDownloadQR = async () => {
    try {
      const response = await api.get('/admin/qr/generate', {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'exelix-qr-codes.zip')
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(t('qr.generated'))
    } catch (error) {
      console.error('Failed to download QR codes:', error)
      toast.error(t('errors.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('admin.dashboard')}
        </h1>

        {/* Statistics */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('admin.totalUsers')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('admin.successfulRequests')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.successfulRequests}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('admin.failedRequests')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.failedRequests}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('admin.totalRequests')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRequests}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-2">
                <QrCode className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('admin.inactiveQR')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.inactiveQR}
              </p>
            </div>
          </motion.div>
        )}

        {/* QR Generation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.generateQR')}
          </h2>
          <button
            onClick={handleDownloadQR}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('admin.downloadQR')}
          </button>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('admin.users')}
          </h2>

          {loading && page === 1 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Фото
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Имя
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Телефон
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Telegram
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {user.photo ? (
                            <img
                              src={user.photo}
                              alt={user.firstName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                {user.firstName?.[0]}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {user.phone}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {user.telegram || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="btn-secondary"
                  >
                    {loadingMore ? t('common.loading') : t('admin.showMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

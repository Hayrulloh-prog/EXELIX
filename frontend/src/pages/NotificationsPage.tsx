import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNotificationTranslator } from '../utils/notificationTranslator';
import { API_ENDPOINTS } from '../lib/api';

interface Notification {
  id: string;
  type: string[];
  message: string;
  createdAt: string;
  readAt: string | null;
  sentViaPush: boolean;
  sentViaTelegram: boolean;
  status: 'sent' | 'pending' | 'failed';
  notification_types?: string[];
  custom_message?: string;
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const translateNotification = useNotificationTranslator();

  // Global event listener for language changes
  useEffect(() => {

    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!token) {
      // Перенаправляем на главную если нет токена
      navigate('/');
      return;
    }

    // Владелец зашел на страницу сообщений - убираем красную точку
    window.dispatchEvent(new CustomEvent('notificationsRead'));
    localStorage.setItem('notificationsRead', 'true');

    loadNotifications();

    return () => {
      // Cleanup if needed
    };
  }, [navigate]); // Убираем t из зависимостей чтобы избежать двойной загрузки

  useEffect(() => {
    // Прокручиваем страницу вниз при загрузке уведомлений
    if (notifications.length > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [notifications]);

  // Прослушиватель для обновления уведомлений в реальном времени
  useEffect(() => {
    const handleNotificationsUpdate = (event: CustomEvent) => {
      setNotifications(event.detail);
    };

    const handleRefreshNotifications = async (event: CustomEvent) => {
      // Предотвращаем двойную загрузку
      setLoading(true);
      await loadNotifications();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshNotifications') {
        // Предотвращаем двойную загрузку
        setLoading(true);
        loadNotifications();
        localStorage.removeItem('refreshNotifications');
      }
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdate as any);
    window.addEventListener('refreshNotifications', handleRefreshNotifications as any);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdate as any);
      window.removeEventListener('refreshNotifications', handleRefreshNotifications as any);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Логируем все что есть в localStorage для диагностики
      // Пробуем оба токена - пользовательский и админский
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');

      if (!token) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.GET_USER_NOTIFICATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Сортируем уведомления по дате создания (старые вверху, новые внизу как в WhatsApp)
        const sortedNotifications = data.notifications.sort((a: Notification, b: Notification) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setNotifications(sortedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      // Пробуем оба токена - пользовательский и админский
      const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken') || localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/v1/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Обновляем локальное состояние немедленно для всех
        const now = new Date().toISOString();
        const updatedNotifications = notifications.map(n => 
          !n.readAt ? { ...n, readAt: now } : n
        );
        setNotifications(updatedNotifications);

        // Отправляем событие для обновления NotificationPage в real-time немедленно
        window.dispatchEvent(new CustomEvent('ownerMarkedAsRead', {
          detail: {
            unreadCount: 0,
            allRead: true
          }
        }));

        // Также обновляем через localStorage для надежности
        localStorage.setItem('ownerMarkedAsRead', Date.now().toString());
      }
    } catch (error) {
    }
  };


  const formatMessage = (message: string) => {
    // Разделяем сообщение по строкам и создаем отдельные параграфы
    const lines = message.split('\n').filter(line => line.trim());
    return lines.map((line, index) => (
      <p key={index} className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-2">
        {line.trim()}
      </p>
    ));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return t('notifications.minutesAgo', { count: diffMinutes });
    } else if (diffHours < 24) {
      return t('notifications.hoursAgo', { count: diffHours });
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return t('notifications.daysAgo', { count: diffDays });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-full w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto w-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-2 pb-1 pt-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300" />
                {t('notifications.title')}
              </h1>
            </div>
            <div className="p-2 w-8 h-7"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {t('notifications.noNotifications')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mx-auto">
              {t('notifications.noNotificationsDescription')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                  notification.readAt
                    ? 'border-gray-100 dark:border-gray-700 opacity-75'
                    : 'border-blue-100 dark:border-blue-800/50 shadow-md'
                } transition-all duration-200 hover:shadow-md`}
              >
                {/* Professional EXELIX-style message */}
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Compact icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            EXELIX
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            notification.readAt
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {notification.readAt ? t('notifications.read') : t('notifications.new')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>

                      {/* Message bubble */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
                        {formatMessage(translateNotification(notification))}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-end">
                        {!notification.readAt && (
                          <button
                            onClick={() => markAsRead()}
                            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            {t('notifications.markAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

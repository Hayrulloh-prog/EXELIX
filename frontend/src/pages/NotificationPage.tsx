import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_BASE_URL } from "../lib/api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import "../i18n";
import {
  AlertCircle,
  CheckCircle,
  Send,
  Phone,
  Loader2,
} from "lucide-react";

interface Limits {
  owner: {
    count: number;
    max: number;
    exceeded: boolean;
  };
  sender: {
    count: number;
    max: number;
    exceeded: boolean;
  };
  canSend: boolean;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "open" | "closed";
  language: string;
  avatarUrl?: string;
  telegramUsername?: string;
  telegram_username?: string; // Добавляем поле из бэкенда
  isExpired?: boolean;
  isBlocked?: boolean;
}

export default function NotificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const notificationTypes = [
    { id: "parking", icon: "🅿️", label: t('notification.uiTypes.parking'), color: "blue" },
    { id: "blocking", icon: "🚧", label: t('notification.uiTypes.blocking'), color: "yellow" },
    { id: "alarm", icon: "🚨", label: t('notification.uiTypes.alarm'), color: "red" },
    { id: "lightsOn", icon: "💡", label: t('notification.uiTypes.lightsOn'), color: "yellow" },
    { id: "windowOpen", icon: "🚗", label: t('notification.uiTypes.windowOpen'), color: "orange" },
    { id: "majorAccident", icon: "🚑", label: t('notification.uiTypes.majorAccident'), color: "red" },
  ];

  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const qrToken = token || searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [ownerMarkedAsRead, setOwnerMarkedAsRead] = useState(false);
  const [sentNotificationsCount, setSentNotificationsCount] = useState(0);

  useEffect(() => {
    if (!qrToken) {
      setError(t('errors.qrNotFound'));
      setLoading(false);
      return;
    }

    validateQRAndLoadUser(qrToken);
  }, [qrToken, t]); // Добавляем t в зависимости для обновления при смене языка

  // Обновляем текст ошибки при смене языка
  useEffect(() => {
    if (error && error.includes('не найден')) {
      setError(t('errors.userNotFound'));
    }
  }, [t, error]);

  // Прослушиватель для обновления статуса прочтения владельцем и изменений статуса профиля
  useEffect(() => {
    const handleOwnerMarkedAsRead = (event: CustomEvent) => {
      // Владелец прочитал сообщения - убираем красную точку в личном кабинете
      setOwnerMarkedAsRead(true);
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    };

    // Обработчик для обновления данных владельца при изменении статуса
    const handleOwnerStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (qrToken) {
        // Немедленно обновляем без задержки
        validateQRAndLoadUser(qrToken);
      }
    };

    window.addEventListener('ownerMarkedAsRead', handleOwnerMarkedAsRead as EventListener);
    window.addEventListener('ownerStatusChanged', handleOwnerStatusChanged);

    // Прослушиваем localStorage для обновлений
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ownerMarkedAsRead') {
        setOwnerMarkedAsRead(true);
        window.dispatchEvent(new CustomEvent('notificationsRead'));
      } else if (e.key === 'ownerStatusChanged') {
        if (qrToken) {
          validateQRAndLoadUser(qrToken);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Добавляем проверку через интервал для надежности
    const interval = setInterval(() => {
      const markedAsRead = localStorage.getItem('ownerMarkedAsRead');
      if (markedAsRead && !ownerMarkedAsRead) {
        setOwnerMarkedAsRead(true);
        localStorage.removeItem('ownerMarkedAsRead');

        // Принудительно обновляем компонент
        setTimeout(() => {
          setOwnerMarkedAsRead(prev => prev);
        }, 100);
      }
    }, 500);

    return () => {
      window.removeEventListener('ownerMarkedAsRead', handleOwnerMarkedAsRead as EventListener);
      window.removeEventListener('ownerStatusChanged', handleOwnerStatusChanged);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [ownerMarkedAsRead]);

  // Периодическая проверка статуса владельца для обновления UI
  useEffect(() => {
    if (!qrToken || !userData) return;

    const checkOwnerStatus = async () => {
      try {
        // Оптимизированный запрос - проверяем только статус
        const response = await fetch(`${API_BASE_URL}/v1/qr/validate/${qrToken}?statusOnly=true`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": localStorage.getItem('i18nextLng') || 'ru',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.userData) {
            // Если статус изменился, обновляем данные
            if (data.userData.status !== userData.status) {
              setUserData(data.userData);
            }
          }
        }
        
        // Также проверяем статус прочтения, если мы отправляли сообщения
        const count = parseInt(localStorage.getItem(`sent_count_${qrToken}`) || "0", 10);
        if (count > 0 && !ownerMarkedAsRead) {
          checkReadStatus(qrToken);
        }
      } catch (err) {
      }
    };

    // Проверяем статус каждые 3 секунды для быстрого обновления
    const statusInterval = setInterval(checkOwnerStatus, 3000);

    return () => clearInterval(statusInterval);
  }, [qrToken, userData]);

  // Проверяем при монтировании не был ли уже установлен флаг
  useEffect(() => {

    // Загружаем sentNotificationsCount из localStorage
    if (qrToken) {
      const savedCount = localStorage.getItem(`sent_count_${qrToken}`);
      if (savedCount) {
        const count = parseInt(savedCount, 10);
        setSentNotificationsCount(count);
      }
    }

    const markedAsRead = localStorage.getItem('ownerMarkedAsRead');
    if (markedAsRead) {
      setOwnerMarkedAsRead(true);
      localStorage.removeItem('ownerMarkedAsRead');
    }

    // Также проверяем sentNotificationsCount
  }, [qrToken]);

  const validateQRAndLoadUser = async (token: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.VALIDATE_QR(token), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": localStorage.getItem('i18nextLng') || 'ru',
        },
      });

      const data = await response.json();

      if (data.success && data.userData) {

        // Миграция URL аватара если нужно
        const migratedUserData = {
          ...data.userData,
          avatarUrl: data.userData.avatarUrl?.includes('/api/api')
            ? data.userData.avatarUrl.replace('/api/api', '/api')
            : data.userData.avatarUrl?.includes('localhost:3002')
            ? data.userData.avatarUrl.replace('http://localhost:3002', '/api')
            : data.userData.avatarUrl
        };

        setUserData(migratedUserData);
        // Загружаем лимиты сразу после загрузки пользователя
        await loadLimits(token);
        // Проверяем статус прочтения сообщений (безопасно)
        try {
          await checkReadStatus(token);
        } catch (err) {
        }
      } else {
        // Если success=false, всегда используем перевод, игнорируя сообщение с бэкенда
        setError(t('errors.userNotFound'));
      }
    } catch (err: any) {
      console.error('validateQRAndLoadUser error:', err);
      // Всегда используем перевод для ошибки пользователя не найден
      setError(t('errors.userNotFound'));
    } finally {
      setLoading(false);
    }
  };

  const loadLimits = async (token: string) => {
    try {

      const response = await fetch(API_ENDPOINTS.CHECK_LIMITS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await response.json();

      if (data.success) {
        setLimits(data.limits);
      } else {
        // Используем только API данные
        const fallbackLimits = {
          owner: {
            count: 0,
            max: 12,
            exceeded: false,
          },
          sender: {
            count: 0,
            max: 3,
            exceeded: false,
          },
          canSend: true,
        };
        setLimits(fallbackLimits);
      }
    } catch (err) {
      console.error('Failed to load limits:', err);
      // Используем только API данные при ошибке API
      const fallbackLimits = {
        owner: {
          count: 0,
          max: 12,
          exceeded: false,
        },
        sender: {
          count: 0,
          max: 3,
          exceeded: false,
        },
        canSend: true,
      };
      setLimits(fallbackLimits);
    }
  };

  const checkReadStatus = async (token: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/check-read-status?token=${token}`);
      const data = await response.json();

      // Если запрос успешен, нет непрочитанных и мы отправляли сообщения в этой сессии
      if (data.success && !data.hasUnreadNotifications) {
        const count = parseInt(localStorage.getItem(`sent_count_${token}`) || "0", 10);
        if (count > 0) {
          setOwnerMarkedAsRead(true);
        }
      }
    } catch (err) {
    }
  };

  const handleSendNotification = async () => {

    if (!userData) {
      setError(t('errors.userDataNotLoaded'));
      return;
    }

    // Проверяем лимиты отправителя через API
    if (limits?.sender.exceeded) {
      toast.error(t('notificationPage.dailyLimit'));
      return;
    }

    if (selectedTypes.length === 0) {
      setError(t('notificationPage.selectNotificationType'));
      return;
    }

    setSending(true);
    setError(null);

    try {

      // Отправляем уведомление
      const currentLanguage = localStorage.getItem('i18nextLng') || userData?.language || 'ru';
      const response = await fetch(API_ENDPOINTS.SEND_NOTIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLanguage, // Отправляем текущий язык интерфейса
        },
        body: JSON.stringify({
          token: qrToken,
          notificationTypes: selectedTypes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setSelectedTypes([]); // Очищаем выбранные типы
        toast.success(t('notificationPage.notificationSent'));

        // Обновляем счетчик отправленных сообщений
        const newCount = sentNotificationsCount + selectedTypes.length;
        setSentNotificationsCount(newCount);

        // Сохраняем в localStorage для сохранения между перезагрузками
        localStorage.setItem(`sent_count_${qrToken}`, newCount.toString());

        // Отправляем событие в личный кабинет о новом уведомлении
        window.dispatchEvent(new CustomEvent('newNotification'));
        localStorage.setItem('newNotification', 'true');


        // Сбрасываем кэш и обновляем лимиты немедленно
        setLimits(null);
        if (qrToken) {
          await loadLimits(qrToken);
        }

        setError(null);
        setSuccess(true);


        // Проверяем статус прочтения сообщений владельцем
        setTimeout(async () => {
          if (qrToken) {
            await checkReadStatus(qrToken);
          }
        }, 2000); // Небольшая задержка чтобы сервер успел обработать

        // Отправляем событие для немедленного обновления уведомлений
        window.dispatchEvent(new CustomEvent('refreshNotifications', {
          detail: { force: true, immediate: true }
        }));

        // Также обновляем через localStorage для надежности
        localStorage.setItem('refreshNotifications', Date.now().toString());
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (qrToken) {
          await loadLimits(qrToken);
        }

        // Переводим сообщения об ошибках на русский
        let errorMessage = data.message || t('notificationPage.errorSending');
        if (data.message?.includes('Sender has reached daily sending limit')) {
          errorMessage = t('notificationPage.dailyLimit');
        } else if (data.message?.includes('Owner has reached daily notification limit')) {
          errorMessage = t('notificationPage.ownerDailyLimit');
        }

        toast.error(errorMessage);
      }
    } catch (err) {
      // Обновляем лимиты даже при сетевой ошибке
      await new Promise(resolve => setTimeout(resolve, 100));
      if (qrToken) {
        await loadLimits(qrToken);
      }
      toast.error(t('errors.networkError'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <main className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="h-[90vh] overflow-hidden  hero-gradient flex items-center justify-center p-4">
        <main className="container mx-auto">
          <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('common.error')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => navigate("/")}
                className="btn btn-secondary"
              >
                {t('navigation.home')}
              </button>
            </div>
        </main>
      </div>
    );
  }

  if (success) {
    // Показываем только toast, не переходим на отдельную страницу
    setSuccess(false);
  }

  if (userData?.isBlocked) {
    return (
      <div className="h-[90vh] overflow-hidden  hero-gradient flex items-center justify-center p-4">
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center feature-card max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Аккаунт заблокирован
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Администратор приостановил действие аккаунта владельца данного QR-кода. Отправка уведомлений временно недоступна.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary w-full"
            >
              На главную
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (userData?.isExpired) {
    return (
      <div className="h-[90vh] overflow-hidden  hero-gradient flex items-center justify-center p-4">
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center feature-card max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('subscription.ownerExpiredTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('subscription.ownerExpiredMessage')}
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary w-full"
            >
              {t('subscription.backToHome')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto w-full hero-gradient py-4">
      <main className="container mx-auto px-3 py-3 sm:py-8 max-w-4xl">
        {/* User Info Card */}
        {userData?.status === "open" && (
          <div className="feature-card p-3 p-3 mb-3">
            <div className="flex items-center gap-4">
              {userData.avatarUrl ? (
                <img
                  src={userData.avatarUrl.startsWith('http')
                    ? userData.avatarUrl
                    : `${API_BASE_URL}${userData.avatarUrl}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">
                    {userData.firstName[0]}
                    {userData.lastName[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {userData.firstName} {userData.lastName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {userData.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification Types */}
        <div className="feature-card p-3 mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {t('notification.title')}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {notificationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedTypes(prev =>
                    prev.includes(type.id)
                      ? prev.filter(t => t !== type.id)
                      : [...prev, type.id]
                  );
                }}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedTypes.includes(type.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white text-center leading-tight">
                  {type.label}
                </div>
              </button>
            ))}
          </div>
        </div>

          <button
            onClick={() => {
              handleSendNotification();
            }}
            disabled={sending || selectedTypes.length === 0 || (limits?.sender.exceeded ?? false)}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center mb-3 gap-3 ${
              sending
                ? 'bg-blue-600 text-white shadow-lg'
                : selectedTypes.length === 0
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : limits?.sender.exceeded
                    ? 'bg-red-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white'
            }`}
          >
            {sending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {t('notification.sending')}
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                {t('notification.sendButton')}
              </>
            )}
          </button>


        {/* Action Buttons */}
        {(userData?.phone || userData?.telegramUsername || userData?.telegram_username) && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Telegram Button */}
            {(userData?.telegramUsername || userData?.telegram_username) ? (
              <button
                onClick={() => {
                  const telegramUsername = userData?.telegramUsername || userData?.telegram_username;
                  if (telegramUsername) {
                    const telegramWithAt = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;
                    navigator.clipboard.writeText(telegramWithAt);
                    toast.success(t('notification.messages.telegramCopied') + ": " + telegramWithAt);
                  }
                }}
                className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg ${
                  !userData?.phone ? 'col-span-2' : ''
                }`}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.004 0-.006 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                {t('notification.telegram')}
              </button>
            ) : null}
            {userData?.phone ? (
              <button
                onClick={() => window.open(`tel:${userData.phone}`, "_blank")}
                className={`bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg ${
                  !(userData?.telegramUsername || userData?.telegram_username) ? 'col-span-2' : ''
                }`}
              >
                <Phone className="w-6 h-6" />
                {t('notification.call')}
              </button>
            ) : null}
          </div>
        )}

        {/* Owner Read Status Block - появляется после того как владелец нажал "Отметить как прочитанное" на странице Сообщения */}
        {ownerMarkedAsRead && (
          <div className="feature-card p-4 mb-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {sentNotificationsCount === 1
                  ? t('notifications.ownerReadSingle')
                  : sentNotificationsCount > 1
                  ? t('notifications.ownerReadAll')
                  : t('notifications.ownerReadMessages')
                }
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="feature-card p-4 mb-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Limits Information */}
        <div className="feature-card p-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📊 {t('notification.limits.title')}
          </h2>

          {limits ? (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Owner Limit */}
              <div
                className={`p-4 rounded-xl border-2 ${
                  limits.owner.exceeded
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {limits.owner.exceeded ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t('notification.limits.owner')}: {limits.owner.count}/{limits.owner.max} {t('notification.limits.notifications')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {limits.owner.exceeded
                    ? t('notification.limits.limitExceeded')
                    : `${t('notification.limits.remaining')}: ${limits.owner.max - limits.owner.count} ${t('notification.limits.notifications')}`}
                </p>
              </div>

              {/* Sender Limit */}
              <div
                className={`p-4 rounded-xl border-2 ${
                  limits.sender.exceeded
                    ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                    : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {limits.sender.exceeded ? (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t('notification.limits.sender')}: {limits.sender.count}/{limits.sender.max} {t('notification.limits.notifications')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {limits.sender.exceeded
                    ? t('notification.limits.limitExceeded')
                    : `${t('notification.limits.remaining')}: ${limits.sender.max - limits.sender.count} ${t('notification.limits.notifications')}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('notification.limits.loading')}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

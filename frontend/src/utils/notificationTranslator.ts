import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export interface NotificationData {
  id: string;
  type: string | string[];
  message: string;
  createdAt: string;
  readAt: string | null;
  sentViaPush: boolean;
  sentViaTelegram: boolean;
  status: 'sent' | 'pending' | 'failed';
  notification_types?: string[];
  custom_message?: string;
}

// Функция для динамического перевода уведомлений на текущий язык
export const translateNotification = (
  notification: NotificationData,
  t: (key: string, options?: any) => string
): string => {
  // ПРИОРИТЕТ: Используем только структурированные данные (notification_types) для перевода
  // Игнорируем старое поле message полностью
  if (notification.notification_types && notification.notification_types.length > 0) {
    const types = notification.notification_types;
    const customMessage = notification.custom_message;

    // Получаем приветствие в зависимости от количества уведомлений
    const greeting = types.length === 1
      ? t('notificationTranslator.singleNotification')
      : t('notificationTranslator.multipleNotifications');

    // Формируем список уведомлений
    const notificationList = types.map((type, index) => {
      const translationKey = `notification.types.${type}`;
      const translatedType = t(translationKey);

      // Проверяем наличие иконки только для киргизского языка
      if (i18n.language === 'ky' && !translatedType.match(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u)) {
        console.warn(`⚠️ No icon found in translation for "${type}": "${translatedType}"`);
      }

      return `${index + 1}. ${translatedType}`;
    }).join('\n');

    // Если есть кастомное сообщение, добавляем его
    if (customMessage && customMessage.trim()) {
      return `${greeting}\n${notificationList}\n\n${t('notificationTranslator.customMessage')}: ${customMessage}`;
    }

    const result = `${greeting}\n${notificationList}`;
    return result;
  }

  // ФОЛБЭК: Если нет структурированных данных, пытаемся обработать старое сообщение
  if (notification.message) {
    // Если сообщение содержит ключи переводов (как в примере), пытаемся их перевести
    let message = notification.message;

    // Сначала проверяем на наличие полных ключей вида notification.types.xxx
    message = message.replace(/notification\.types\.(\w+)/g, (fullMatch, key) => {
      const translationKey = `notification.types.${key}`;
      const translated = t(translationKey);
      return translated !== translationKey ? translated : fullMatch;
    });

    // Затем проверяем на наличие английских названий типов
    message = message.replace(/\b(parking|blocking|alarm|lightsOn|windowOpen|majorAccident)\b/g, (match) => {
      const translationKey = `notification.types.${match}`;
      const translated = t(translationKey);
      return translated !== translationKey ? translated : match;
    });

    // Если сообщение не изменилось после попыток перевода, пробуем заменить старые переводы
    if (message === notification.message) {

      // Заменяем старые переводы на новые с иконками
      const kyrgyzReplacements = {
        'Сиз унааңызды туура эмес токтотуп коюпсуз': '🅿️ Туура эмес парковка',
        'Сиздин унаа өтмөктү тосуп турат': '🚧 Авто жолду бөгөп турат',
        'Сиздин унааңыздын терезеси ачык калыптыр': '🚗 Унааңыздын терезеси ачык',
        'Сиздин унааңыздын сигнализациясы иштеп кетти': '🚨 Сигнализация иштеди',
        'Сиздин унааңыз менен жол кырсыгы болду': '� Унаа менен болгон кырсык',
        'Сиздин унааңыздын чырактары күйүп турат': '� Унааңыздын чырагы жангы'
      };

      const russianReplacements = {
        'Неправильная парковка': '🅿️ Неправильная парковка',
        'Авто перекрывает проезд': '🚧 Авто перекрывает проезд',
        'Открыто окно вашей машины': '� Открыто окно вашей машины',
        'Сработала сигнализация': '� Сработала сигнализация',
        'ДТП с вашей машиной': '� ДТП с вашей машиной',
        'Включены фары вашей машины': '� Включены фары вашей машины'
      };

      const englishReplacements = {
        'Wrong parking': '🅿️ Wrong parking',
        'Car is blocking the road': '🚧 Car is blocking the road',
        'Your car window is open': '� Your car window is open',
        'Alarm activated': '� Alarm activated',
        'Accident with your car': '🚑 Accident with your car',
        'Your car headlights are on': '💡 Your car headlights are on'
      };

      const allReplacements = { ...kyrgyzReplacements, ...russianReplacements, ...englishReplacements };

      for (const [oldText, newText] of Object.entries(allReplacements)) {
        if (message.includes(oldText)) {
          message = message.split(oldText).join(newText);
        }
      }
    }

    return message;
  }

  // Если ничего не помогло, возвращаем оригинальное сообщение
  return notification.message;
};

// Хук для удобного использования перевода уведомлений
export const useNotificationTranslator = () => {
  const { t } = useTranslation();

  return (notification: NotificationData) => translateNotification(notification, t);
};

// Функция для пакетного перевода уведомлений
export const translateNotifications = (
  notifications: NotificationData[],
  t: (key: string, options?: any) => string
): NotificationData[] => {
  return notifications.map(notification => ({
    ...notification,
    message: translateNotification(notification, t)
  }));
};

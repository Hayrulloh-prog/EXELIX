import { query } from "../config/database";
import { createError } from "../utils/errors";
import { getUserByQRToken } from "./qrService";
import { sendPushNotification } from "./pushService";
// import { sendTelegramNotification } from "./telegramService";
import { enqueueNotification } from "../queues/notificationQueue";
import { v4 as uuidv4 } from "uuid";
import { NotificationModel } from "../models/Notification";

// Use production limits even in development
const SENDER_LIMIT = 3;
const OWNER_LIMIT = 12;

const getRateLimitKey = (
  userId: string | null,
  ip: string,
  type: "sender" | "receiver",
): string => {
  if (userId) {
    return `rate_limit:${type}:user:${userId}`;
  }
  return `rate_limit:${type}:ip:${ip}`;
};

const checkRateLimit = async (
  userId: string | null,
  ip: string,
  type: "sender" | "receiver",
): Promise<{ allowed: boolean; currentCount: number; resetAt?: Date }> => {
  const limit = type === "sender" ? SENDER_LIMIT : OWNER_LIMIT;

  // Check in database
  const result = await query(
    `SELECT count, reset_at FROM rate_limits
     WHERE (user_id = $1 OR ($1 IS NULL AND user_id IS NULL))
       AND ip_address = $2
       AND type = $3
       AND reset_at > NOW()`,
    [userId, ip, type],
  );

  if (result.rows.length > 0) {
    const record = result.rows[0];
    return {
      allowed: record.count < limit,
      currentCount: record.count,
      resetAt: record.reset_at
    };
  }

  // No record found, return 0 count
  return { allowed: true, currentCount: 0 };
};

const getNotificationText = (types: string[], language: string): string => {
  const translations: Record<string, Record<string, string>> = {
    ru: {
      blocking: "🚧 Авто перекрывает проезд",
      parking: "🅿️ Неправильная парковка",
      alarm: "🚨 Сработала сигнализация",
      lightsOn: "💡 Включены фары вашей машины",
      windowOpen: "🚗 Открыто окно вашей машины",
      majorAccident: "🚑 ДТП с вашей машиной",
    },
    ky: {
      blocking: "🚧 Көчөнү бөгөп турат",
      parking: "🅿️ Туура эмес парковка",
      alarm: "🚨 Сигнализация иштээт",
      lightsOn: "💡 Фараларыңыздын жарыгы жанып жатат",
      windowOpen: "🚗 Машинаныздагы терезе ачык",
      majorAccident: "🚑 Сиздин унааңыздын кырсыгы",
    },
    en: {
      blocking: "🚧 Car is blocking the road",
      parking: "🅿️ Wrong parking",
      alarm: "🚨 Alarm activated",
      lightsOn: "💡 Your car headlights are on",
      windowOpen: "🚗 Your car window is open",
      majorAccident: "🚑 Accident with your car",
    },
  };

  const lang = translations[language] || translations.ru;
  const messages = types.map((type, index) => {
    const key = type as keyof typeof lang;
    const translation = lang[key];
    if (translation) {
      return `${index + 1}. ${translation}`;
    } else {
      console.log(`⚠️ Missing translation for type: ${type} in language: ${language}`);
      return `${index + 1}. ${type}`;
    }
  });

  const greetings: Record<string, { single: string; multiple: string }> = {
    ru: {
      single: "Здравствуйте!\nВам отправлено уведомление:",
      multiple: "Здравствуйте!\nВам отправлены уведомления:"
    },
    ky: {
      single: "Саламатсызбы!\nСизге билдирүү жөнөтүлдү:",
      multiple: "Саламатсызбы!\nСизге билдирүүлөр жөнөтүлдү:"
    },
    en: {
      single: "Hello!\nYou have received a notification:",
      multiple: "Hello!\nYou have received notifications:"
    }
  };

  const greeting = types.length === 1
    ? greetings[language]?.single || greetings.ru.single
    : greetings[language]?.multiple || greetings.ru.multiple;

  // Ensure proper line breaks
  const messageList = messages.join("\n");
  return `${greeting}\n${messageList}`;
};

export const sendNotification = async (
  qrToken: string,
  types: string[],
  senderIp: string,
  language: string = 'ru',
  message?: string,
): Promise<void> => {
  // Validate QR token and get user
  const user = await getUserByQRToken(qrToken, language);

  // Get fresh user data with language preference
  const freshUser = await query(
    `SELECT id, first_name, last_name, phone, status, language, avatar_url, telegram_username, push_subscription FROM users WHERE id = $1`,
    [user.id]
  );

  const updatedUser = freshUser.rows[0] || user;
  const recipientLanguage = updatedUser.language || 'ru';

  // Check owner's received notifications limit - same logic as limits API
  const ownerResult = await query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
    [user.id]
  );

  const ownerCount = parseInt(ownerResult.rows[0]?.count || '0');
  if (ownerCount >= OWNER_LIMIT) {
    throw createError(
      429,
      "OWNER_LIMIT_EXCEEDED",
      `Owner has reached daily notification limit (${OWNER_LIMIT} notifications per day)`,
    );
  }

  // Check sender's sent notifications limit - same logic as limits API
  const senderResult = await query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE sender_ip = $1 AND user_id = $2 AND DATE(created_at) = CURRENT_DATE`,
    [senderIp, updatedUser.id]
  );

  const senderCount = parseInt(senderResult.rows[0]?.count || '0');
  if (senderCount >= SENDER_LIMIT) {
    throw createError(
      429,
      "SENDER_LIMIT_EXCEEDED",
      `Sender has reached daily sending limit for this owner (${SENDER_LIMIT} notifications per day per owner)`,
    );
  }



  // Filter out invalid types
  const validTypes = types.filter(type => type && typeof type === 'string');

  const notificationText = getNotificationText(validTypes, recipientLanguage || 'ru');

  // Save notification to database
  const notification = await NotificationModel.create({
    user_id: updatedUser.id,
    sender_ip: senderIp,
    notification_types: validTypes,
    message: notificationText
  });

  // Push notification titles by language
  const pushTitles = {
    ru: {
      parking: '🅿️ Неправильная парковка',
      blocking: '🚧 Блокирует проезд',
      alarm: '🚨 Сработала сигнализация',
      lightsOn: '💡 Включены фары',
      windowOpen: '🚗 Открыто окно',
      majorAccident: '🚑 ДТП с вашей машиной'
    },
    ky: {
      parking: '🅿️ Туура эмес парковка',
      blocking: '🚧 Жолду бөгөп турат',
      alarm: '🚨 Сигнализация иштээт',
      lightsOn: '💡 Фараларыңыздын жарыгы жанып жатат',
      windowOpen: '🚗 Машинаныздагы терезе ачык',
      majorAccident: '🚑 Машинаныз кырсыгы'
    },
    en: {
      parking: '🅿️ Wrong parking',
      blocking: '🚧 Car blocking road',
      alarm: '🚨 Alarm activated',
      lightsOn: '💡 Car headlights are on',
      windowOpen: '🚗 Car window is open',
      majorAccident: '🚑 Accident with your car'
    }
  };

  // Use recipient's language for push notifications
  const titles = pushTitles[recipientLanguage as keyof typeof pushTitles] || pushTitles.ru;
  const primaryType = validTypes[0] || 'default';
  let pushTitle = titles[primaryType as keyof typeof titles] || 'EXELIX';



  // Send notifications
  // Enqueue for background worker if possible
  let enqueued = false;
  try {
    enqueued = await enqueueNotification({
      userId: updatedUser.id,
      pushSubscription: updatedUser.push_subscription,
      telegram: updatedUser.telegram,
      message: notificationText,
    });
  } catch (error) {
    console.error("Failed to enqueue notification:", error);
    // Continue with fallback
  }

  if (!enqueued) {
    // Fallback: send inline (best-effort)
    // Send only Push notification if available
    if (updatedUser.push_subscription) {
      try {
        const subscription = JSON.parse(updatedUser.push_subscription);

        // Определяем основной тип уведомления для заголовка
        const primaryType = types[0] || 'default';
        const titles = pushTitles[updatedUser.language as keyof typeof pushTitles] || pushTitles.ru;
        let pushTitle = titles[primaryType as keyof typeof titles] || 'EXELIX';

        const res: any = await sendPushNotification(
          updatedUser.id,
          {
            title: pushTitle,
            body: notificationText, // Полный текст как в странице Сообщения
            icon: '/icon-192.png',
            data: {
              type: primaryType,
              types: validTypes,
              originalMessage: notificationText // Полный список уведомлений
            }
          }
        );
        if (res === "EXPIRED") {
          await query(
            `UPDATE users SET push_subscription = NULL WHERE id = $1`,
            [user.id],
          );
        }

      } catch (error) {
        console.error("Push notification error:", error);
        // Don't throw - notification is already saved in DB
      }
    }
  }

  // Уведомление успешно сохранено в БД, даже если отправка не удалась
  // Это нормально для dev-режима без настроенных сервисов
};

export { checkRateLimit };

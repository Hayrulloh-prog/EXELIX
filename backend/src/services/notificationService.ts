import { query } from "../config/database";
import { createError } from "../utils/errors";
import { getUserByQRToken } from "./qrService";
import { sendPushNotification } from "./pushService";
import { sendTelegramNotification } from "./telegramService";
import { enqueueNotification } from "../queues/notificationQueue";
import { v4 as uuidv4 } from "uuid";

const SENDER_LIMIT = 3;
const OWNER_LIMIT = 10;

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
): Promise<{ allowed: boolean; resetAt?: Date }> => {
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
    if (record.count >= limit) {
      return { allowed: false, resetAt: record.reset_at };
    }
  }

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  return { allowed: true, resetAt: tomorrowStart };
};

const incrementRateLimit = async (
  userId: string | null,
  ip: string,
  type: "sender" | "receiver",
): Promise<void> => {
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  // Check if record exists
  const existing = await query(
    `SELECT id, count FROM rate_limits
     WHERE (user_id = $1 OR ($1 IS NULL AND user_id IS NULL))
       AND ip_address = $2
       AND type = $3
       AND reset_at > NOW()`,
    [userId, ip, type],
  );

  if (existing.rows.length > 0) {
    // Update existing
    await query(`UPDATE rate_limits SET count = count + 1 WHERE id = $1`, [
      existing.rows[0].id,
    ]);
  } else {
    // Insert new
    await query(
      `INSERT INTO rate_limits (id, user_id, ip_address, type, count, reset_at, created_at)
       VALUES ($1, $2, $3, $4, 1, $5, NOW())`,
      [uuidv4(), userId, ip, type, tomorrowStart],
    );
  }
};

const getNotificationText = (types: string[], language: string): string => {
  const translations: Record<string, Record<string, string>> = {
    ru: {
      blocking: "🚧 Авто перекрывает проезд",
      parking: "🅿️ Неправильная парковка",
      alarm: "🚨 Сработала сигнализация",
      evacuation: "🚓 Авто эвакуируют",
      minorAccident: "🚗 Небольшое ДТП",
      majorAccident: "🚑 Серьёзное ДТП",
    },
    ky: {
      blocking: "🚧 Көчөнү бөгөп турат",
      parking: "🅿️ Туура эмес парковка",
      alarm: "🚨 Сигнализация иштээт",
      evacuation: "🚓 Эвакуацияланып жатат",
      minorAccident: "🚗 Кичине авария",
      majorAccident: "🚑 Чоң авария",
    },
    en: {
      blocking: "🚧 Car is blocking the road",
      parking: "🅿️ Wrong parking",
      alarm: "🚨 Alarm activated",
      evacuation: "🚓 Car is being towed",
      minorAccident: "🚗 Minor accident",
      majorAccident: "🚑 Major accident",
    },
  };

  const lang = translations[language] || translations.ru;
  const messages = types.map((type) => {
    const key = type as keyof typeof lang;
    return lang[key] || type;
  });

  const greetings: Record<string, string> = {
    ru: "Здравствуйте!\nВам отправлено уведомление:",
    ky: "Саламатсызбы!\nСизге билдирүү жөнөтүлдү:",
    en: "Hello!\nYou have received a notification:",
  };

  return `${greetings[language] || greetings.ru}\n${messages.join("\n")}`;
};

export const sendNotification = async (
  qrToken: string,
  types: string[],
  senderIp: string,
  message?: string,
): Promise<void> => {
  // Validate QR token and get user
  const user = await getUserByQRToken(qrToken);

  // Check owner rate limit
  const ownerLimit = await checkRateLimit(user.id, senderIp, "receiver");
  if (!ownerLimit.allowed) {
    throw createError(
      429,
      "OWNER_LIMIT_EXCEEDED",
      "Owner has reached daily notification limit",
    );
  }

  // Check sender rate limit
  const senderLimit = await checkRateLimit(null, senderIp, "sender");
  if (!senderLimit.allowed) {
    throw createError(
      429,
      "RATE_LIMIT_EXCEEDED",
      "Daily sending limit reached",
    );
  }

  // Create notification record
  const notificationId = uuidv4();
  await query(
    `INSERT INTO notifications (id, user_id, sender_ip, notification_type, message, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [notificationId, user.id, senderIp, types.join(","), message || null],
  );

  // Increment rate limits
  await incrementRateLimit(user.id, senderIp, "receiver");
  await incrementRateLimit(null, senderIp, "sender");

  // Send notifications
  const notificationText = getNotificationText(types, user.language);
  // Enqueue for background worker if possible
  const enqueued = await enqueueNotification({
    userId: user.id,
    pushSubscription: user.push_subscription,
    telegram: user.telegram,
    message: notificationText,
  });

  if (!enqueued) {
    // Fallback: send inline (best-effort)
    if (user.push_subscription) {
      try {
        const res: any = await sendPushNotification(
          JSON.parse(user.push_subscription),
          notificationText,
        );
        if (res === "EXPIRED") {
          await query(
            `UPDATE users SET push_subscription = NULL WHERE id = $1`,
            [user.id],
          );
        }
      } catch (error) {
        console.error("Push notification error:", error);
      }
    }

    if (user.telegram) {
      try {
        await sendTelegramNotification(user.telegram, notificationText);
      } catch (error) {
        console.error("Telegram notification error:", error);
      }
    }
  }
};

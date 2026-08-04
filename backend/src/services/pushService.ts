import webpush from "web-push";
import dotenv from "dotenv";
import { query } from "../config/database";

dotenv.config();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@exelix.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export const sendPushNotification = async (
  userId: string,
  message: PushMessage
): Promise<boolean> => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping push notification");
    return false;
  }

  try {
    // Get user's push subscriptions
    const result = await query(
      'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1 AND active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log("No active push subscriptions for user:", userId);
      return false;
    }

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      icon: message.icon || "/icon-192x192.png",
      badge: message.badge || "/icon-96x96.png",
      data: message.data || {},
      timestamp: Date.now()
    });

    // Send to all active subscriptions
    const promises = result.rows.map(async (subscription: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          payload
        );
        return true;
      } catch (error: any) {
        if (error.statusCode === 410) {
          // Subscription expired, deactivate it
          await query(
            'UPDATE push_subscriptions SET active = false WHERE endpoint = $1',
            [subscription.endpoint]
          );
          console.log("Push subscription expired and deactivated");
        } else {
          console.error("Push notification failed:", error);
        }
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(success => success);
  } catch (error) {
    console.error("Push notification error:", error);
    return false;
  }
};

export const getVapidPublicKey = (): string => {
  return vapidPublicKey;
};

export const savePushSubscription = async (
  userId: string,
  subscription: PushSubscription
): Promise<void> => {
  try {
    await query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = $1,
        p256dh_key = $3,
        auth_key = $4,
        active = true
    `, [
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ]);
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    throw error;
  }
};

export const removePushSubscription = async (
  endpoint: string
): Promise<void> => {
  try {
    await query(
      'UPDATE push_subscriptions SET active = false WHERE endpoint = $1',
      [endpoint]
    );
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    throw error;
  }
};

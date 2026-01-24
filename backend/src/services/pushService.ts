import webpush from "web-push";
import dotenv from "dotenv";

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

export const sendPushNotification = async (
  subscription: PushSubscription,
  message: string,
): Promise<"OK" | "EXPIRED" | void> => {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured, skipping push notification");
    return;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "EXELIX",
        body: message,
        icon: "/icon-192x192.png",
        badge: "/icon-96x96.png",
      }),
    );
    return "OK";
  } catch (error: any) {
    if (error.statusCode === 410) {
      console.log("Push subscription expired");
      return "EXPIRED";
    }
    throw error;
  }
};

export const getVapidPublicKey = (): string => {
  return vapidPublicKey;
};

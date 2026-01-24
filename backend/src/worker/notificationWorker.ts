import { notificationQueue } from "../queues/notificationQueue";
import { sendPushNotification } from "../services/pushService";
import { sendTelegramNotification } from "../services/telegramService";
import { query } from "../config/database";

notificationQueue.process(async (job) => {
  const { userId, pushSubscription, telegram, message } = job.data;

  // Push
  if (pushSubscription) {
    try {
      const res: any = await sendPushNotification(
        JSON.parse(pushSubscription),
        message,
      );
      if (res === "EXPIRED") {
        // Remove subscription from DB
        await query(`UPDATE users SET push_subscription = NULL WHERE id = $1`, [
          userId,
        ]);
      }
    } catch (err) {
      console.error("Worker push send error", err);
    }
  }

  // Telegram
  if (telegram) {
    try {
      await sendTelegramNotification(telegram, message);
    } catch (err) {
      console.error("Worker telegram send error", err);
    }
  }

  return Promise.resolve();
});

console.log("Notification worker started");

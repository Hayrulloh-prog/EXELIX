import { notificationQueue } from "../queues/notificationQueue";
import { sendPushNotification } from "../services/pushService";
import { query } from "../config/database";

if (notificationQueue) {
  notificationQueue.process(async (job: any) => {
  const { userId, pushSubscription, message } = job.data;

  // Push
  if (pushSubscription) {
    try {
      const res: any = await sendPushNotification(
        userId,
        {
          title: 'EXELIX Уведомление',
          body: message,
          icon: '/icon-192.png'
        }
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

  return Promise.resolve();
});
}

console.log("Notification worker started");

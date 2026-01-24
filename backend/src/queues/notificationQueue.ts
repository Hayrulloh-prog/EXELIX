import Queue from "bull";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const notificationQueue = new Queue("notifications", redisUrl as any);

export const enqueueNotification = async (payload: any) => {
  if (!process.env.REDIS_URL) {
    // No Redis configured — return false so caller can fallback
    return false;
  }

  await notificationQueue.add(payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });

  return true;
};

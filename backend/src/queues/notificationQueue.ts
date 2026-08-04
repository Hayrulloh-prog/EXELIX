import Queue, { Queue as QueueType } from "bull";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let notificationQueue: QueueType | null = null;

// Ленивая инициализация очереди
const getQueue = (): QueueType | null => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!notificationQueue) {
    try {
      notificationQueue = new Queue("notifications", redisUrl as any);
      notificationQueue.on("error", (error: any) => {
        console.error("Notification queue error:", error);
      });
    } catch (error) {
      console.error("Failed to create notification queue:", error);
      return null;
    }
  }

  return notificationQueue;
};

export const enqueueNotification = async (payload: any): Promise<boolean> => {
  const queue = getQueue();

  if (!queue) {
    // No Redis configured — return false so caller can fallback
    return false;
  }

  try {
    const addPromise = queue.add(payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    
    // Fail fast if Redis is down and hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis queue timeout')), 1500)
    );
    
    await Promise.race([addPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error("Failed to enqueue notification (falling back to inline):", (error as Error).message);
    // Return false to allow fallback to inline sending
    return false;
  }
};

export { notificationQueue };

import Redis from "ioredis";

const redisEnabled =
  process.env.REDIS_ENABLED === "true" || !!process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (redisEnabled) {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  redisClient = new Redis(url);

  redisClient.on("error", (err: any) => {
    console.error("Redis Client Error", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client Connected");
  });
}

export const redis = redisClient;

export const getCache = async (key: string): Promise<string | null> => {
  if (!redis || !redisEnabled) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis get error", error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttl?: number,
): Promise<void> => {
  if (!redis || !redisEnabled) return;
  try {
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  } catch (error) {
    console.error("Redis set error", error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redis || !redisEnabled) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis delete error", error);
  }
};

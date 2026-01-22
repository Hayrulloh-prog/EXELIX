import { createClient } from 'redis';

const redisEnabled = process.env.REDIS_ENABLED === 'true';

let redisClient: ReturnType<typeof createClient> | null = null;

if (redisEnabled) {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  redisClient.connect().catch(console.error);
}

export const redis = redisClient;

export const getCache = async (key: string): Promise<string | null> => {
  if (!redis || !redisEnabled) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis get error', error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttl?: number
): Promise<void> => {
  if (!redis || !redisEnabled) return;
  try {
    if (ttl) {
      await redis.setEx(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  } catch (error) {
    console.error('Redis set error', error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redis || !redisEnabled) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error', error);
  }
};

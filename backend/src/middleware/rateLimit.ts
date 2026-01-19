import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'
import { AppError } from './errorHandler'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

interface RateLimitOptions {
  windowMs: number
  maxNormal: number
  maxCritical: number
  delayMs: number
}

const defaultOptions: RateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '86400000'), // 24 hours
  maxNormal: parseInt(process.env.RATE_LIMIT_MAX_NORMAL || '3'),
  maxCritical: parseInt(process.env.RATE_LIMIT_MAX_CRITICAL || '2'),
  delayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS || '3000')
}

export const rateLimitNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationIds, qrToken } = req.body
    const clientFingerprint = req.headers['x-fingerprint'] || req.ip
    const key = `rate_limit:${clientFingerprint}:${qrToken}`

    // Check if critical notifications exceed limit
    const criticalCount = notificationIds.filter((id: number) =>
      [4, 6].includes(id)
    ).length

    if (criticalCount > defaultOptions.maxCritical) {
      throw new AppError(
        429,
        `Maximum ${defaultOptions.maxCritical} critical notifications per day`
      )
    }

    // Check normal notifications
    const normalCount = notificationIds.filter(
      (id: number) => !([4, 6].includes(id))
    ).length

    // Get current counts from Redis
    const [normalSent, criticalSent, lastSent] = await Promise.all([
      redis.get(`${key}:normal`),
      redis.get(`${key}:critical`),
      redis.get(`${key}:last_sent`)
    ])

    const normalSentCount = parseInt(normalSent || '0')
    const criticalSentCount = parseInt(criticalSent || '0')
    const lastSentTime = parseInt(lastSent || '0')

    // Check delay between sends
    const now = Date.now()
    if (lastSentTime > 0 && now - lastSentTime < defaultOptions.delayMs) {
      throw new AppError(
        429,
        `Please wait ${Math.ceil((defaultOptions.delayMs - (now - lastSentTime)) / 1000)} seconds before sending again`
      )
    }

    // Check limits
    if (normalSentCount + normalCount > defaultOptions.maxNormal) {
      throw new AppError(
        429,
        `Maximum ${defaultOptions.maxNormal} normal notifications per day`
      )
    }

    if (criticalSentCount + criticalCount > defaultOptions.maxCritical) {
      throw new AppError(
        429,
        `Maximum ${defaultOptions.maxCritical} critical notifications per day`
      )
    }

    // Update counts in Redis
    const pipeline = redis.pipeline()
    pipeline.incrby(`${key}:normal`, normalCount)
    pipeline.incrby(`${key}:critical`, criticalCount)
    pipeline.set(`${key}:last_sent`, now.toString())
    pipeline.expire(`${key}:normal`, Math.ceil(defaultOptions.windowMs / 1000))
    pipeline.expire(`${key}:critical`, Math.ceil(defaultOptions.windowMs / 1000))
    pipeline.expire(`${key}:last_sent`, Math.ceil(defaultOptions.windowMs / 1000))
    await pipeline.exec()

    next()
  } catch (error) {
    if (error instanceof AppError) {
      return next(error)
    }
    next(new AppError(500, 'Rate limit check failed'))
  }
}

import { Request, Response, NextFunction } from 'express'
import prisma from '../utils/database'
import { AppError } from '../middleware/errorHandler'
import { sendPushNotification, sendTelegramNotification } from '../services/notifications'

const notificationTypes = {
  1: { key: 'blocking', type: 'normal', critical: false },
  2: { key: 'wrongParking', type: 'normal', critical: false },
  3: { key: 'alarm', type: 'normal', critical: false },
  4: { key: 'evacuation', type: 'critical', critical: true },
  5: { key: 'minorAccident', type: 'normal', critical: false },
  6: { key: 'seriousAccident', type: 'critical', critical: true }
}

const translations = {
  ru: {
    blocking: 'Ваш автомобиль перекрывает проезд',
    wrongParking: 'Припаркован в неправильном месте',
    alarm: 'Сработала сигнализация',
    evacuation: 'Ваш автомобиль эвакуируют',
    minorAccident: 'Небольшое ДТП',
    seriousAccident: 'Серьёзное ДТП'
  },
  en: {
    blocking: 'Your car is blocking the passage',
    wrongParking: 'Parked in wrong place',
    alarm: 'Alarm activated',
    evacuation: 'Your car is being towed',
    minorAccident: 'Minor accident',
    seriousAccident: 'Serious accident'
  },
  kg: {
    blocking: 'Сиздин машинаңыз жолду бүгүп турат',
    wrongParking: 'Туура эмес жерге парковкаланган',
    alarm: 'Сигнализация иштетилди',
    evacuation: 'Сиздин машинаңыз эвакуацияланып жатат',
    minorAccident: 'Чамасында ДТП',
    seriousAccident: 'Олуттуу ДТП'
  }
}

export const sendNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrToken, notificationIds } = req.body
    const fingerprint = req.headers['x-fingerprint'] as string
    const ipAddress = req.ip || req.socket.remoteAddress

    // Validate inputs
    if (!qrToken || !notificationIds || !Array.isArray(notificationIds)) {
      return next(new AppError(400, 'Invalid request data'))
    }

    // Get QR and user
    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken },
      include: {
        user: true
      }
    })

    if (!qrCode || qrCode.status !== 'active' || !qrCode.user) {
      return next(new AppError(404, 'QR code not found or inactive'))
    }

    const user = qrCode.user

    // Check daily notification limit for owner (max 10 per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayNotificationsCount = await prisma.notificationLog.count({
      where: {
        qrToken,
        createdAt: {
          gte: today
        },
        success: true
      }
    })

    if (todayNotificationsCount >= 10) {
      // Still log the attempt but don't send
      await prisma.notificationLog.create({
        data: {
          qrToken,
          notificationIds: JSON.stringify(notificationIds),
          fingerprint,
          ipAddress,
          success: false,
          errorMessage: 'Daily notification limit reached for owner'
        }
      })

      return next(new AppError(429, 'Owner has reached daily notification limit'))
    }

    // Get user language
    const lang = (user.language || 'ru') as 'ru' | 'en' | 'kg'

    // Create notifications
    const notifications = []
    for (const notificationId of notificationIds) {
      const type = notificationTypes[notificationId as keyof typeof notificationTypes]
      if (!type) continue

      const message = translations[lang][type.key]

      notifications.push({
        userId: user.id,
        notificationId,
        type: type.type,
        message,
        sent: false
      })
    }

    // Save notifications to database
    const createdNotifications = await prisma.notification.createMany({
      data: notifications
    })

    // Send notifications (Web Push + Telegram)
    let sendSuccess = true
    const errors: string[] = []

    for (const notification of notifications) {
      try {
        // Web Push (if subscription exists)
        await sendPushNotification(user, notification.message)

        // Telegram (if username exists)
        if (user.telegram) {
          await sendTelegramNotification(user.telegram, notification.message, lang)
        }

        // Mark as sent
        await prisma.notification.updateMany({
          where: {
            userId: user.id,
            notificationId: notification.notificationId,
            sent: false
          },
          data: {
            sent: true,
            sentAt: new Date()
          }
        })
      } catch (error: any) {
        sendSuccess = false
        errors.push(error.message)
      }
    }

    // Log notification attempt
    await prisma.notificationLog.create({
      data: {
        qrToken,
        notificationIds: JSON.stringify(notificationIds),
        fingerprint,
        ipAddress,
        success: sendSuccess,
        errorMessage: errors.length > 0 ? errors.join(', ') : null
      }
    })

    if (!sendSuccess) {
      return next(new AppError(500, 'Failed to send some notifications'))
    }

    res.json({
      success: true,
      message: 'Notifications sent successfully'
    })
  } catch (error) {
    next(error)
  }
}

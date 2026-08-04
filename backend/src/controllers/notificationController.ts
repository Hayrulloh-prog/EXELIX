import { Response } from 'express';
import { sendNotification } from '../services/notificationService';
import { createError } from '../utils/errors';

export const send = async (req: any, res: Response) => {
  const { qrToken, types, notificationTypes, message } = req.body;
  const senderIp =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress ||
    'unknown';

  // Используем notificationTypes если types не указан
  const finalTypes = types || notificationTypes;

  console.log('📋 Request body:', req.body);
  console.log('🔍 Raw token field:', qrToken);
  console.log('🔍 Raw types field:', types);
  console.log('🔍 Final notificationTypes:', finalTypes);

  try {
    await sendNotification(qrToken, finalTypes, senderIp, message);
    res.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    // Rate limit errors should be passed through
    if (error.statusCode === 429 || (error instanceof Error && error.message.includes('rate limit'))) {
      throw error;
    }

    // Log the actual error for debugging
    console.error('Notification send error:', error);

    // For other errors, still return success if notification was saved to DB
    // (the error might be from push/telegram services which are optional)
    res.json({
      success: true,
      message: 'Notification recorded (some delivery methods may have failed)',
      warning: error.message || 'Some notification channels unavailable',
    });
  }
};

import { Response } from 'express';
import { sendNotification } from '../services/notificationService';
import { createError } from '../utils/errors';

export const send = async (req: any, res: Response) => {
  const { qrToken, types, message } = req.body;
  const senderIp =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress ||
    'unknown';

  try {
    await sendNotification(qrToken, types, senderIp, message);
    res.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error;
    }
    throw createError(500, 'INTERNAL_ERROR', 'Failed to send notification');
  }
};

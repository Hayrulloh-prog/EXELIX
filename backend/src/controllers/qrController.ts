import { Response } from 'express';
import { validateQRToken } from '../services/qrService';
import { createError } from '../utils/errors';

export const validateQR = async (req: any, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createError(400, 'VALIDATION_ERROR', 'Token is required');
  }

  const validation = await validateQRToken(token);

  if (!validation.valid) {
    return res.json({
      valid: false,
      used: false,
      canRegister: false,
      error: 'Invalid QR code',
    });
  }

  res.json({
    valid: true,
    used: validation.used,
    canRegister: !validation.used,
    userId: validation.userId,
  });
};

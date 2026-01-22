import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { createError } from './errors';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

export const validateRegister = [
  body('qrToken').notEmpty().withMessage('QR token is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name too long'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone format'),
  body('phoneCountry')
    .isIn(['KG', 'RU'])
    .withMessage('Phone country must be KG or RU'),
  body('telegram')
    .optional()
    .trim()
    .matches(/^@?[a-zA-Z0-9_]{5,32}$/)
    .withMessage('Invalid Telegram username'),
  body('status').isIn(['open', 'closed']).withMessage('Status must be open or closed'),
  body('language')
    .isIn(['ru', 'ky', 'en'])
    .withMessage('Language must be ru, ky, or en'),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('First name too long'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Last name too long'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone format'),
  body('phoneCountry')
    .optional()
    .isIn(['KG', 'RU'])
    .withMessage('Phone country must be KG or RU'),
  body('telegram')
    .optional()
    .trim()
    .matches(/^@?[a-zA-Z0-9_]{5,32}$/)
    .withMessage('Invalid Telegram username'),
  body('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('Status must be open or closed'),
  body('language')
    .optional()
    .isIn(['ru', 'ky', 'en'])
    .withMessage('Language must be ru, ky, or en'),
  handleValidationErrors,
];

export const validateSendNotification = [
  body('qrToken').notEmpty().withMessage('QR token is required'),
  body('types')
    .isArray({ min: 1 })
    .withMessage('At least one notification type is required')
    .custom((types) => {
      const validTypes = [
        'blocking',
        'parking',
        'alarm',
        'evacuation',
        'minorAccident',
        'majorAccident',
      ];
      return types.every((type: string) => validTypes.includes(type));
    })
    .withMessage('Invalid notification type'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message too long'),
  handleValidationErrors,
];

export const validateAdminLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateGenerateQR = [
  body('count')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Count must be between 1 and 1000'),
  handleValidationErrors,
];

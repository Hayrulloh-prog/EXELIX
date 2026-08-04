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
    const errorMessages = errors.array().map((err: any) => err.msg || err.message);
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: errorMessages[0] || 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

export const validateRegistration = [
  body('token').notEmpty().withMessage('QR token is required'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 20 })
    .withMessage('First name too long'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 20 })
    .withMessage('Last name too long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .custom((value, { req }) => {
      const cleanPhone = value.replace(/\D/g, '');
      const phoneCountry = (req.body.phoneCountry || 'kg').toUpperCase();
      const language = req.headers?.['accept-language'] || req.body.language || 'ru';

      // Проверка для Кыргызстана
      if (phoneCountry === 'KG') {
        // Проверяем кыргызские форматы: 0XXXXXXX, 9XXXXXXX, 5XXXXXXX, 4XXXXXXX, 3XXXXXXX, 2XXXXXXX (9 или 10 цифр)
        if (!cleanPhone.match(/^[095432]\d{8,9}$/) && !cleanPhone.match(/^996\d{9}$/)) {
          const messages: Record<string, string> = {
            ru: 'Неверный формат номера для Кыргызстана',
            ky: 'Кыргызстан үчүн телефон номурунун форматы туура эмес',
            en: 'Invalid phone number format for Kyrgyzstan'
          };
          throw new Error(messages[language] || messages.ru);
        }
      }

      // Проверка для России
      if (phoneCountry === 'RU') {
        if (!cleanPhone.match(/^9\d{9}$/) && !cleanPhone.match(/^7\d{10}$/) && !cleanPhone.match(/^8\d{9}$/)) {
          const messages: Record<string, string> = {
            ru: 'Неверный формат номера для России',
            ky: 'Россия үчүн телефон номурунун форматы туура эмес',
            en: 'Invalid phone number format for Russia'
          };
          throw new Error(messages[language] || messages.ru);
        }
      }

      return true;
    }),
  body('phoneCountry')
    .optional()
    .isIn(['KG', 'RU', 'kg', 'ru'])
    .withMessage('Phone country must be KG or RU'),
  body('telegramUsername')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Пустое значение допустимо
      }
      if (!/^@?[a-zA-Z0-9_]{5,20}$/.test(value)) {
        throw new Error('Invalid Telegram username');
      }
      return true;
    }),
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

export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 20 })
    .withMessage('First name too long'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Last name too long'),
  body('phone')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (!value) return true;

      const cleanPhone = value.replace(/\D/g, '');
      const phoneCountry = (req.body.phoneCountry || 'kg').toUpperCase();
      const language = req.headers?.['accept-language'] || req.body.language || 'ru';

      // Проверка для Кыргызстана
      if (phoneCountry === 'KG') {
        // Проверяем кыргызские форматы: 0XXXXXXX, 9XXXXXXX, 5XXXXXXX, 4XXXXXXX, 3XXXXXXX, 2XXXXXXX (9 или 10 цифр)
        if (!cleanPhone.match(/^[095432]\d{8,9}$/) && !cleanPhone.match(/^996\d{9}$/)) {
          const messages: Record<string, string> = {
            ru: 'Неверный формат номера для Кыргызстана',
            ky: 'Кыргызстан үчүн телефон номурунун форматы туура эмес',
            en: 'Invalid phone number format for Kyrgyzstan'
          };
          throw new Error(messages[language] || messages.ru);
        }
      }

      // Проверка для России
      if (phoneCountry === 'RU') {
        if (!cleanPhone.match(/^9\d{9}$/) && !cleanPhone.match(/^7\d{10}$/) && !cleanPhone.match(/^8\d{9}$/)) {
          const messages: Record<string, string> = {
            ru: 'Неверный формат номера для России',
            ky: 'Россия үчүн телефон номурунун форматы туура эмес',
            en: 'Invalid phone number format for Russia'
          };
          throw new Error(messages[language] || messages.ru);
        }
      }

      return true;
    }),
  body('phoneCountry')
    .optional()
    .isIn(['KG', 'RU'])
    .withMessage('Phone country must be KG or RU'),
  body('telegram')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // Пустое значение допустимо
      }
      if (!/^@?[a-zA-Z0-9_]{5,20}$/.test(value)) {
        throw new Error('Invalid Telegram username');
      }
      return true;
    }),
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

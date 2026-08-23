import rateLimit from 'express-rate-limit';

// Общий rate limiting для всех API запросов
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов за 15 минут (для 20k+ пользователей)
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Слишком много запросов. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий rate limiting для аутентификации
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20, // увеличено до 20 попыток входа за 15 минут
  keyGenerator: (req: any) => {
    // Используем IP для неаутентифицированных запросов
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Слишком много попыток входа. Попробуйте через 15 минут.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting для регистрации
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 30, // 30 попыток регистрации за час
  message: (req: any, res: any) => {
    // Определяем язык из заголовка или параметра
    const language = req.headers['accept-language'] || req.query.language || 'ru';

    const messages: Record<string, string> = {
      ru: 'Слишком много попыток регистрации. Попробуйте через час.',
      ky: 'Каттошон катто кылуулар. Сааттан кийин аракет кылыңыз.',
      en: 'Too many registration attempts. Please try again in an hour.'
    };

    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: messages[language] || messages.ru
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting для отправки уведомлений
export const notificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 50, // максимум 50 уведомлений за час НА ПОЛЬЗОВАТЕЛЯ
  keyGenerator: (req: any) => {
    // Для уведомлений используем IP (публичный доступ)
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  message: (req: any, res: any) => {
    // Определяем язык из заголовка или параметра
    const language = req.headers['accept-language'] || req.query.language || 'ru';

    const messages: Record<string, string> = {
      ru: 'Лимит уведомлений исчерпан. Попробуйте через час.',
      ky: 'Билдирүүлөр чеги бүткөн. Сааттан кийин аракет кылыңыз.',
      en: 'Notification limit exceeded. Please try again in an hour.'
    };

    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: messages[language] || messages.ru
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting для аутентифицированных пользователей (личный кабинет)
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // 1000 запросов за 15 минут НА ПОЛЬЗОВАТЕЛЯ
  keyGenerator: (req: any) => {
    // Для аутентифицированных пользователей используем user ID
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    // Fallback на IP для неаутентифицированных
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Слишком много запросов. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting для QR кодов
export const qrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 500, // максимум 500 запросов QR кодов за 15 минут (polling)
  message: (req: any, res: any) => {
    // Определяем язык из заголовка или параметра
    const language = req.headers['accept-language'] || req.query.language || 'ru';

    const messages: Record<string, string> = {
      ru: 'Слишком много запросов QR кодов. Попробуйте через час.',
      ky: 'QR коддор үчүн өтө көп суроолор. Сааттан кийин аракет кылыңыз.',
      en: 'Too many QR code requests. Please try again in an hour.'
    };

    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: messages[language] || messages.ru
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

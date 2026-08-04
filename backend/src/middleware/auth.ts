import { Request, Response, NextFunction } from 'express';
import { verifyToken, verifyAdminToken, JWTPayload } from '../utils/jwt';
import { createError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(`🔐 Auth middleware called for ${req.method} ${req.path}`);
    console.log(`📋 Authorization header:`, req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ No valid authorization header found`);
      throw createError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.substring(7);
    console.log(`🎫 Token extracted: ${token.substring(0, 20)}...`);

    const payload = verifyToken(token);
    console.log(`✅ Token verified for user: ${payload.userId}`);

    req.user = payload;
    next();
  } catch (error: any) {
    console.log(`❌ Auth error:`, error.message);
    if (error instanceof Error && error.message === 'Invalid token') {
      const language = req.headers['accept-language']?.split(',')[0] || 'ru';
      const userTokenErrorMessages: Record<string, string> = {
        ru: 'Недействительный или просроченный токен',
        ky: 'Жараксыз же мөөнөтү бүткөн токен',
        en: 'Invalid or expired token'
      };
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: userTokenErrorMessages[language] || userTokenErrorMessages.ru,
      });
    }
    next(error);
  }
};

export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const language = req.headers['accept-language']?.split(',')[0] || 'ru';
    const errorMessages: Record<string, string> = {
      ru: 'Требуется авторизация',
      ky: 'Авторизация талап кылынат',
      en: 'Authentication required'
    };
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: errorMessages[language] || errorMessages.ru,
      });
    }

    const token = authHeader.substring(7);
    try {
      const payload = verifyAdminToken(token);
      req.user = { ...payload, type: 'admin' };
      next();
    } catch (tokenError: any) {
      const tokenErrorMessages: Record<string, string> = {
        ru: 'Недействительный или просроченный токен администратора',
        ky: 'Жараксыз же мөөнөтү бүткөн администратор токени',
        en: 'Invalid or expired admin token'
      };
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: tokenErrorMessages[language] || tokenErrorMessages.ru,
      });
    }
  } catch (error: any) {
    const language = req.headers['accept-language']?.split(',')[0] || 'ru';
    const failMessages: Record<string, string> = {
      ru: 'Ошибка авторизации',
      ky: 'Авторизация катасы',
      en: 'Authentication failed'
    };
    
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: failMessages[language] || failMessages.ru,
    });
  }
};

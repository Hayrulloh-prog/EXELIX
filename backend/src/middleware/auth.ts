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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.substring(7);
    const payload = verifyAdminToken(token);
    req.user = { ...payload, type: 'admin' };
    next();
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Invalid admin token') {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired admin token',
      });
    }
    next(error);
  }
};

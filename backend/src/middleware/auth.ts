import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
    role?: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized')
    }

    const token = authHeader.substring(7)

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string
      role?: string
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role
    }

    next()
  } catch (error) {
    if (error instanceof AppError) {
      return next(error)
    }
    next(new AppError(401, 'Invalid token'))
  }
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError(403, 'Admin access required'))
  }
  next()
}

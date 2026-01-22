import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret';

export interface JWTPayload {
  userId: string;
  type?: 'user' | 'admin';
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const generateAdminToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, ADMIN_JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const verifyAdminToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid admin token');
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { generateToken } from '../utils/jwt';
import { createError } from '../utils/errors';
import { validateQRToken, markQRAsUsed, getUserByQRToken } from '../services/qrService';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const register = async (req: AuthRequest, res: Response) => {
  const {
    qrToken,
    firstName,
    lastName,
    phone,
    phoneCountry,
    telegram,
    avatar,
    status,
    language,
  } = req.body;

  // Validate QR token
  const qrValidation = await validateQRToken(qrToken);
  if (!qrValidation.valid) {
    throw createError(400, 'INVALID_QR', 'Invalid QR code');
  }

  if (qrValidation.used) {
    throw createError(400, 'QR_ALREADY_USED', 'QR code already registered');
  }

  // Check if phone already exists
  const phoneCheck = await query(
    `SELECT id FROM users WHERE phone = $1 AND phone_country = $2`,
    [phone, phoneCountry]
  );

  if (phoneCheck.rows.length > 0) {
    throw createError(400, 'VALIDATION_ERROR', 'Phone number already registered');
  }

  // Process avatar
  let avatarUrl = null;
  if (avatar && avatar.startsWith('data:image')) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const userId = uuidv4();
      const avatarFilename = `${userId}-${Date.now()}.jpg`;
      const avatarPath = path.join(UPLOAD_DIR, avatarFilename);

      const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(avatarPath);

      avatarUrl = `/uploads/${avatarFilename}`;
    } catch (error) {
      console.error('Avatar processing error:', error);
    }
  }

  // Create user
  const userId = uuidv4();
  await query(
    `INSERT INTO users (
      id, qr_token, first_name, last_name, phone, phone_country,
      telegram, avatar_url, status, language, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
    [
      userId,
      qrToken,
      firstName,
      lastName,
      phone,
      phoneCountry,
      telegram || null,
      avatarUrl,
      status,
      language || 'ru',
    ]
  );

  // Mark QR as used
  await markQRAsUsed(qrToken, userId);

  // Generate token
  const token = generateToken({ userId });

  res.json({
    success: true,
    user: {
      id: userId,
      firstName,
      lastName,
      phone,
      phoneCountry,
      telegram,
      avatarUrl,
      status,
      language,
    },
    token,
  });
};

export const login = async (req: AuthRequest, res: Response) => {
  const { qrToken } = req.body;

  const qrValidation = await validateQRToken(qrToken);
  if (!qrValidation.valid || !qrValidation.used) {
    throw createError(400, 'INVALID_QR', 'Invalid or unused QR code');
  }

  if (!qrValidation.userId) {
    throw createError(400, 'INVALID_QR', 'QR code not associated with user');
  }

  const userResult = await query(`SELECT * FROM users WHERE id = $1`, [
    qrValidation.userId,
  ]);

  if (userResult.rows.length === 0) {
    throw createError(404, 'NOT_FOUND', 'User not found');
  }

  const user = userResult.rows[0];
  const token = generateToken({ userId: user.id });

  res.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      phoneCountry: user.phone_country,
      telegram: user.telegram,
      avatarUrl: user.avatar_url,
      status: user.status,
      language: user.language,
    },
    token,
  });
};

export const adminLogin = async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  const result = await query(`SELECT * FROM admins WHERE username = $1`, [
    username,
  ]);

  if (result.rows.length === 0) {
    throw createError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  const admin = result.rows[0];
  const isValid = await bcrypt.compare(password, admin.password_hash);

  if (!isValid) {
    throw createError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  // Update last login
  await query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [admin.id]);

  const { generateAdminToken } = require('../utils/jwt');
  const token = generateAdminToken({ userId: admin.id, type: 'admin' });

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
};

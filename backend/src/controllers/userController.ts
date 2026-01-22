import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { createError } from '../utils/errors';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw createError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const result = await query(`SELECT * FROM users WHERE id = $1`, [
    req.user.userId,
  ]);

  if (result.rows.length === 0) {
    throw createError(404, 'NOT_FOUND', 'User not found');
  }

  const user = result.rows[0];

  res.json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    phoneCountry: user.phone_country,
    telegram: user.telegram,
    avatarUrl: user.avatar_url,
    status: user.status,
    language: user.language,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw createError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const {
    firstName,
    lastName,
    phone,
    phoneCountry,
    telegram,
    avatar,
    status,
    language,
  } = req.body;

  // Get current user
  const currentUserResult = await query(`SELECT * FROM users WHERE id = $1`, [
    req.user.userId,
  ]);

  if (currentUserResult.rows.length === 0) {
    throw createError(404, 'NOT_FOUND', 'User not found');
  }

  const currentUser = currentUserResult.rows[0];

  // Check phone uniqueness if changed
  if (phone && phone !== currentUser.phone) {
    const phoneCheck = await query(
      `SELECT id FROM users WHERE phone = $1 AND phone_country = $2 AND id != $3`,
      [phone, phoneCountry || currentUser.phone_country, req.user.userId]
    );

    if (phoneCheck.rows.length > 0) {
      throw createError(400, 'VALIDATION_ERROR', 'Phone number already registered');
    }
  }

  // Process avatar if provided
  let avatarUrl = currentUser.avatar_url;
  if (avatar && avatar.startsWith('data:image')) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = path.join(UPLOAD_DIR, path.basename(avatarUrl));
        try {
          await fs.unlink(oldPath);
        } catch (error) {
          // Ignore if file doesn't exist
        }
      }

      const avatarFilename = `${req.user.userId}-${Date.now()}.jpg`;
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

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (firstName !== undefined) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(lastName);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (phoneCountry !== undefined) {
    updates.push(`phone_country = $${paramIndex++}`);
    values.push(phoneCountry);
  }
  if (telegram !== undefined) {
    updates.push(`telegram = $${paramIndex++}`);
    values.push(telegram || null);
  }
  if (avatarUrl !== currentUser.avatar_url) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(avatarUrl);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (language !== undefined) {
    updates.push(`language = $${paramIndex++}`);
    values.push(language);
  }

  updates.push(`updated_at = NOW()`);
  values.push(req.user.userId);

  if (updates.length > 1) {
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  // Get updated user
  const updatedResult = await query(`SELECT * FROM users WHERE id = $1`, [
    req.user.userId,
  ]);

  const updatedUser = updatedResult.rows[0];

  res.json({
    success: true,
    user: {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      phone: updatedUser.phone,
      phoneCountry: updatedUser.phone_country,
      telegram: updatedUser.telegram,
      avatarUrl: updatedUser.avatar_url,
      status: updatedUser.status,
      language: updatedUser.language,
    },
  });
};

export const subscribePush = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw createError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const { subscription } = req.body;

  await query(
    `UPDATE users SET push_subscription = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(subscription), req.user.userId]
  );

  res.json({
    success: true,
  });
};

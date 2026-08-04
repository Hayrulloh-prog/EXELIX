import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { createError } from '../utils/errors';

export interface QRCode {
  id: string;
  token: string;
  isUsed: boolean;
  usedById: string | null;
  usedAt: Date | null;
  createdAt: Date;
}

export const generateQRToken = (): string => {
  return uuidv4().replace(/-/g, '') + Date.now().toString(36);
};

export const createQRCode = async (): Promise<string> => {
  const token = generateQRToken();
  const id = uuidv4();

  await query(
    `INSERT INTO qr_codes (id, token, is_used, generated_at)
     VALUES ($1, $2, $3, NOW())`,
    [id, token, false]
  );

  return token;
};

export const generateQRCodes = async (count: number): Promise<string[]> => {
  const tokens: string[] = [];
  const values: any[] = [];

  for (let i = 0; i < count; i++) {
    const id = uuidv4();
    const token = generateQRToken();
    tokens.push(token);
    values.push(id, token, false);
  }

  // Batch insert
  const placeholders: string[] = [];
  for (let i = 0; i < count; i++) {
    const base = i * 3;
    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, NOW())`);
  }

  await query(
    `INSERT INTO qr_codes (id, token, is_used, created_at)
     VALUES ${placeholders.join(', ')}`,
    values
  );

  return tokens;
};

export const validateQRToken = async (
  token: string
): Promise<{ valid: boolean; used: boolean; userId?: string }> => {
  const result = await query(
    `SELECT id, is_used, used_by_user_id FROM qr_codes WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { valid: false, used: false };
  }

  const qr = result.rows[0];

  return {
    valid: true,
    used: qr.is_used,
    userId: qr.used_by_user_id || undefined,
  };
};

export const markQRAsUsed = async (
  token: string,
  userId: string
): Promise<void> => {
  await query(
    `UPDATE qr_codes
     SET is_used = TRUE, used_by_user_id = $1, used_at = NOW()
     WHERE token = $2 AND is_used = FALSE`,
    [userId, token]
  );
};

export const getUserByQRToken = async (qrToken: string, language: string = 'ru'): Promise<any> => {
  // Normalize token - remove leading slash if present
  const normalizedToken = qrToken.startsWith('/') ? qrToken.slice(1) : qrToken;

  const result = await query(
    `SELECT id, first_name, last_name, phone, status, language, avatar_url, telegram_username FROM users WHERE qr_token = $1`,
    [normalizedToken]
  );

  if (result.rows.length === 0) {
    const messages: Record<string, string> = {
      ru: 'Пользователь не найден для этого QR-кода',
      ky: 'Бул QR-код үчүн колдонуучу табылган жок',
      en: 'User not found for this QR code'
    };

    throw createError(
      404,
      'USER_NOT_FOUND',
      messages[language] || messages.ru
    );
  }

  return result.rows[0];
};

export const getInactiveQRCodesCount = async (): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) as count FROM qr_codes WHERE is_used = FALSE`
  );
  return parseInt(result.rows[0].count);
};

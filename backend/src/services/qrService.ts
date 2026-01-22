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
    `INSERT INTO qr_codes (id, token, is_used, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [id, token, false]
  );

  return token;
};

export const generateQRCodes = async (count: number): Promise<string[]> => {
  const tokens: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

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
    `SELECT id, is_used, used_by_id FROM qr_codes WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { valid: false, used: false };
  }

  const qr = result.rows[0];
  return {
    valid: true,
    used: qr.is_used,
    userId: qr.used_by_id || undefined,
  };
};

export const markQRAsUsed = async (
  token: string,
  userId: string
): Promise<void> => {
  await query(
    `UPDATE qr_codes
     SET is_used = TRUE, used_by_id = $1, used_at = NOW()
     WHERE token = $2 AND is_used = FALSE`,
    [userId, token]
  );
};

export const getUserByQRToken = async (token: string) => {
  const result = await query(
    `SELECT u.* FROM users u
     INNER JOIN qr_codes qr ON u.qr_token = qr.token
     WHERE qr.token = $1 AND qr.is_used = TRUE`,
    [token]
  );

  if (result.rows.length === 0) {
    throw createError(404, 'NOT_FOUND', 'User not found for this QR code');
  }

  return result.rows[0];
};

export const getInactiveQRCodesCount = async (): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) as count FROM qr_codes WHERE is_used = FALSE`
  );
  return parseInt(result.rows[0].count);
};

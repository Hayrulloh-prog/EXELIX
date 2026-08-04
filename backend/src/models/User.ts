import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface User {
  id: string;
  qr_token: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_country: string;
  telegram_username?: string;
  avatar_url?: string;
  status: 'open' | 'closed';
  language: 'ru' | 'ky' | 'en';
  email_notifications: boolean;
  push_notifications: boolean;
  telegram_notifications: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  used?: boolean;
}

export interface CreateUserData {
  qr_token: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_country: string;
  telegram_username?: string;
  avatar_url?: string;
  status: 'open' | 'closed';
  language: 'ru' | 'ky' | 'en';
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_country?: string;
  telegram_username?: string;
  avatar_url?: string;
  status?: 'open' | 'closed';
  language?: 'ru' | 'ky' | 'en';
  email_notifications?: boolean;
  push_notifications?: boolean;
  telegram_notifications?: boolean;
}

export class UserModel {
  // Find user by QR token
  static async findByQRToken(token: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE qr_token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  // Find user by phone
  static async findByPhone(phone: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0] || null;
  }

  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    const {
      qr_token,
      first_name,
      last_name,
      phone,
      phone_country,
      telegram_username,
      avatar_url,
      status,
      language
    } = userData;

    const result = await query(`
      INSERT INTO users (
        qr_token, first_name, last_name, phone, phone_country,
        telegram_username, avatar_url, status, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      qr_token, first_name, last_name, phone, phone_country,
      telegram_username, avatar_url, status, language
    ]);

    return result.rows[0];
  }

  // Update user
  static async update(id: string, userData: UpdateUserData): Promise<User> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(userData)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await query(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [id]
    );
  }

  // Get users with pagination
  static async getMany(limit: number = 40, offset: number = 0): Promise<User[]> {
    const result = await query(`
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows;
  }

  // Count total users
  static async count(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }

  // Mark QR code as used
  static async markQRAsUsed(token: string, userId: string): Promise<void> {
    await query(`
      UPDATE qr_codes
      SET is_used = true, used_by_user_id = $1, used_at = NOW()
      WHERE token = $2
    `, [userId, token]);
  }

  // Check if QR token is valid and unused
  static async validateQRToken(token: string): Promise<boolean> {
    const result = await query(`
      SELECT 1 FROM qr_codes
      WHERE token = $1 AND is_used = false
      LIMIT 1
    `, [token]);

    return result.rows.length > 0;
  }

  // Generate unique QR token
  static generateQRToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Hash phone for privacy (optional)
  static hashPhone(phone: string): string {
    return bcrypt.hashSync(phone, 10);
  }
}

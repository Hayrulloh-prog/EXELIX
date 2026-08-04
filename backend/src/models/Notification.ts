import { query } from '../config/database';

export interface Notification {
  id: string;
  user_id: string;
  sender_ip?: string;
  sender_phone?: string;
  notification_types: string[];
  message: string;
  sent_via_push: boolean;
  sent_via_telegram: boolean;
  created_at: Date;
  read_at?: Date;
}

export interface CreateNotificationData {
  user_id: string;
  sender_ip?: string;
  sender_phone?: string;
  notification_types: string[];
  message: string;
}

export class NotificationModel {
  // Create notification
  static async create(data: CreateNotificationData): Promise<Notification> {
    const {
      user_id,
      sender_ip,
      sender_phone,
      notification_types,
      message
    } = data;

    const result = await query(`
      INSERT INTO notifications (
        user_id, sender_ip, sender_phone, notification_types, message
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, sender_ip, sender_phone, notification_types, message]);

    return result.rows[0];
  }

  // Get user notifications
  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const result = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows;
  }

  // Mark as read
  static async markAsRead(id: string): Promise<void> {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1',
      [id]
    );
  }

  // Mark all user notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    await query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
  }

  // Count unread notifications
  static async countUnread(userId: string): Promise<number> {
    const result = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND read_at IS NULL
    `, [userId]);

    return parseInt(result.rows[0].count);
  }

  // Update notification delivery status
  static async updateDeliveryStatus(
    id: string,
    sentViaPush: boolean,
    sentViaTelegram: boolean
  ): Promise<void> {
    await query(`
      UPDATE notifications 
      SET sent_via_push = $1, sent_via_telegram = $2
      WHERE id = $3
    `, [sentViaPush, sentViaTelegram, id]);
  }

  // Get notification statistics
  static async getStats(): Promise<{
    total: number;
    sent_today: number;
    sent_via_push: number;
    sent_via_telegram: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as sent_today,
        COUNT(*) FILTER (WHERE sent_via_push = true) as sent_via_push,
        COUNT(*) FILTER (WHERE sent_via_telegram = true) as sent_via_telegram
      FROM notifications
    `);

    return {
      total: parseInt(result.rows[0].total),
      sent_today: parseInt(result.rows[0].sent_today),
      sent_via_push: parseInt(result.rows[0].sent_via_push),
      sent_via_telegram: parseInt(result.rows[0].sent_via_telegram)
    };
  }
}

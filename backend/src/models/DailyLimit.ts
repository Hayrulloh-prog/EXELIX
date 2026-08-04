import { query } from '../config/database';

export interface DailyLimit {
  id: string;
  user_id: string;
  date: Date;
  notifications_sent: number;
  notifications_received: number;
  created_at: Date;
  updated_at: Date;
}

export class DailyLimitModel {
  // Get or create daily limit record
  static async getOrCreate(userId: string, date: Date = new Date()): Promise<DailyLimit> {
    const dateOnly = date.toISOString().split('T')[0];

    // Try to get existing record
    const result = await query(
      'SELECT * FROM daily_limits WHERE user_id = $1 AND date = $2',
      [userId, dateOnly]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new record
    const newResult = await query(`
      INSERT INTO daily_limits (user_id, date, notifications_sent, notifications_received)
      VALUES ($1, $2, 0, 0)
      RETURNING *
    `, [userId, dateOnly]);

    return newResult.rows[0];
  }

  // Increment sent notifications
  static async incrementSent(userId: string): Promise<DailyLimit> {
    const dateOnly = new Date().toISOString().split('T')[0];

    const result = await query(`
      INSERT INTO daily_limits (user_id, date, notifications_sent, notifications_received)
      VALUES ($1, $2, 1, 0)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        notifications_sent = daily_limits.notifications_sent + 1,
        updated_at = NOW()
      RETURNING *
    `, [userId, dateOnly]);

    return result.rows[0];
  }

  // Increment received notifications
  static async incrementReceived(userId: string): Promise<DailyLimit> {
    const dateOnly = new Date().toISOString().split('T')[0];

    const result = await query(`
      INSERT INTO daily_limits (user_id, date, notifications_sent, notifications_received)
      VALUES ($1, $2, 0, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        notifications_received = daily_limits.notifications_received + 1,
        updated_at = NOW()
      RETURNING *
    `, [userId, dateOnly]);

    return result.rows[0];
  }

  // Check if user can send notifications (limit: 3 per day)
  static async canSendNotifications(userId: string): Promise<boolean> {
    const limit = await this.getOrCreate(userId);
    return limit.notifications_sent < 3;
  }

  // Check if user can receive notifications (limit: 12 per day)
  static async canReceiveNotifications(userId: string): Promise<boolean> {
    const limit = await this.getOrCreate(userId);
    return limit.notifications_received < 12;
  }

  // Get remaining limits
  static async getRemainingLimits(userId: string): Promise<{
    canSend: boolean;
    canReceive: boolean;
    sentRemaining: number;
    receivedRemaining: number;
  }> {
    const limit = await this.getOrCreate(userId);

    return {
      canSend: limit.notifications_sent < 3,
      canReceive: limit.notifications_received < 12,
      sentRemaining: Math.max(0, 3 - limit.notifications_sent),
      receivedRemaining: Math.max(0, 12 - limit.notifications_received)
    };
  }

  // Get user's daily statistics
  static async getUserStats(userId: string, days: number = 7): Promise<{
    totalSent: number;
    totalReceived: number;
    dailyStats: Array<{
      date: string;
      sent: number;
      received: number;
    }>;
  }> {
    const result = await query(`
      SELECT
        date,
        notifications_sent as sent,
        notifications_received as received,
        SUM(notifications_sent) OVER (ORDER BY date) as total_sent,
        SUM(notifications_received) OVER (ORDER BY date) as total_received
      FROM daily_limits
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `, [userId]);

    const dailyStats = result.rows.map(row => ({
      date: row.date,
      sent: row.sent,
      received: row.received
    }));

    const totalSent = result.rows[0]?.total_sent || 0;
    const totalReceived = result.rows[0]?.total_received || 0;

    return {
      totalSent,
      totalReceived,
      dailyStats
    };
  }
}

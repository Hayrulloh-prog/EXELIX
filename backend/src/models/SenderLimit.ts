import { query } from '../config/database';

export interface SenderLimit {
  id: string;
  sender_ip: string;
  date: Date;
  sent_count: number;
  created_at: Date;
  updated_at: Date;
}

export class SenderLimitModel {
  // Get or create sender limit record by IP
  static async getOrCreate(senderIp: string, date: Date = new Date()): Promise<SenderLimit> {
    const dateOnly = date.toISOString().split('T')[0];
    
    // Try to get existing record
    const result = await query(
      'SELECT * FROM daily_limits WHERE sender_ip = $1 AND date = $2',
      [senderIp, dateOnly]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new record
    const newResult = await query(`
      INSERT INTO daily_limits (sender_ip, date, sent_count)
      VALUES ($1, $2, 0)
      RETURNING *
    `, [senderIp, dateOnly]);

    return newResult.rows[0];
  }

  // Increment sent notifications by IP
  static async incrementSent(senderIp: string): Promise<SenderLimit> {
    const dateOnly = new Date().toISOString().split('T')[0];
    
    const result = await query(`
      INSERT INTO daily_limits (sender_ip, date, sent_count)
      VALUES ($1, $2, 1)
      ON CONFLICT (sender_ip, date)
      DO UPDATE SET 
        sent_count = daily_limits.sent_count + 1,
        updated_at = NOW()
      RETURNING *
    `, [senderIp, dateOnly]);

    return result.rows[0];
  }

  // Check if sender can send notifications (limit: 3 per day)
  static async canSendNotifications(senderIp: string): Promise<boolean> {
    const limit = await this.getOrCreate(senderIp);
    return limit.sent_count < 3;
  }

  // Get remaining sender limit
  static async getRemainingLimit(senderIp: string): Promise<{
    canSend: boolean;
    sentRemaining: number;
  }> {
    const limit = await this.getOrCreate(senderIp);
    
    return {
      canSend: limit.sent_count < 3,
      sentRemaining: Math.max(0, 3 - limit.sent_count)
    };
  }

  // Get sender's daily statistics
  static async getSenderStats(senderIp: string, days: number = 7): Promise<{
    totalSent: number;
    dailyStats: Array<{
      date: string;
      sent: number;
    }>;
  }> {
    const result = await query(`
      SELECT 
        date,
        sent_count as sent,
        SUM(sent_count) OVER (ORDER BY date) as total_sent
      FROM daily_limits 
      WHERE sender_ip = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `, [senderIp]);

    const dailyStats = result.rows.map(row => ({
      date: row.date,
      sent: row.sent
    }));

    const totalSent = result.rows[0]?.total_sent || 0;

    return {
      totalSent,
      dailyStats
    };
  }
}

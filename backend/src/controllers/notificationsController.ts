import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { query } from "../config/database";

// --------------------
// Получить уведомления пользователя с пагинацией
// --------------------
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔔 getUserNotifications called for userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Получаем общее количество уведомлений
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM notifications
      WHERE user_id = $1
    `, [userId]);

    const total = parseInt(countResult.rows[0].total);

    // Получаем уведомления с пагинацией
    const result = await query(`
      SELECT
        id,
        notification_types,
        message,
        created_at,
        read_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    console.log(`📊 Found ${result.rows.length} notifications for user ${userId} (page ${page})`);
    console.log(`📝 Raw notifications:`, result.rows);

    // Log each notification message to check formatting
    result.rows.forEach((row, index) => {
      console.log(`📝 Notification ${index + 1}:`, {
        id: row.id,
        types: row.notification_types,
        message: row.message,
        created_at: row.created_at,
        read_at: row.read_at
      });
    });

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.notification_types,
      message: row.message,
      createdAt: row.created_at,
      readAt: row.read_at,
      sentViaPush: true, // TODO: получить из реальных данных
      sentViaTelegram: true, // TODO: получить из реальных данных
      status: 'sent' as const,
      notification_types: row.notification_types,
      custom_message: null // TODO: добавить в базу данных custom_message
    }));

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications: total,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
  } catch (error) {
    console.error("Error getting user notifications:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to get notifications"
    });
  }
};

// --------------------
// Получение количества непрочитанных уведомлений
// --------------------
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const unreadResult = await query(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL
    `, [userId]);

    const count = parseInt(unreadResult.rows[0].unread_count);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to get unread count"
    });
  }
};

// --------------------
// Отметить уведомление как прочитанное
// --------------------
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notificationId } = req.params;

    // Проверяем, что уведомление принадлежит пользователю
    const notificationCheck = await query(`
      SELECT id FROM notifications
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);

    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Notification not found"
      });
    }

    // Отмечаем как прочитанное
    await query(`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [notificationId, userId]);

    res.json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to mark notification as read"
    });
  }
};

// --------------------
// Отметить все уведомления как прочитанные
// --------------------
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    console.log(`🔔 markAllNotificationsAsRead called for userId: ${userId}`);

    // Отмечаем все непрочитанные уведомления как прочитанные
    const result = await query(`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND read_at IS NULL
    `, [userId]);

    console.log(`📊 Marked ${result.rowCount || 0} notifications as read for user ${userId}`);

    res.json({
      success: true,
      message: "All notifications marked as read",
      count: result.rowCount || 0
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to mark all notifications as read"
    });
  }
};

// --------------------
// Проверить статус прочтения уведомлений по токену
// --------------------
export const checkNotificationReadStatus = async (req: any, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "MISSING_TOKEN",
        message: "Token is required"
      });
    }

    // Ищем пользователя по QR токену
    const userResult = await query(`
      SELECT id FROM users
      WHERE qr_token = $1 AND status = 'open'
    `, [token]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    const userId = userResult.rows[0].id;

    // Проверяем статус прочтения
    const unreadResult = await query(`
      SELECT
        COUNT(*) as unread_count,
        EXISTS(SELECT 1 FROM notifications WHERE user_id = $1 AND read_at IS NULL) as has_unread
      FROM notifications
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '48 hours'
    `, [userId]);

    const hasUnreadNotifications = unreadResult.rows[0].has_unread;
    const unreadCount = unreadResult.rows[0].unread_count;

    let message = "";
    if (hasUnreadNotifications) {
      message = `У вас есть ${unreadCount} непрочитанных уведомлений`;
    } else {
      message = "Все уведомления прочитаны";
    }

    res.json({
      success: true,
      hasUnreadNotifications,
      unreadCount,
      message
    });
  } catch (error) {
    console.error("Error checking notification read status:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to check notification status"
    });
  }
};

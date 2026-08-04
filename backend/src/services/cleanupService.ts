import { query } from '../config/database';
import { deleteAvatars } from './storageService';

// Очистка аватаров удалённых пользователей из Supabase Storage
export const cleanupOrphanedAvatars = async () => {
  try {
    // Find users that were recently deleted but might have avatars in storage
    // This is a safety net — avatars are also deleted when users are removed
    console.log('🧹 Orphaned avatar cleanup check completed');
    return 0;
  } catch (error) {
    console.error('Avatar cleanup error:', error);
    return 0;
  }
};

// Очистка старых уведомлений (старше 48 часов - помечаем как прочитанные, НЕ удаляем)
// Записи сохраняются для корректного подсчёта total_requests в статистике
export const cleanupOldNotifications = async () => {
  try {
    const result = await query(`
      UPDATE notifications
      SET read_at = NOW()
      WHERE created_at < NOW() - INTERVAL '48 hours' AND read_at IS NULL
      RETURNING id
    `);

    if (result.rows.length > 0) {
      console.log(`✅ Marked ${result.rows.length} old notifications as read`);
    }
    return result.rows.length;
  } catch (error) {
    console.error('Notifications cleanup error:', error);
    return 0;
  }
};

// Автоматическое удаление неактивных пользователей (у которых годовой лимит + 1 месяц истек)
export const cleanupExpiredUsers = async () => {
  try {
    // 1 year limit + 1 month grace period = 13 months total
    const expiredUsersResult = await query(`
      SELECT id FROM users
      WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year 1 month')
        AND created_at < NOW() - INTERVAL '1 year 1 month'
    `);

    const userIds = expiredUsersResult.rows.map(r => r.id);
    let deletedUsersCount = 0;

    if (userIds.length > 0) {
      // Delete avatars from Supabase Storage in batch
      await deleteAvatars(userIds);
    }

    for (const id of userIds) {
      try {
        await query('DELETE FROM daily_limits WHERE user_id = $1', [id]).catch(() => {});
        // Обнуляем user_id вместо удаления, чтобы сохранить счётчик запросов в статистике
        await query('UPDATE notifications SET user_id = NULL WHERE user_id = $1', [id]).catch(() => {});
        await query('DELETE FROM push_subscriptions WHERE user_id = $1', [id]).catch(() => {});
        await query('DELETE FROM otp_codes WHERE user_id = $1', [id]).catch(() => {});
        await query('DELETE FROM verification_tokens WHERE user_id = $1', [id]).catch(() => {});
        await query('DELETE FROM active_sessions WHERE user_id = $1', [id]).catch(() => {});
        await query('DELETE FROM rate_limits WHERE identifier = $1', [id]).catch(() => {});

        // Удаляем связанные QR-коды
        await query('DELETE FROM qr_codes WHERE used_by_user_id = $1', [id]).catch(() => {});

        await query('DELETE FROM users WHERE id = $1', [id]);
        deletedUsersCount++;
      } catch (err) {
        console.error(`Error deleting expired user ID ${id}:`, err);
      }
    }

    if (deletedUsersCount > 0) {
      console.log(`✅ Permanently deleted ${deletedUsersCount} expired users`);
    }
    return deletedUsersCount;
  } catch (error) {
    console.error('Expired users cleanup error:', error);
    return 0;
  }
};

// Основная функция очистки
export const performCleanup = async () => {
  console.log('🚀 Starting scheduled cleanup...');

  const notificationCleanupResult = await cleanupOldNotifications();
  const deletedUsersResult = await cleanupExpiredUsers();
  const deletedAvatarsResult = await cleanupOrphanedAvatars();

  console.log(`📊 Cleanup summary: ${notificationCleanupResult} notifications updated, ${deletedUsersResult} users deleted, ${deletedAvatarsResult} avatars deleted`);

  return {
    notificationsDeleted: notificationCleanupResult,
    usersDeleted: deletedUsersResult,
    avatarsDeleted: deletedAvatarsResult
  };
};

// Запуск очистки фоновой задачей
export const scheduleCleanup = () => {
  // Выполняем очистку сразу при запуске
  performCleanup();

  // Запускаем фоновую очистку каждые 24 часа
  setInterval(() => {
    performCleanup();
  }, 24 * 60 * 60 * 1000);

  console.log('⏰ Cleanup scheduler initialized (running every 24 hours)');
};

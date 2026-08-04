import { query } from '../config/database';
import { setInterval } from 'timers';

// --------------------
// Обновление статистики (запускается по интервалу)
// --------------------
async function updateDailyStatistics() {
  try {
    console.log('🔄 Updating daily statistics...');

    // Всего пользователей
    const usersResult = await query(`SELECT COUNT(*) as count FROM users`);
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Всего запросов (уведомлений)
    const requestsResult = await query(`SELECT COUNT(*) as count FROM notifications`);
    const totalRequests = parseInt(requestsResult.rows[0].count);

    // Успешные запросы - считаем все уведомления (пока нет полей доставки)
    const successfulResult = await query(`
      SELECT COUNT(*) as count FROM notifications
    `);
    const successfulRequests = parseInt(successfulResult.rows[0].count);

    // Неуспешные запросы - пока 0, так как нет отслеживания ошибок
    const failedRequests = 0;

    // Неактивные QR коды (неиспользованные)
    const inactiveQRResult = await query(`
      SELECT COUNT(*) as count FROM qr_codes WHERE is_used = false
    `);
    const inactiveQRCodes = parseInt(inactiveQRResult.rows[0].count);

    const today = new Date().toISOString().split('T')[0];

    // Сохраняем или обновляем статистику за сегодня
    await query(`
      INSERT INTO statistics (date, total_users, successful_requests, failed_requests, total_requests, inactive_qr_codes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        successful_requests = EXCLUDED.successful_requests,
        failed_requests = EXCLUDED.failed_requests,
        total_requests = EXCLUDED.total_requests,
        inactive_qr_codes = EXCLUDED.inactive_qr_codes,
        updated_at = NOW()
    `, [
      today,
      totalUsers,
      successfulRequests,
      failedRequests,
      totalRequests,
      inactiveQRCodes
    ]);

    console.log('✅ Statistics updated successfully:', {
      date: today,
      totalUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      inactiveQRCodes
    });

  } catch (error) {
    console.error('❌ Error updating statistics:', error);
  }
}

// --------------------
// Запуск интервала для обновления статистики
// --------------------
export function startStatisticsCron() {
  // Обновление статистики каждые 6 часов (21600000 мс)
  const updateInterval = 6 * 60 * 60 * 1000; // 6 часов в миллисекундах

  setInterval(async () => {
    console.log('🕐 Running 6-hour statistics update...');
    await updateDailyStatistics();
  }, updateInterval);

  // Также запускаем обновление при старте
  setTimeout(async () => {
    console.log('🕐 Running initial statistics update...');
    await updateDailyStatistics();
  }, 5000); // Через 5 секунд после старта

  console.log('📅 Statistics interval jobs started:');
  console.log('  - Initial update in 5 seconds');
  console.log('  - 6-hour updates every 6 hours');
}

// --------------------
// Ручное обновление статистики
// --------------------
export { updateDailyStatistics };

// Если скрипт запускается напрямую
if (require.main === module) {
  updateDailyStatistics()
    .then(() => {
      console.log('✅ Manual statistics update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manual statistics update failed:', error);
      process.exit(1);
    });
}

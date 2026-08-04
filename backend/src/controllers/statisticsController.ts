import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { query } from "../config/database";

// --------------------
// Получить актуальную статистику
// --------------------
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const country = req.query.country as string;
    const countryFilter = country && country !== 'all' ? country.toString().toUpperCase() : null;

    console.log(`🔍 Statistics getStats called with country: ${country || 'all'}`);

    // Всегда генерируем актуальную статистику в реальном времени
    const stats = await generateRealTimeStats(countryFilter);

    // Обновляем статистику за сегодня в базе данных
    const today = new Date().toISOString().split('T')[0];
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
      stats.totalUsers,
      stats.successfulRequests,
      stats.failedRequests,
      stats.totalRequests,
      stats.inactiveQRCodes
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: stats.totalUsers,
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        inactiveQRCodes: stats.inactiveQRCodes,
        inactiveUsers: stats.inactiveUsers,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Statistics error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to get statistics",
    });
  }
};

// --------------------
// Генерация статистики в реальном времени
// --------------------
async function generateRealTimeStats(countryFilter: string | null = null) {
  console.log(`🔍 generateRealTimeStats with countryFilter: ${countryFilter || 'all'}`);

  // Всего пользователей с учетом фильтра
  let usersQuery = `SELECT COUNT(*) as count FROM users`;
  let usersParams: any[] = [];

  if (countryFilter) {
    usersQuery += ` WHERE phone_country = $1`;
    usersParams = [countryFilter];
  }

  const usersResult = await query(usersQuery, usersParams);
  const totalUsers = parseInt(usersResult.rows[0].count);
  console.log(`📊 Users count: ${totalUsers} (country: ${countryFilter || 'all'})`);

  // Всего запросов (уведомлений) с учетом фильтра
  let requestsQuery = `SELECT COUNT(*) as count FROM notifications n`;
  let requestsParams: any[] = [];

  if (countryFilter) {
    requestsQuery += ` JOIN users u ON n.user_id = u.id WHERE u.phone_country = $1`;
    requestsParams = [countryFilter];
  }

  const requestsResult = await query(requestsQuery, requestsParams);
  const totalRequests = parseInt(requestsResult.rows[0].count);
  console.log(`📊 Total requests: ${totalRequests} (country: ${countryFilter || 'all'})`);

  // Успешные запросы (созданные уведомления)
  let successfulQuery = `SELECT COUNT(*) as count FROM notifications n`;
  let successfulParams: any[] = [];

  if (countryFilter) {
    successfulQuery += ` JOIN users u ON n.user_id = u.id WHERE u.phone_country = $1`;
    successfulParams = [countryFilter];
  }

  const successfulResult = await query(successfulQuery, successfulParams);
  const successfulRequests = parseInt(successfulResult.rows[0].count);
  console.log(`📊 Successful requests: ${successfulRequests} (country: ${countryFilter || 'all'})`);

  // Неуспешные запросы (нет уведомлений)
  const failedRequests = 0; // Все запросы создают уведомления, значит они успешные
  console.log(`📊 Failed requests: ${failedRequests} (country: ${countryFilter || 'all'})`);

  // Неактивные QR коды (неиспользованные)
  const inactiveQRResult = await query(`
    SELECT COUNT(*) as count FROM qr_codes WHERE is_used = false
  `);
  const inactiveQRCodes = parseInt(inactiveQRResult.rows[0].count);

  // Неактивные пользователи
  // 1 year interval
  let inactiveUsersQuery = `SELECT COUNT(*) as count FROM users WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year')`;
  let inactiveUsersParams: any[] = [];

  if (countryFilter) {
    inactiveUsersQuery = `SELECT COUNT(*) as count FROM users WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year') AND phone_country = $1`;
    inactiveUsersParams = [countryFilter];
  }

  const inactiveUsersResult = await query(inactiveUsersQuery, inactiveUsersParams);
  const inactiveUsers = parseInt(inactiveUsersResult.rows[0].count);

  return {
    totalUsers,
    totalRequests,
    successfulRequests,
    failedRequests,
    inactiveQRCodes,
    inactiveUsers
  };
}

// --------------------
// Обновление статистики (для cron job)
// --------------------
export const updateStats = async (req: AuthRequest, res: Response) => {
  try {
    const country = req.query.country as string;
    const countryFilter = country && country !== 'all' ? country.toString().toUpperCase() : null;

    const stats = await generateRealTimeStats(countryFilter);
    const today = new Date().toISOString().split('T')[0];

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
      stats.totalUsers,
      stats.successfulRequests,
      stats.failedRequests,
      stats.totalRequests,
      stats.inactiveQRCodes
    ]);

    res.json({
      success: true,
      message: "Statistics updated successfully",
      stats
    });
  } catch (error) {
    console.error("Update statistics error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to update statistics",
    });
  }
};

// --------------------
// Получить статистику за период
// --------------------
export const getStatsHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const limitDays = Math.min(parseInt(days as string), 365); // Максимум год

    const result = await query(`
      SELECT * FROM statistics
      WHERE date >= CURRENT_DATE - INTERVAL '${limitDays} days'
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      stats: result.rows.map(row => ({
        date: row.date,
        totalUsers: parseInt(row.total_users),
        totalRequests: parseInt(row.total_requests),
        successfulRequests: parseInt(row.successful_requests),
        failedRequests: parseInt(row.failed_requests),
        inactiveQRCodes: parseInt(row.inactive_qr_codes),
        lastUpdated: row.updated_at
      }))
    });
  } catch (error) {
    console.error("Statistics history error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to get statistics history",
    });
  }
};

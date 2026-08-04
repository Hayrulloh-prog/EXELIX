import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { query } from "../config/database";
import {
  generateQRCodes,
  getInactiveQRCodesCount,
} from "../services/qrService";
import { generateAdminToken } from "../utils/jwt";

import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

// --------------------
// Публичный метод: вход в админку
// --------------------
export const loginAdmin = async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Username and password required",
    });
  }

  // Проверяем через базу данных или через .env
  let admin = null;

  // Сначала пробуем найти в базе данных
  try {
    const result = await query(`SELECT * FROM admins WHERE username = $1`, [
      username,
    ]);
    if (result.rows.length > 0) {
      admin = result.rows[0];
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (isValid) {
        // Update last login
        await query(`UPDATE admins SET last_login = NOW() WHERE id = $1`, [
          admin.id,
        ]);
        const token = generateAdminToken({ userId: admin.id, type: "admin" });
        return res.json({
          success: true,
          token,
          admin: {
            id: admin.id,
            username: admin.username,
          },
        });
      }
    }
  } catch (error) {
    console.error("Database admin check error:", error);
  }

  // Если не нашли в БД, проверяем через .env
  const isProd = process.env.NODE_ENV === "production";
  const envLogin =
    process.env.ADMIN_LOGIN ||
    process.env.ADMIN_USERNAME ||
    (isProd ? null : "hayrulloh1706@gmail.com");
  const envPassword =
    process.env.ADMIN_PASSWORD ||
    (isProd ? null : "20050617in");

  if (envLogin && envPassword && username === envLogin && password === envPassword) {
    // Создаем временный admin ID для JWT
    const adminId = "env-admin-" + Date.now();
    const token = generateAdminToken({ userId: adminId, type: "admin" });
    return res.json({
      success: true,
      token,
      admin: {
        id: adminId,
        username: username,
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: "UNAUTHORIZED",
    message: "Invalid credentials",
  });
};

// --------------------
// Получить статистику
// --------------------
export const getStats = async (req: AuthRequest, res: Response) => {

  const country = req.query.country as string;
  const countryFilter = country && country !== 'all' ? country.toString().toUpperCase() : null;

  try {
    // Считаем пользователей с учетом фильтра по стране
    let usersQuery = `SELECT COUNT(*) as count FROM users`;
    let usersParams: any[] = [];

    if (countryFilter) {
      usersQuery += ` WHERE phone_country = $1`;
      usersParams = [countryFilter];
    }

    const usersResult = await query(usersQuery, usersParams);
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Считаем общее количество запросов с учетом фильтра
    let requestsQuery = `SELECT COUNT(*) as count FROM notifications n`;
    let requestsParams: any[] = [];

    if (countryFilter) {
      requestsQuery += ` JOIN users u ON n.user_id = u.id WHERE u.phone_country = $1`;
      requestsParams = [countryFilter];
    }


    const requestsResult = await query(requestsQuery, requestsParams);
    const totalRequests = parseInt(requestsResult.rows[0].count);

    // Считаем успешные запросы с учетом фильтра
    let successfulQuery = `SELECT COUNT(*) as count FROM notifications n`;
    let successfulParams: any[] = [];

    if (countryFilter) {
      successfulQuery += ` JOIN users u ON n.user_id = u.id WHERE u.phone_country = $1 AND (n.sent_via_push = TRUE OR n.sent_via_telegram = TRUE)`;
      successfulParams = [countryFilter];
    } else {
      successfulQuery += ` WHERE sent_via_push = TRUE OR sent_via_telegram = TRUE`;
    }


    const successfulResult = await query(successfulQuery, successfulParams);
    const successfulRequests = parseInt(successfulResult.rows[0].count);

    // Отладка: проверим есть ли вообще данные в notifications
    const debugNotifications = await query(`
      SELECT COUNT(*) as total_notifications,
             COUNT(CASE WHEN sent_via_push = TRUE OR sent_via_telegram = TRUE THEN 1 END) as successful_notifications
      FROM notifications
    `);

    // Отладка: проверим связь с пользователями
    const debugJoin = await query(`
      SELECT COUNT(*) as notifications_with_users,
             COUNT(CASE WHEN u.phone_country IS NOT NULL THEN 1 END) as with_country
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
    `);

    // Неуспешные = общие - успешные
    const failedRequests = totalRequests - successfulRequests;

    // Считаем неактивные QR коды
    const inactiveQRCodes = await getInactiveQRCodesCount();

    // Считаем неактивных пользователей (у которых годовой лимит истек)
    let inactiveUsersQuery = `SELECT COUNT(*) as count FROM users WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year')`;
    let inactiveUsersParams: any[] = [];

    if (countryFilter) {
      inactiveUsersQuery = `SELECT COUNT(*) as count FROM users WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year') AND phone_country = $1`;
      inactiveUsersParams = [countryFilter];
    }

    const inactiveUsersResult = await query(inactiveUsersQuery, inactiveUsersParams);
    const inactiveUsers = parseInt(inactiveUsersResult.rows[0].count);

    const stats = {
      totalUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      inactiveQRCodes,
      inactiveUsers,
      lastUpdated: new Date().toISOString(),
    };


    res.json({
      success: true,
      stats: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'STATS_ERROR',
      message: error.message || 'Failed to get statistics'
    });
  }
};

// --------------------
// Получить список пользователей
// --------------------
export const getUsers = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const country = req.query.country as string;
  const countryFilter = country && country !== 'all' ? country.toString().toUpperCase() : null;
  const isActiveQuery = req.query.is_active as string;
  const search = req.query.search as string;

  let whereClauses: string[] = [];
  let usersParams: any[] = [];

  if (countryFilter) {
    usersParams.push(countryFilter);
    whereClauses.push(`phone_country = $${usersParams.length}`);
  }

  if (isActiveQuery === 'false') {
    whereClauses.push(`(is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year')`);
  } else if (isActiveQuery === 'true') {
    whereClauses.push(`(is_active = TRUE AND created_at >= NOW() - INTERVAL '1 year')`);
  }

  if (search) {
    usersParams.push(`%${search}%`);
    whereClauses.push(`(first_name ILIKE $${usersParams.length} OR last_name ILIKE $${usersParams.length} OR phone ILIKE $${usersParams.length} OR telegram_username ILIKE $${usersParams.length})`);
  }

  let whereString = whereClauses.length > 0 ? ` WHERE ` + whereClauses.join(' AND ') : '';

  let usersQuery = `
    SELECT
      id, first_name, last_name, phone, phone_country,
      telegram_username, avatar_url, status, created_at, is_active
     FROM users
     ${whereString}
     ORDER BY created_at DESC LIMIT $${usersParams.length + 1} OFFSET $${usersParams.length + 2}
  `;

  const queryParams = [...usersParams, limit, offset];

  const result = await query(usersQuery, queryParams);

  // Count total users with filters
  let countQuery = `SELECT COUNT(*) as count FROM users ${whereString}`;
  const countResult = await query(countQuery, usersParams);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    users: result.rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      phoneCountry: row.phone_country,
      telegram: row.telegram_username,
      avatarUrl: row.avatar_url || null,
      status: row.status,
      isActive: row.is_active,
      createdAt: row.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

// --------------------
// Переключить статус активности пользователя
// --------------------
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Получаем текущий статус и дату создания
    const userResult = await query('SELECT is_active, created_at FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // 1 year expiration (365 * 24 * 60 * 60 * 1000)
    const EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000;
    const isExpired = (Date.now() - new Date(user.created_at).getTime()) > EXPIRATION_MS;

    const isCurrentlyActive = user.is_active && !isExpired;
    const newStatus = !isCurrentlyActive;

    let newCreatedAt = null;

    // Обновляем статус и сбрасываем дату создания, если активируем
    if (newStatus) {
      const updateResult = await query('UPDATE users SET is_active = true, created_at = NOW() WHERE id = $1 RETURNING created_at', [id]);
      newCreatedAt = updateResult.rows[0].created_at;
    } else {
      await query('UPDATE users SET is_active = false WHERE id = $1', [id]);
    }

    res.json({
      success: true,
      isActive: newStatus,
      createdAt: newCreatedAt,
      message: newStatus ? 'Пользователь активирован' : 'Пользователь деактивирован'
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

// --------------------
// Удалить пользователя
// --------------------
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Проверяем существование пользователя
    const userResult = await query('SELECT id FROM users WHERE id = $1', [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Удаляем все связанные записи из всех таблиц
    // Каждое удаление обёрнуто в try-catch, чтобы таблица, которая не существует, не ломала процесс

    // daily_limits
    try {
      await query('DELETE FROM daily_limits WHERE user_id = $1', [id]);
    } catch (e) {
      console.log('Note: daily_limits cleanup skipped (table may not exist)');
    }

    // notifications — обнуляем user_id вместо удаления, чтобы сохранить счётчик запросов в статистике
    try {
      await query('UPDATE notifications SET user_id = NULL WHERE user_id = $1', [id]);
    } catch (e) {
      // Если UPDATE не сработал (например, NOT NULL constraint), удаляем как раньше
      try {
        await query('DELETE FROM notifications WHERE user_id = $1', [id]);
      } catch (e2) {
        console.log('Note: notifications cleanup skipped (table may not exist)');
      }
    }

    // push_subscriptions
    try {
      await query('DELETE FROM push_subscriptions WHERE user_id = $1', [id]);
    } catch (e) {
      console.log('Note: push_subscriptions cleanup skipped (table may not exist)');
    }

    // otp_codes
    try {
      await query('DELETE FROM otp_codes WHERE user_id = $1', [id]);
    } catch (e) {
      console.log('Note: otp_codes cleanup skipped (table may not exist)');
    }

    // verification_tokens
    try {
      await query('DELETE FROM verification_tokens WHERE user_id = $1', [id]);
    } catch (e) {
      console.log('Note: verification_tokens cleanup skipped (table may not exist)');
    }

    // active_sessions
    try {
      await query('DELETE FROM active_sessions WHERE user_id = $1', [id]);
    } catch (e) {
      console.log('Note: active_sessions cleanup skipped (table may not exist)');
    }

    // qr_codes — поддерживаем оба варианта схемы (used_by_user_id и user_id)
    try {
      await query('DELETE FROM qr_codes WHERE used_by_user_id = $1', [id]);
    } catch (e) {
      try {
        await query('DELETE FROM qr_codes WHERE user_id = $1', [id]);
      } catch (e2) {
        console.log('Note: qr_codes cleanup skipped');
      }
    }

    // rate_limits (если существует, по идентификатору пользователя)
    try {
      await query('DELETE FROM rate_limits WHERE identifier = $1', [id]);
    } catch (e) {
      console.log('Note: rate_limits cleanup skipped (table may not exist)');
    }

    // 3. Удаляем самого пользователя
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error?.message || error);
    console.error('Error detail:', error?.detail || 'no detail');
    console.error('Error table:', error?.table || 'unknown');
    console.error('Error constraint:', error?.constraint || 'unknown');
    res.status(500).json({ success: false, message: 'Failed to delete user: ' + (error?.detail || error?.message || 'Unknown error') });
  }
};

// --------------------
// Генерация QR-кодов
// --------------------
export const generateQR = async (req: AuthRequest, res: Response) => {
  let count = parseInt(req.body.count);
  if (isNaN(count) || count <= 0) count = 1;

  const tokens = await generateQRCodes(count);

  const qrCodes = await Promise.all(
    tokens.map(async (token) => {
      const url = `${process.env.FRONTEND_URL || "http://localhost:3001"}/qr?token=${token}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        width: 300,
        margin: 2,
      });
      return { token, svg };
    }),
  );

  const columns = Math.min(10, count);
  const rows = Math.ceil(count / 10);

  const svgContent = qrCodes
    .map((qr, index) => {
      const x = (index % 10) * 320;
      const y = Math.floor(index / 10) * 320;
      return `<g transform="translate(${x}, ${y})">${qr.svg}</g>`;
    })
    .join("\n");

  const combinedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 320}" height="${rows * 320}">
${svgContent}
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="qr-codes-${Date.now()}.svg"`,
  );
  res.send(combinedSVG);
};

export const generateBatchQR = async (req: AuthRequest, res: Response) => {
  try {
    const { count = 100 } = req.body || {};

    // Generate unique tokens for batch QR codes
    const qrCodes = [];
    const tokensToInsert = [];

    for (let i = 0; i < count; i++) {
      const token = randomBytes(32).toString("hex");
      tokensToInsert.push(token);

      try {
        // Try different QR generation methods
        let svg = "";
        const qrUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/qr?token=${token}`;

        // Method 1: QRCode.toDataURL
        try {
          const dataURL = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          // Convert data URL to SVG (fallback approach)
          svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="white"/>
            <image href="${dataURL}" x="0" y="0" width="300" height="300"/>
          </svg>`;
        } catch (dataURLError) {
          // Method 2: QRCode.toString with SVG type
          try {
            svg = await QRCode.toString(qrUrl, {
              type: "svg",
              width: 300,
              margin: 1,
            });
          } catch (toStringError) {
            // Method 3: Simple QR generation
            try {
              svg = await QRCode.toString(qrUrl, {
                errorCorrectionLevel: "M",
                type: "svg",
                width: 300,
                margin: 1,
              });
            } catch (createError) {
              throw new Error("All QR generation methods failed");
            }
          }
        }

        qrCodes.push({
          token,
          svg: svg,
        });
      } catch (qrError) {
        console.error("QR generation error for token:", token, qrError);
        // Fallback to simple SVG with token text
        qrCodes.push({
          token,
          svg: `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="white" stroke="black" stroke-width="2"/>
            <text x="150" y="140" text-anchor="middle" font-size="10" font-family="monospace">EXELIX QR</text>
            <text x="150" y="160" text-anchor="middle" font-size="8" font-family="monospace">${token.substring(0, 20)}...</text>
          </svg>`,
        });
      }
    }

    // Insert all tokens into database
    try {
      await query(
        `INSERT INTO qr_codes (token, is_used) VALUES ${tokensToInsert.map((_, i) => `($${i + 1}, false)`).join(", ")}`,
        tokensToInsert,
      );
    } catch (dbError) {
      console.error("❌ Failed to insert QR tokens:", dbError);
      throw new Error("Failed to save QR tokens to database");
    }

    // Create SVG with all QR codes in grid layout
    const columns = 10;
    const rows = Math.ceil(count / columns);

    const svgContent = qrCodes
      .map((qr, index) => {
        const x = (index % columns) * 320;
        const y = Math.floor(index / columns) * 320;
        return `<g transform="translate(${x}, ${y})">${qr.svg}</g>`;
      })
      .join("\n");

    const combinedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 320}" height="${rows * 320}">
<rect width="${columns * 320}" height="${rows * 320}" fill="white"/>
${svgContent}
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="exelix-qr-codes-${Date.now()}.svg"`,
    );
    res.send(combinedSVG);
  } catch (error) {
    console.error("Batch QR generation error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to generate QR codes",
    });
  }
};

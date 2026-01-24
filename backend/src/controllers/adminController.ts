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

  // Если не нашли в БД, проверяем через .env (для простоты в разработке)
  const envLogin =
    process.env.ADMIN_LOGIN ||
    process.env.ADMIN_USERNAME ||
    "hayrulloh1706@gmail.com";
  const envPassword = process.env.ADMIN_PASSWORD || "20050617in";

  if (username === envLogin && password === envPassword) {
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
  const usersResult = await query(`SELECT COUNT(*) as count FROM users`);
  const totalUsers = parseInt(usersResult.rows[0].count);

  const requestsResult = await query(
    `SELECT COUNT(*) as count FROM notifications`,
  );
  const totalRequests = parseInt(requestsResult.rows[0].count);

  const successfulRequests = totalRequests;
  const failedRequests = 0;
  const inactiveQRCodes = await getInactiveQRCodesCount();

  res.json({
    totalUsers,
    totalRequests,
    successfulRequests,
    failedRequests,
    inactiveQRCodes,
  });
};

// --------------------
// Получить список пользователей
// --------------------
export const getUsers = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 40;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT
      id, first_name, last_name, phone, phone_country,
      telegram, avatar_url, status, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const countResult = await query(`SELECT COUNT(*) as count FROM users`);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    users: result.rows.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      phoneCountry: row.phone_country,
      telegram: row.telegram,
      avatarUrl: row.avatar_url,
      status: row.status,
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

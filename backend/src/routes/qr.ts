import { Router } from "express";
import sharp from "sharp";
import {
  validateQR,
  checkQRToken,
} from "../controllers/qrController";
import { validateRegistration } from "../utils/validation";
import { Response, Request } from "express";
import { randomBytes } from "crypto";
import { createError } from "../utils/errors";
import { query } from "../config/database";
import { sendNotification, checkRateLimit } from "../services/notificationService";
import { getUserByQRToken } from "../services/qrService";
import { createQRCode } from "../services/qrService";
import { qrRateLimit, registrationRateLimit } from "../middleware/rateLimit";
import { generateToken } from "../utils/jwt";
import { uploadAvatarBuffer, isStorageAvailable } from "../services/storageService";

const router = Router();

// Public QR validation (POST from form)
router.post("/validate", qrRateLimit, validateQR);

// Public QR validation (GET from URL)
router.get("/validate/:token", qrRateLimit, checkQRToken);

// Check QR token (for scanned QR codes - direct access)
router.get("/:token", qrRateLimit, checkQRToken);

// User registration via QR
router.post("/register", registrationRateLimit, validateRegistration, async (req: any, res: any) => {
  try {
    const { token, firstName, lastName, phone, phoneCountry, telegram, avatar, status, language, email, googleId } = req.body;

    // Добавляем @ в начало никнейма Telegram если отсутствует
    let processedTelegram = telegram;
    if (telegram && !telegram.startsWith('@')) {
      processedTelegram = '@' + telegram;
    }

    if (!token || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Token, first name, last name, and phone are required",
      });
    }

    // Start transaction
    await query("BEGIN");

    // Check if QR token is valid and unused
    const tokenResult = await query(
      "SELECT id, is_used FROM qr_codes WHERE token = $1",
      [token],
    );

    const lang = req.headers['accept-language'] || req.body.language || 'ru';

    if (tokenResult.rows.length === 0) {
      await query("ROLLBACK");
      const invalidTokenMessages: Record<string, string> = {
        ru: "QR токен не найден",
        ky: "QR токен табылган жок",
        en: "QR token not found"
      };
      return res.status(400).json({
        success: false,
        error: "INVALID_TOKEN",
        message: invalidTokenMessages[lang] || invalidTokenMessages.ru,
      });
    }

    const qrCode = tokenResult.rows[0];

    if (qrCode.is_used) {
      // Check if there's actually a user with this QR token
      const userCheck = await query(
        "SELECT id, first_name, last_name, phone FROM users WHERE qr_token = $1",
        [token]
      );

      if (userCheck.rows.length > 0) {
        // QR token used by actual user
        await query("ROLLBACK");
        const tokenUsedMessages: Record<string, string> = {
          ru: "Этот QR-код уже использован для регистрации",
          ky: "Бул QR-код каттоо үчүн мурунтан эле колдонулган",
          en: "This QR code is already used for registration"
        };
        return res.status(400).json({
          success: false,
          error: "TOKEN_USED",
          message: tokenUsedMessages[lang] || tokenUsedMessages.ru,
        });
      }
    }

    // Check if phone already exists
    const phoneCheck = await query(
      "SELECT id, qr_token, first_name, last_name, phone, phone_country, telegram_username, avatar_url, status, language FROM users WHERE phone = $1 AND phone_country = $2",
      [phone, (phoneCountry || "kg").toUpperCase()],
    );

    if (phoneCheck.rows.length > 0) {
      await query("ROLLBACK");

      // Определяем язык из заголовка или параметра
      const language = req.headers['accept-language'] || req.body.language || 'ru';

      const messages: Record<string, string> = {
        ru: "Пользователь с таким номером телефона уже существует",
        ky: "Мындай телефон номери менен колдонуучу бар",
        en: "User with this phone number already exists"
      };

      return res.status(400).json({
        success: false,
        error: "PHONE_EXISTS",
        message: messages[language] || messages.ru,
      });
    }

    // Check if Telegram already exists
    if (processedTelegram) {
      const telegramCheck = await query(
        "SELECT id FROM users WHERE LOWER(telegram_username) = LOWER($1)",
        [processedTelegram],
      );

      if (telegramCheck.rows.length > 0) {
        await query("ROLLBACK");

        // Определяем язык из заголовка или параметра
        const language = req.headers['accept-language'] || req.body.language || 'ru';

        const messages: Record<string, string> = {
          ru: "Пользователь с таким никнеймом Telegram уже существует",
          ky: "Мындай Telegram аты менен колдонуучу бар",
          en: "User with this Telegram username already exists"
        };

        return res.status(400).json({
          success: false,
          error: "TELEGRAM_EXISTS",
          message: messages[language] || messages.ru,
        });
      }
    }

    // Check if Google account already exists and is active
    if (googleId || email) {
      const googleCheck = await query(
        "SELECT id, is_active, created_at FROM users WHERE google_id = $1 OR email = $2",
        [googleId || null, email || null]
      );

      if (googleCheck.rows.length > 0) {
        const existingUser = googleCheck.rows[0];
        const isExpired = (Date.now() - new Date(existingUser.created_at).getTime()) > 365 * 24 * 60 * 60 * 1000;
        const isActive = existingUser.is_active && !isExpired;

        if (isActive) {
          await query("ROLLBACK");
          const language = req.headers['accept-language'] || req.body.language || 'ru';
          const googleExistsMessages: Record<string, string> = {
            ru: "Пользователь с таким Google аккаунтом уже существует",
            en: "User with this Google account already exists",
            ky: "Мындай Google аккаунту бар колдонуучу мурунтан эле бар"
          };
          return res.status(400).json({
            success: false,
            error: "GOOGLE_ACCOUNT_EXISTS",
            message: googleExistsMessages[language] || googleExistsMessages.ru,
          });
        }
      }
    }

    // Process avatar if provided — upload to Supabase Storage
    let avatarUrl: string | null = null;
    if (avatar && avatar.startsWith("data:image")) {
      try {
        const base64Data = avatar.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 0) {
          const resizedBuffer = await sharp(buffer)
            .resize(400, 400, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();

          // Try uploading to Supabase Storage first
          if (isStorageAvailable()) {
            // Use a temporary ID; we'll update after user creation
            const tempId = randomBytes(16).toString("hex");
            avatarUrl = await uploadAvatarBuffer(resizedBuffer, tempId);
          }

          // Fallback: store as base64 in DB if Storage unavailable
          if (!avatarUrl) {
            avatarUrl = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;
          }
        }
      } catch (error) {
        console.error("Avatar processing error:", error);
      }
    } else if (avatar && avatar.startsWith("http")) {
      // Google avatar URL — use directly
      avatarUrl = avatar;
    }

    // Create user
    const userResult = await query(
      `INSERT INTO users (qr_token, first_name, last_name, phone, phone_country, telegram_username, avatar_url, status, language, google_id, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING id`,
      [
        token,
        firstName,
        lastName,
        phone,
        (phoneCountry || "kg").toUpperCase(),
        processedTelegram || null,
        avatarUrl,
        status || "closed",
        language || "ru",
        googleId || null,
        email || null,
      ],
    );

    const userId = userResult.rows[0].id;

    // If we uploaded to storage with a temp ID, re-upload with actual user ID
    if (avatarUrl && isStorageAvailable() && !avatarUrl.startsWith("data:") && !avatarUrl.startsWith("http")) {
      // Already uploaded — avatar URL is valid
    }

    // Mark QR token as used and link to user
    await query(
      "UPDATE qr_codes SET used_by_user_id = $1, is_used = true, used_at = NOW() WHERE token = $2",
      [userId, token],
    );

    // Update statistics after successful registration
    await query(`
      INSERT INTO statistics (date, total_users, successful_requests, failed_requests, total_requests, inactive_qr_codes)
        VALUES (CURRENT_DATE,
          (SELECT COUNT(*) FROM users),
          (SELECT COUNT(*) FROM notifications),
          0,
          (SELECT COUNT(*) FROM notifications),
          (SELECT COUNT(*) FROM qr_codes WHERE is_used = false)
        )
        ON CONFLICT (date) DO UPDATE SET
          total_users = EXCLUDED.total_users,
          successful_requests = EXCLUDED.successful_requests,
          failed_requests = EXCLUDED.failed_requests,
          total_requests = EXCLUDED.total_requests,
          inactive_qr_codes = EXCLUDED.inactive_qr_codes,
          updated_at = NOW()
    `);

    // Commit transaction
    await query("COMMIT");

    // Get created user
    const createdUserResult = await query(
      "SELECT id, qr_token, first_name, last_name, phone, phone_country, telegram_username, avatar_url, status, language, email_notifications, push_notifications, telegram_notifications, created_at, updated_at, last_login FROM users WHERE id = $1",
      [userId],
    );

    const user = createdUserResult.rows[0];

    // Generate JWT token for the user
    const jwtToken = generateToken({ userId: user.id, type: "user" });

    res.status(201).json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        phoneCountry: user.phone_country,
        telegram: user.telegram_username,
        avatarUrl: user.avatar_url || null,
        status: user.status,
        language: user.language,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Ошибка регистрации",
    });
  }
});

// Send notification to User
router.post("/notify", async (req: any, res: any, next: any) => {
  try {
    const { token, notificationTypes, message } = req.body;
    const senderIp = req.ip || req.connection.remoteAddress || 'unknown';

    if (!token) {
      const language = req.headers['accept-language'] || req.body.language || 'ru';
      const messages: Record<string, string> = {
        ru: 'QR-код обязателен',
        ky: 'QR-код милдеттүү',
        en: 'QR token is required'
      };
      throw createError(400, 'VALIDATION_ERROR', messages[language] || messages.ru);
    }

    // Filter out invalid types
    const validNotificationTypes = notificationTypes.filter((type: string) => type && typeof type === 'string');

    const language = req.headers['accept-language'] || req.body.language || 'ru';
    await sendNotification(token, validNotificationTypes, senderIp, language, message);

    const successMessages: Record<string, string> = {
      ru: 'Уведомление успешно отправлено',
      ky: 'Билдирүү ийгиликтүү жөнөтүлдү',
      en: 'Notification sent successfully'
    };

    res.json({
      success: true,
      message: successMessages[language] || successMessages.ru
    });
  } catch (error: any) {
    console.error('Send notification error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'NOTIFICATION_ERROR',
      message: error.message || 'Failed to send notification'
    });
  }
});

// Check rate limits for QR token
router.post("/limits/check", async (req: any, res: any) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      const language = req.headers['accept-language'] || req.body.language || 'ru';
      const messages: Record<string, string> = {
        ru: 'QR-код обязателен',
        ky: 'QR-код милдеттүү',
        en: 'QR token is required'
      };
      throw createError(400, 'VALIDATION_ERROR', messages[language] || messages.ru);
    }

    const language = req.headers['accept-language'] || req.body.language || 'ru';

    // Get user by QR token
    const user = await getUserByQRToken(qrToken, language);

    // Get owner's received notifications count today
    const ownerResult = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [user.id]
    );

    const ownerCount = parseInt(ownerResult.rows[0]?.count || '0');
    const ownerLimit = 12;

    // Get sender's sent notifications count today (per owner)
    const senderResult = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE sender_ip = $1 AND user_id = $2 AND DATE(created_at) = CURRENT_DATE`,
      [req.ip || 'unknown', user.id]
    );

    const senderCount = parseInt(senderResult.rows[0]?.count || '0');
    const senderLimit = 3;

    // Owner can receive more notifications AND sender can send more
    const canSend = ownerCount < ownerLimit && senderCount < senderLimit;

    res.json({
      success: true,
      limits: {
        owner: {
          count: ownerCount,
          max: ownerLimit,
          exceeded: ownerCount >= ownerLimit,
        },
        sender: {
          count: senderCount,
          max: senderLimit,
          exceeded: senderCount >= senderLimit,
        },
        canSend: canSend,
      }
    });
  } catch (error: any) {
    console.error('Check limits error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: 'LIMITS_ERROR',
      message: error.message || 'Failed to check limits'
    });
  }
});

// Debug endpoints (only in development)
if (process.env.NODE_ENV === "development") {
  router.post("/debug/create", createQRCode);
  router.get("/debug/create", createQRCode);

  // Debug endpoint to create QR and return token
  router.post("/debug/create-qr", async (req: any, res: any) => {
    try {
      const token = await createQRCode();
      console.log('🎯 Created new QR token:', token);
      res.json({
        success: true,
        token: token,
        message: 'QR code created successfully'
      });
    } catch (error: any) {
      console.error('❌ Debug create QR error:', error);
      res.status(500).json({
        success: false,
        error: 'DEBUG_ERROR',
        message: error.message || 'Failed to create QR code'
      });
    }
  });

  // Debug endpoint to check user by phone
  router.post("/debug/user", async (req: any, res: any) => {
    const { phone } = req.body;
    try {
      const result = await query(
        'SELECT id, first_name, last_name, phone, telegram_username, telegram_username IS NOT NULL as has_telegram FROM users WHERE phone = $1',
        [phone]
      );
      res.json({
        success: true,
        user: result.rows[0] || null,
        count: result.rows.length
      });
    } catch (error: any) {
      console.error('Debug user error:', error);
      res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: error.message || 'Failed to query user'
      });
    }
  });

  // Create many test users for pagination testing
  router.get("/debug/create-many-users", async (req: any, res: any) => {
    try {
      console.log('🔧 Creating 25 test users...');

      for (let i = 1; i <= 25; i++) {
        // Create QR code
        const token = 'test-qr-' + i + '-' + Math.random().toString(36).substring(7);
        await query('INSERT INTO qr_codes (token, is_used) VALUES ($1, false)', [token]);

        // Generate proper UUID
        const userId = randomBytes(16).toString('hex');

        // Create user
        await query(`
          INSERT INTO users (id, qr_token, first_name, last_name, phone, status, language, telegram_username, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [userId, token, 'Test', 'User ' + i, '+996000000' + i.toString().padStart(3, '0'), 'open', 'ru', 'testuser' + i, new Date(Date.now() - (25 - i) * 3600000)]);

        // Mark QR as used
        await query('UPDATE qr_codes SET is_used = true WHERE token = $1', [token]);

        // Create some notifications
        for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
          await query(`
            INSERT INTO notifications (user_id, sender_ip, notification_types, message, created_at)
            VALUES ($1, '127.0.0.1', '["minorAccident"]', $2, NOW())
          `, [userId, 'Test notification ' + (j + 1)]);
        }
      }

      // Update statistics after creating all users
      await query(`
        INSERT INTO statistics (date, total_users, total_notifications, successful_notifications, failed_notifications, inactive_qr_codes)
          VALUES (CURRENT_DATE, 25, 50, 40, 10, 5)
          ON CONFLICT (date) DO UPDATE SET
            total_users = 25,
            total_notifications = 50,
            successful_notifications = 40,
            failed_notifications = 10,
            inactive_qr_codes = 5,
            updated_at = NOW()
      `);

      console.log('✅ Created 25 test users');

      res.json({
        success: true,
        message: '25 test users created successfully',
        users: 25,
        notifications: 50
      });
    } catch (error: any) {
      console.error('Create many users error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create test users'
      });
    }
  });

  // Create test data
  router.get("/debug/create-test-data", async (req: any, res: any) => {
    try {
      console.log('🔧 Creating test data...');

      // Create QR code
      const token = 'test-qr-token-' + Math.random().toString(36).substring(7);
      await query('INSERT INTO qr_codes (token, is_used) VALUES ($1, false)', [token]);
      console.log('✅ Created QR code:', token);

      // Create user with proper UUID
      const userId = randomBytes(16).toString('hex');
      await query(`
        INSERT INTO users (id, qr_token, first_name, last_name, phone, status, language, telegram_username, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [userId, token, 'Test', 'User', '+996000000000', 'open', 'ru', 'testuser']);
      console.log('✅ Created user:', userId);

      // Mark QR as used
      await query('UPDATE qr_codes SET is_used = true WHERE token = $1', [token]);

      // Update statistics after user creation
      await query(`
        INSERT INTO statistics (date, total_users, total_notifications, successful_notifications, failed_notifications, inactive_qr_codes)
          VALUES (CURRENT_DATE,
            (SELECT COUNT(*) FROM users),
            5,
            4,
            5,
            0)
          ON CONFLICT (date) DO UPDATE SET
            total_users = EXCLUDED.total_users,
            total_notifications = 5,
            successful_notifications = 4,
            failed_notifications = 1,
            inactive_qr_codes = 0,
            updated_at = NOW()
      `);

      // Create notifications
      for (let i = 0; i < 5; i++) {
        await query(`
          INSERT INTO notifications (user_id, sender_ip, notification_types, message, created_at)
          VALUES ($1, '127.0.0.1', '["minorAccident"]', $2, NOW())
        `, [userId, 'Test notification ' + (i + 1)]);
      }
      console.log('✅ Created 5 notifications');

      // Create statistics
      await query(`
        INSERT INTO statistics (date, total_users, total_notifications, successful_notifications, failed_notifications, inactive_qr_codes)
        VALUES (CURRENT_DATE, 1, 5, 4, 1, 0)
      `);
      console.log('✅ Created statistics');

      res.json({
        success: true,
        message: 'Test data created successfully',
        data: {
          qrToken: token,
          userId: userId,
          notifications: 5,
          statistics: 1
        }
      });
    } catch (error: any) {
      console.error('Create test data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create test data'
      });
    }
  });

  // Force clear with TRUNCATE
  router.get("/debug/truncate-all", async (req: any, res: any) => {
    try {
      console.log('🗑️ Truncating all tables...');

      await query('TRUNCATE TABLE daily_limits RESTART IDENTITY CASCADE');
      console.log('✅ Truncated daily_limits');

      await query('TRUNCATE TABLE notifications RESTART IDENTITY CASCADE');
      console.log('✅ Truncated notifications');

      await query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
      console.log('✅ Truncated users');

      await query('TRUNCATE TABLE qr_codes RESTART IDENTITY CASCADE');
      console.log('✅ Truncated qr_codes');

      await query('TRUNCATE TABLE statistics RESTART IDENTITY CASCADE');
      console.log('✅ Truncated statistics');

      res.json({
        success: true,
        message: 'All tables truncated successfully'
      });
    } catch (error: any) {
      console.error('Truncate error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to truncate tables'
      });
    }
  });

  // Debug endpoint - получить список QR кодов
  router.get("/debug/list", async (req, res) => {
    try {
      const result = await query(
        `SELECT id, token, is_used, created_at FROM qr_codes ORDER BY created_at DESC LIMIT 10`
      );

      console.log(`📋 Found ${result.rows.length} QR codes:`);

      res.json({
        success: true,
        count: result.rows.length,
        codes: result.rows.map(row => ({
          id: row.id,
          token: row.token,
          isUsed: row.is_used,
          createdAt: row.created_at
        }))
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    }
  });
}
export default router;

// backend/src/migrations/simple-migrate.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is required!");
  process.exit(1);
}

console.log("🔗 Connecting to database...");

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  console.log("🚀 Starting database migration...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("📦 Creating tables...");

    // 1. Создаём расширение для UUID
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 2. Создаём таблицу users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        qr_token TEXT UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        phone_country VARCHAR(4) NOT NULL,
        telegram TEXT,
        telegram_chat_id TEXT,
        avatar_url TEXT,
        push_subscription TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'closed',
        language VARCHAR(8) NOT NULL DEFAULT 'ru',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 3. Создаём таблицу qr_codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token TEXT UNIQUE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        used_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 4. Создаём таблицу notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sender_ip TEXT,
        notification_type TEXT,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 5. Создаём таблицу rate_limits
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        ip_address TEXT,
        type VARCHAR(16),
        count INTEGER DEFAULT 0,
        reset_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 6. Создаём таблицу admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query("COMMIT");
    console.log("✅ All tables created successfully!");

    // Создаём индексы
    console.log("🔍 Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone, phone_country);
      CREATE INDEX IF NOT EXISTS idx_users_qr_token ON users (qr_token);
      CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes (token);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits (user_id);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits (ip_address);
    `);
    console.log("✅ Indexes created!");

    // Создаём admin пользователя
    console.log("👑 Creating admin user...");
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('20050617in', 10);

    await client.query(`
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
    `, ['hayrulloh1706@gmail.com', hashedPassword]);

    console.log("✅ Admin user created (hayrulloh1706@gmail.com)");

    // Проверяем таблицы
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("📊 Tables in database:");
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем миграцию
migrate().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
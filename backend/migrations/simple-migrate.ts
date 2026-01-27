// backend/migrate.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function migrate() {
  console.log('🚀 Starting database migration...');

  const pool = new Pool({
    connectionString: 'postgresql://postgres:20050617in@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📦 Creating extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    console.log('👥 Creating users table...');
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

    // ... остальные таблицы (копируйте из TypeScript версии выше)

    console.log('👑 Creating admins table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created!');

    // Создаём admin
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('20050617in', 10);

    await client.query(`
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
    `, ['hayrulloh1706@gmail.com', hashedPassword]);

    // Проверяем таблицы
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
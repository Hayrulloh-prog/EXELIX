import { query } from './config/database';

async function migrate() {
  try {
    console.log('Adding is_active column to users table...');
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);
    console.log('Migration successful.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

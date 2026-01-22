import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    // Create default admin
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      `INSERT INTO admins (id, username, password_hash, created_at)
       VALUES (uuid_generate_v4(), $1, $2, NOW())
       ON CONFLICT (username) DO NOTHING`,
      [adminUsername, passwordHash]
    );

    console.log('✅ Default admin created');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

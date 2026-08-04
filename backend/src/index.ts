import app from "./app";
import { pool } from "./config/database";
import { validateEnv } from "./utils/env";
import { startStatisticsCron } from "./scripts/updateStatistics";

const PORT = parseInt(process.env.PORT || "3002");

// Validate environment early
validateEnv();

// Check and apply database schema migrations on startup
const setupDatabaseSchema = async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone_country ON users(phone, phone_country);
      CREATE INDEX IF NOT EXISTS idx_users_qr_token ON users(qr_token);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
      CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_ip, user_id, created_at);
    `);
    console.log("✅ Database schema verified: columns and indexes are up to date.");
  } catch (error) {
    console.error("❌ Failed to verify/update database schema:", error);
  }
};

setupDatabaseSchema().then(() => {
  // Start statistics cron job
  startStatisticsCron();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});

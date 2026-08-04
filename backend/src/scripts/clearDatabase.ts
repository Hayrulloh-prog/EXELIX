import { pool } from "../config/database";

async function clearDatabase() {
  try {
    console.log("🧹 Clearing database...");

    // Удаляем все данные из таблиц (в правильном порядке из-за foreign keys)
    await pool.query("TRUNCATE TABLE notifications CASCADE");
    await pool.query("TRUNCATE TABLE users CASCADE");
    await pool.query("TRUNCATE TABLE qr_codes CASCADE");
    await pool.query("TRUNCATE TABLE admins CASCADE");

    console.log("✅ Database cleared successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Clear error:", err.message);
    process.exit(1);
  }
}

clearDatabase();

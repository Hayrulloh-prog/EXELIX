import { query } from '../src/config/database';

async function clearDatabase() {
  console.log("🧹 Clearing database...");

  try {
    // Удаляем все данные из таблиц (в правильном порядке из-за foreign keys)
    await query("TRUNCATE TABLE notifications CASCADE");
    await query("TRUNCATE TABLE users CASCADE");
    await query("TRUNCATE TABLE qr_codes CASCADE");
    await query("TRUNCATE TABLE admins CASCADE");

    console.log("✅ Database cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();

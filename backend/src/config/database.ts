// backend/src/config/database.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is required!");
  process.exit(1);
}

console.log("Connecting to DB with DATABASE_URL");
console.log("Host:", new URL(connectionString).hostname);

// УПРОЩЁННАЯ КОНФИГУРАЦИЯ
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Разрешаем самоподписанные сертификаты
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("✅ Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("❌ Query error", { text, error });
    throw error;
  }
};
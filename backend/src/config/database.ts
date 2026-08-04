// backend/src/config/database.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is required!");
  process.exit(1);
}

const host = new URL(connectionString).hostname;
const isLocal =
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  // Для localhost — БЕЗ SSL, для удалённых (Supabase и т.п.) — с SSL
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false,
      },
  max: 20, // Optimized for 2 vCPU
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err);
});

// Slow query threshold in milliseconds
const SLOW_QUERY_MS = 100;

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Only log slow queries in production, all queries in development
    if (duration > SLOW_QUERY_MS) {
      console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 120));
    } else if (!isProduction) {
      // In development, log all queries but without full text
      console.log(`✅ Query (${duration}ms, ${res.rowCount} rows)`);
    }

    return res;
  } catch (error) {
    console.error("❌ Query error", { text: text.substring(0, 200), error });
    throw error;
  }
};
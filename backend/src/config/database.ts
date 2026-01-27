import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// ВАЖНО: используем ТОЛЬКО DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is required!");
  process.exit(1);
}

console.log("Connecting to DB with DATABASE_URL");
console.log("Host:", new URL(connectionString).hostname);

const dbHost = new URL(connectionString).hostname;
const isLocalDb =
  dbHost === "localhost" || dbHost === "127.0.0.1" || dbHost === "::1";

const config = {
  connectionString,
  // Локальный Postgres часто без SSL — не форсим его на localhost
  ...(isLocalDb
    ? {}
    : {
        ssl: {
          rejectUnauthorized: false,
        },
      }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
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

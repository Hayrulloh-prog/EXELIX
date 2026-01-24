import { pool } from "../config/database";
import { readFile } from "fs/promises";
import path from "path";

async function reset() {
  try {
    console.log("Dropping public schema...");
    await pool.query("DROP SCHEMA public CASCADE");
    console.log("Creating public schema...");
    await pool.query("CREATE SCHEMA public");

    // Re-run migration file
    const sqlPath = path.join(
      __dirname,
      "..",
      "..",
      "migrations",
      "001_initial_schema.sql",
    );
    const sql = await readFile(sqlPath, "utf8");
    console.log("Applying migration:", sqlPath);
    await pool.query(sql);

    console.log("✅ Database reset complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset error", err);
    process.exit(1);
  }
}

reset();

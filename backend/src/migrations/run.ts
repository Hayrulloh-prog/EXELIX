import { readFile } from "fs/promises";
import path from "path";
import { pool } from "../config/database";

async function run() {
  try {
    const sqlPath = path.join(
      __dirname,
      "..",
      "..",
      "migrations",
      "001_initial_schema.sql",
    );

    console.log("Running migrations from", sqlPath);

    const sql = await readFile(sqlPath, "utf8");
    await pool.query(sql);

    console.log("✅ Migrations applied");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error", err);
    process.exit(1);
  }
}

run();

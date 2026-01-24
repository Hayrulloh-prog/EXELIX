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
    const sql = await readFile(sqlPath, "utf8");
    console.log("Running migrations from", sqlPath);
    await pool.query(sql);
    console.log("✅ Migrations applied");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error", err);
    process.exit(1);
  }
}

run();
import { pool } from "../config/database";
import fs from "fs";
import path from "path";

const runMigrations = async () => {
  try {
    const migrationsDir = path.join(__dirname, "sql");
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith(".sql")) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed`);
      }
    }

    console.log("✅ All migrations completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

runMigrations();

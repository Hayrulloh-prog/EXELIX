// backend/src/migrations/run.ts
import path from "path";
import fs from "fs";
import { query } from "../../config/database";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("🚀 Starting database migrations...");

  // ИСПРАВЛЕННЫЙ ПУТЬ: указываем на существующий файл миграции
  const migrationPath = path.join(
    __dirname,
    "..", // поднимаемся на уровень выше
    "..", // ещё на уровень выше
    "migrations", // папка миграций
    "001_initial_schema.sql" // файл миграции
  );

  console.log("📁 Migration path:", migrationPath);

  try {
    // Проверяем, существует ли файл
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    // Читаем содержимое файла
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log("📄 Migration SQL content length:", sql.length);

    // Выполняем миграцию
    await query(sql);
    console.log("✅ Migration completed successfully!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

run();
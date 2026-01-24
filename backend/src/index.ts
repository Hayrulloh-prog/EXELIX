import app from "./app";
import { pool } from "./config/database";
import { validateEnv } from "./utils/env";

const PORT = process.env.PORT || 3001;

// Validate environment early
validateEnv();

// Test database connection
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("✅ Database connected");
  })
  .catch((err: any) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

// ВАЖНО: Fly.io требует слушать на 0.0.0.0, а не localhost!
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on 0.0.0.0:${PORT}`); // ← Изменено здесь
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
});

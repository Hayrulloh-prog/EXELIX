const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "REDIS_URL",
];

export function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredEnv) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    console.error(
      "Missing required environment variables:",
      missing.join(", "),
    );
    process.exit(1);
  }

  // Warn for optional but important keys in production
  if (
    process.env.NODE_ENV === "production" ||
    process.env.FORCE_ENV_CHECK === "true"
  ) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error(
        "VAPID keys are not configured. Push notifications will not work. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.",
      );
    }
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error(
        "TELEGRAM_BOT_TOKEN is not configured. Telegram notifications will not work.",
      );
    }
  }
}

export default validateEnv;

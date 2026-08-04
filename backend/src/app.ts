import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import avatarRoutes from "./routes/avatar";
import qrRoutes from "./routes/qr";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";
import pushRoutes from "./routes/push";
import { errorHandler } from "./utils/errors";
import { scheduleCleanup } from "./services/cleanupService";
import { apiRateLimit } from "./middleware/rateLimit";

dotenv.config();

const app = express();

// --------------------
// Security middleware
// --------------------
app.use(helmet());

// --------------------
// Rate limiting
// --------------------
app.use('/api/', apiRateLimit);

// --------------------
// CORS setup
// --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://192.168.0.46:3000",
  "http://192.168.0.46:3001",
  "http://172.26.128.1:3000",
  "http://172.26.128.1:3001",
  "http://192.168.236.247:3000", // Добавлен текущий IP
  "http://192.168.236.247:3001", // Добавлен текущий IP
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all localhost variants
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Allow specific network IPs
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // For development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// --------------------
// Body parsing
// --------------------
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));



// --------------------
// Serve uploads
// --------------------
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
app.use("/uploads", express.static(path.resolve(uploadDir)));

// --------------------
// Health check
// --------------------
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --------------------
// API routes
// --------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/users", avatarRoutes);
app.use("/api/v1/qr", qrRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/push", pushRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Exelix3 API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      qr: "/api/v1/qr",
      notifications: "/api/v1/notifications",
      admin: "/api/v1/admin",
      push: "/api/v1/push",
    },
    documentation: "https://github.com/your-username/exelix3",
    status: "operational",
  });
});

// --------------------
// Error handler
// --------------------
app.use(errorHandler);

// --------------------
// 404 handler
// --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "Route not found",
  });
});

export default app;

// Запуск планировщика очистки при старте приложения
scheduleCleanup();

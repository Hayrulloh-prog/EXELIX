import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import qrRoutes from './routes/qr';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import pushRoutes from './routes/push';
import { errorHandler } from './utils/errors';

dotenv.config();

const app = express();

// --------------------
// Security middleware
// --------------------
app.use(helmet());

// --------------------
// CORS setup
// --------------------
// Разрешаем фронтенд на портах 3000 и 3001 для разработки
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// --------------------
// Body parsing
// --------------------
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --------------------
// Trust proxy (для rate limiting, если понадобится)
// --------------------
app.set('trust proxy', 1);

// --------------------
// Serve uploads
// --------------------
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// --------------------
// Health check
// --------------------
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --------------------
// API routes
// --------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/qr', qrRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/push', pushRoutes);

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
    error: 'NOT_FOUND',
    message: 'Route not found',
  });
});

export default app;

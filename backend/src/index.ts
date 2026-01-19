import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

import authRoutes from './routes/auth.js'
import qrRoutes from './routes/qr.js'
import notificationRoutes from './routes/notifications.js'
import adminRoutes from './routes/admin.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
mkdirSync(uploadsDir, { recursive: true })

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin', adminRoutes)

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

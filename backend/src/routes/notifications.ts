import express from 'express'
import { sendNotification } from '../controllers/notifications'
import { rateLimitNotification } from '../middleware/rateLimit'

const router = express.Router()

router.post('/send', rateLimitNotification, sendNotification)

export default router

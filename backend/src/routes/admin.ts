import express from 'express'
import { getStatistics, getUsers, generateQR } from '../controllers/admin'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(authenticate)
router.use(requireAdmin)

router.get('/statistics', getStatistics)
router.get('/users', getUsers)
router.get('/qr/generate', generateQR)

export default router

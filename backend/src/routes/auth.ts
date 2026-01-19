import express from 'express'
import { register, login, getProfile, updateProfile, setActiveNow } from '../controllers/auth'
import { authenticate } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Routes
router.post('/register/:qrToken', upload.single('photo'), register)
router.post('/login', login)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, upload.single('photo'), updateProfile)
router.post('/active-now', authenticate, setActiveNow)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' })
})

export default router

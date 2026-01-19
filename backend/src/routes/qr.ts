import express from 'express'
import { getQRInfo } from '../controllers/qr'

const router = express.Router()

router.get('/:qrToken', getQRInfo)

export default router

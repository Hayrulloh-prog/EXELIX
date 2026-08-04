import { Router } from 'express';
import { login, adminLogin, googleLogin, googleCallback } from '../controllers/authController';
import { validateAdminLogin } from '../utils/validation';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authRateLimit, login);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
// Admin login moved to /api/v1/admin/login

export default router;

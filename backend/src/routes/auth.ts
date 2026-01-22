import { Router } from 'express';
import { register, login, adminLogin } from '../controllers/authController';
import { validateRegister, validateAdminLogin } from '../utils/validation';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authRateLimit, validateRegister, register);
router.post('/login', authRateLimit, login);
router.post('/admin/login', authRateLimit, validateAdminLogin, adminLogin);

export default router;

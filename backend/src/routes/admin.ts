import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import { validateGenerateQR } from '../utils/validation';
import { loginAdmin, getStats, getUsers, generateQR } from '../controllers/adminController';

const router = Router();

// Публичный маршрут для логина
router.post('/login', loginAdmin);

// Защищённые маршруты (требуется авторизация)
router.use(authenticateAdmin);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/qr/generate', validateGenerateQR, generateQR);

export default router;

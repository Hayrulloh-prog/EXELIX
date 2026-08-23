import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import { validateGenerateQR } from '../utils/validation';
import { loginAdmin, getUsers, generateQR, generateBatchQR, toggleUserStatus, deleteUser, getAdminMe } from '../controllers/adminController';
import { getStats, updateStats, getStatsHistory } from '../controllers/statisticsController';

const router = Router();

// Публичный маршрут для логина
router.post('/login', loginAdmin);

// Защищённые маршруты (требуется авторизация)
router.use(authenticateAdmin);
router.get('/me', getAdminMe);
router.get('/stats', getStats);
router.post('/stats/update', updateStats);
router.get('/stats/history', getStatsHistory);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/qr/generate', validateGenerateQR, generateQR);
router.post('/qr/generate-batch', generateBatchQR);

export default router;

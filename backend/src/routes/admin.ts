import { Router } from 'express';
import { getStats, getUsers, generateQR } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/auth';
import { validateGenerateQR } from '../utils/validation';

const router = Router();

router.use(authenticateAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/qr/generate', validateGenerateQR, generateQR);

export default router;

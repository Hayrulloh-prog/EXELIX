import { Router } from 'express';
import { getMe, updateMe, subscribePush } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validateUpdateProfile } from '../utils/validation';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validateUpdateProfile, updateMe);
router.post('/push-subscribe', authenticate, subscribePush);

export default router;

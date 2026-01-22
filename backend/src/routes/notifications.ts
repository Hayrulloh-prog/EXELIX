import { Router } from 'express';
import { send } from '../controllers/notificationController';
import { validateSendNotification } from '../utils/validation';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.post('/send', apiRateLimit, validateSendNotification, send);

export default router;

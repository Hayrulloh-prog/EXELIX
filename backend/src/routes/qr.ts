import { Router } from 'express';
import { validateQR } from '../controllers/qrController';

const router = Router();

router.post('/validate', validateQR);

export default router;

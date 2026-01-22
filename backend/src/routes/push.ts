import { Router } from 'express';
import { getVapidPublicKey } from '../services/pushService';

const router = Router();

router.get('/vapid-key', (req, res) => {
  res.json({
    publicKey: getVapidPublicKey(),
  });
});

export default router;

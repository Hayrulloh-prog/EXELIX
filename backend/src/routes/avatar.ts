import { Router } from 'express';
import { getUserAvatar } from '../controllers/avatarController';

const router = Router();

// GET /api/v1/users/:userId/avatar - Get user avatar
router.get('/:userId/avatar', getUserAvatar);

export default router;

import { Router } from 'express';
import { postLogin, getVerify, postRefresh, getMe } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/login', postLogin);
router.get('/verify', getVerify);
router.post('/refresh', postRefresh);
router.get('/me', authMiddleware, getMe);

export default router;
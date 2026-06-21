import { Router } from 'express';
import { postAtom, getAtoms, postVoiceAtom } from './atoms.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/', authMiddleware, postAtom);
router.get('/', authMiddleware, getAtoms);
router.post('/voice', authMiddleware, postVoiceAtom)

export default router;
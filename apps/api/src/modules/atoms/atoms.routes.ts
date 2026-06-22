import { Router } from 'express';
import { postAtom, getAtoms, postVoiceAtom, postArticleAtom } from './atoms.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/', authMiddleware, postAtom);
router.get('/', authMiddleware, getAtoms);
router.post('/voice', authMiddleware, postVoiceAtom);
router.post('/article', authMiddleware, postArticleAtom);

export default router;
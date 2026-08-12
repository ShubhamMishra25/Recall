import { Router } from 'express';
import { postAtom, getAtoms, postVoiceAtom, postArticleAtom, postPdfAtom, postImageAtom } from './atoms.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/', authMiddleware, postAtom);
router.get('/', authMiddleware, getAtoms);
router.post('/voice', authMiddleware, postVoiceAtom);
router.post('/article', authMiddleware, postArticleAtom);
router.post('/pdf', authMiddleware, postPdfAtom);
router.post('/image', authMiddleware, postImageAtom);

export default router;
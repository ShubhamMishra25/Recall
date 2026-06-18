import { Router } from 'express';
import { postAtom, getAtoms } from './atoms.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post('/', authMiddleware, postAtom);
router.get('/', authMiddleware, getAtoms);

export default router;
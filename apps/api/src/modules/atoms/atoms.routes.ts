import { Router } from 'express';
import { postAtom, getAtoms } from './atoms.controller';

const router = Router();

router.post('/', postAtom);
router.get('/', getAtoms);

export default router;
import { Router } from "express";
import { getVoiceUploadUrl } from "./upload.controller";
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post("/voice-url", authMiddleware, getVoiceUploadUrl);

export default router;
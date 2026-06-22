import { Router } from "express";
import { getVoiceUploadUrl } from "./upload.controller";
import { authMiddleware } from '../../middleware/auth';
import { getPdfUploadUrl } from "./upload.controller";

const router = Router();

router.post("/voice-url", authMiddleware, getVoiceUploadUrl);
router.post("/pdf-url", authMiddleware, getPdfUploadUrl);

export default router;
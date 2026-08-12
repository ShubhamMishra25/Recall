import { Router } from "express";
import { getImageUploadUrl, getPdfUploadUrl, getVoiceUploadUrl } from "./upload.controller";
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.post("/voice-url", authMiddleware, getVoiceUploadUrl);
router.post("/pdf-url", authMiddleware, getPdfUploadUrl);
router.post("/image-url", authMiddleware, getImageUploadUrl);

export default router;
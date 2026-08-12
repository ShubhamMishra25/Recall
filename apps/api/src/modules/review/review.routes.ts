import { Router } from "express";
import { getToday, postGrade, getStats } from "./review.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/today", authMiddleware, getToday);
router.post("/grade", authMiddleware, postGrade);
router.get("/stats", authMiddleware, getStats);

export default router;
import { Router } from "express";
import { getToday, postGrade } from "./review.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/today", authMiddleware, getToday);
router.post("/grade", authMiddleware, postGrade);

export default router;
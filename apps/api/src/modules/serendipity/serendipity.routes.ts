import { Router } from "express";
import { getDailyCardHandler } from "./serendipity.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/", authMiddleware, getDailyCardHandler);

export default router;

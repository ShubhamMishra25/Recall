import { Router } from "express";
import { searchHandler } from "./search.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.get("/", authMiddleware, searchHandler);

export default router;

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { postLogin, postVerify, postRefresh, postLogout, getMe } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

const rateLimitedResponse = (message: string) => ({
  error: { code: "RATE_LIMITED", message },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(rateLimitedResponse("Too many login attempts. Try again later.")),
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(rateLimitedResponse("Too many verification attempts. Try again later.")),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(rateLimitedResponse("Too many refresh attempts. Try again later.")),
});

const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json(rateLimitedResponse("Too many logout attempts. Try again later.")),
});

router.post("/login", loginLimiter, postLogin);
router.post("/verify", verifyLimiter, postVerify);
router.post("/refresh", refreshLimiter, postRefresh);
router.post("/logout", logoutLimiter, postLogout);
router.get("/me", authMiddleware, getMe);

export default router;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma";

import atomsRouter from "./modules/atoms/atoms.routes";
import authRouter from "./modules/auth/auth.routes";
import reviewRoutes from "./modules/review/review.routes";
import searchRoutes from "./modules/search/search.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import serendipityRoutes from "./modules/serendipity/serendipity.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// Behind the Azure Container Apps / Static Web Apps reverse proxy,
// trust the first hop so rate limiting keys on the real client IP.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/atoms", atomsRouter);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/serendipity", serendipityRoutes);

// Health check – also tests DB connectivity
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./lib/prisma";

import atomsRouter from "./modules/atoms/atoms.routes";
import authRouter from "./modules/auth/auth.routes";
import reviewRoutes from "./modules/review/review.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/atoms", atomsRouter);
app.use("/api/v1/review", reviewRoutes);

// Health check – also tests DB connectivity
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

export default app;

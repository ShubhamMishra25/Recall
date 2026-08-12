import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestWithUser } from "../types/request";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "MISSING_AUTH_HEADER",
        message: "Missing or invalid authorization header",
      },
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId; // Attach userId to the request object
    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
      },
    });
  }
}

import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import prisma from "../../lib/prisma";
import { RequestWithUser } from "../../types/request";

export async function postLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const result = await authService.sendMagicLink(email);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getVerify(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token } = req.query;
    if (typeof token !== "string")
      return res.status(400).json({ message: "Token is required" });
    const result = await authService.verifyMagicLink(token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function postRefresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token is required" });

    const result = await authService.refreshAccessToken(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: RequestWithUser, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // req.userId is set by the auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    next(error);
  }
}

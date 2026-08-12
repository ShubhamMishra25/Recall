import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import prisma from "../../lib/prisma";
import { RequestWithUser } from "../../types/request";
import { AppError } from "../../lib/errors";

export async function postLogin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email } = req.body;
    if (!email) {
      return next(AppError.badRequest("Email is required", "MISSING_EMAIL"));
    }
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
    if (typeof token !== "string") {
      return next(AppError.badRequest("Token is required", "MISSING_TOKEN"));
    }
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
    if (!refreshToken) {
      return next(
        AppError.badRequest("Refresh token is required", "MISSING_REFRESH_TOKEN"),
      );
    }

    const result = await authService.refreshAccessToken(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    return next(AppError.unauthorized("Unauthorized"));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return next(AppError.notFound("User not found", "USER_NOT_FOUND"));
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

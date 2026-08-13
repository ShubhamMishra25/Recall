import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import prisma from "../../lib/prisma";
import { RequestWithUser } from "../../types/request";
import { AppError } from "../../lib/errors";

const REFRESH_COOKIE = "refresh_token";
const isProd = process.env.NODE_ENV === "production";

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    path: "/",
  };
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions(),
    maxAge:
      parseInt(process.env.REFRESH_TOKEN_EXPIRY || "7") * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

function readRefreshToken(req: Request): string {
  return (req.cookies?.[REFRESH_COOKIE] as string) || req.body?.refreshToken;
}

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

export async function postVerify(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { token } = req.body;
    if (typeof token !== "string" || !token) {
      return next(AppError.badRequest("Token is required", "MISSING_TOKEN"));
    }
    const result = await authService.verifyMagicLink(token);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
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
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      return next(
        AppError.badRequest("Refresh token is required", "MISSING_REFRESH_TOKEN"),
      );
    }

    const result = await authService.refreshAccessToken(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function postLogout(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = readRefreshToken(req);
    await authService.logout(req.userId!, refreshToken);
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Logged out" });
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

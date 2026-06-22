import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";

const KNOWN_ERRORS: Record<string, { status: number; code: string }> = {
  "Invalid or expired magic link": {
    status: 401,
    code: "INVALID_MAGIC_LINK",
  },
  "User not found": { status: 404, code: "USER_NOT_FOUND" },
  "Invalid refresh token": { status: 401, code: "INVALID_REFRESH_TOKEN" },
  "Refresh token not found or revoked": {
    status: 401,
    code: "REFRESH_TOKEN_REVOKED",
  },
  "Review state not found": { status: 404, code: "REVIEW_STATE_NOT_FOUND" },
  "Invalid file URL": { status: 400, code: "INVALID_FILE_URL" },
  "Could not transcribe audio": { status: 422, code: "TRANSCRIPTION_FAILED" },
  "Could not parse article": { status: 422, code: "ARTICLE_PARSE_FAILED" },
  "Could not parse PDF": { status: 422, code: "PDF_PARSE_FAILED" },
  "Could not extract text from image": {
    status: 422,
    code: "IMAGE_OCR_FAILED",
  },
};

function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof Error) {
    const known = KNOWN_ERRORS[err.message];
    if (known) {
      return new AppError(known.status, known.code, err.message);
    }

    if (err.message.startsWith("Invalid grade:")) {
      return AppError.badRequest(err.message, "INVALID_GRADE");
    }

    if (err.message.startsWith("Failed to fetch URL:")) {
      return AppError.badRequest(err.message, "URL_FETCH_FAILED");
    }

    if (process.env.NODE_ENV !== "production") {
      return AppError.internal(err.message);
    }
  }

  return AppError.internal();
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const normalized = normalizeError(err);

  if (normalized.statusCode >= 500) {
    console.error(`[${req.method} ${req.path}]`, err);
  }

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

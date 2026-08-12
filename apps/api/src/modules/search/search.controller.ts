import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../types/request";
import { semanticSearch } from "./search.service";
import { AppError } from "../../lib/errors";

export async function searchHandler(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = req.query.q as string;

    if (!query) {
      return next(
        AppError.badRequest("Missing search query '?q=...'", "MISSING_QUERY"),
      );
    }

    const results = await semanticSearch(req.userId!, query);
    res.json({ data: results });
  } catch (error) {
    next(error);
  }
}

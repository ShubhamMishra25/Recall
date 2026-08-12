import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../types/request";
import { getTodayReviewQueue, gradeAtom } from "./review.service";
import { AppError } from "../../lib/errors";

export async function getToday(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const queue = await getTodayReviewQueue(req.userId!);
    res.status(200).json({ data: queue });
  } catch (error) {
    next(error);
  }
}

export async function postGrade(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { atomId, grade } = req.body;

    if (!atomId || !grade) {
      return next(
        AppError.badRequest("Missing atomId or grade", "MISSING_REVIEW_FIELDS"),
      );
    }

    const result = await gradeAtom(req.userId!, atomId, grade);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

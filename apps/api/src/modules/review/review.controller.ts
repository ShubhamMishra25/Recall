import { Response } from "express";
import { RequestWithUser } from "../../types/request";
import { getTodayReviewQueue, gradeAtom } from "./review.service";

export async function getToday(req: RequestWithUser, res: Response) {
  try {
    const queue = await getTodayReviewQueue(req.userId!);
    res.status(200).json({ data: queue });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch review queue" });
  }
}

export async function postGrade(req: RequestWithUser, res: Response) {
  try {
    const { atomId, grade } = req.body;

    if (!atomId || !grade) {
      return res.status(400).json({ error: "Missing atomId or grade" });
    }

    const result = await gradeAtom(req.userId!, atomId, grade);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to grade atom" });
  }
}

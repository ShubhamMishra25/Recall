import { Request, Response, NextFunction } from "express";
import { createAtom, listAtoms } from "./atoms.service";
import { RequestWithUser } from "../../types/request";

export async function postAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { content, sourceUrl, sourceType, tags } = req.body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return res.status(400).json({ error: "Content is required" });
    }

    const atom = await createAtom({
      content: content.trim(),
      sourceUrl,
      sourceType,
      tags,
      userId: req.userId!,
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

export async function getAtoms(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listAtoms(req.userId!, page, limit);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

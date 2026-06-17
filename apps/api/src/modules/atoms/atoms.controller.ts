import { Request, Response, NextFunction } from "express";
import { createAtom, listAtoms } from "./atoms.service";

export async function postAtom(
  req: Request,
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
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

export async function getAtoms(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listAtoms(page, limit);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
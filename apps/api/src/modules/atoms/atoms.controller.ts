import { Response, NextFunction } from "express";
import { createAtom, listAtoms, createVoiceAtom, createArticleAtom, createPdfAtom, createImageAtom } from "./atoms.service";
import { RequestWithUser } from "../../types/request";
import { aiQueue } from "../ai/ai.worker";
import { AppError } from "../../lib/errors";

export async function postAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { content, sourceUrl, sourceType } = req.body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return next(AppError.badRequest("Content is required", "MISSING_CONTENT"));
    }

    const atom = await createAtom({
      content: content.trim(),
      sourceUrl,
      sourceType,
      userId: req.userId!,
    });

    await aiQueue.add("process-new-atom", {
      atomId: atom.id,
      content: atom.content,
      userId: req.userId!,
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

export async function postVoiceAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return next(AppError.badRequest("File URL is required", "MISSING_FILE_URL"));
    }

    const atom = await createVoiceAtom(req.userId!, fileUrl);

    await aiQueue.add("process-new-atom", {
      atomId: atom.id,
      content: atom.content,
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


export async function postArticleAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { url } = req.body;

    if (!url) {
      return next(AppError.badRequest("URL is required", "MISSING_URL"));
    }

    const atom = await createArticleAtom(req.userId!, url);

    await aiQueue.add("process-new-atom", {
      atomId: atom.id,
      content: atom.content,
      userId: req.userId!,
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

export async function postPdfAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return next(
        AppError.badRequest(
          "File URL and file name are required",
          "MISSING_FILE_FIELDS",
        ),
      );
    }

    const atom = await createPdfAtom(req.userId!, fileUrl, fileName);

    await aiQueue.add("process-new-atom", {
      atomId: atom.id,
      content: atom.content,
      userId: req.userId!,
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

export async function postImageAtom(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return next(
        AppError.badRequest(
          "File URL and file name are required",
          "MISSING_FILE_FIELDS",
        ),
      );
    }

    const atom = await createImageAtom(req.userId!, fileUrl, fileName);

    await aiQueue.add("process-new-atom", {
      atomId: atom.id,
      content: atom.content,
      userId: req.userId!,
    });

    res.status(201).json(atom);
  } catch (error) {
    next(error);
  }
}

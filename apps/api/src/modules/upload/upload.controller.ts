import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../types/request";
import { UploadService } from "./upload.service";
import { AppError } from "../../lib/errors";

export async function getVoiceUploadUrl(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const credentials = await UploadService.generateVoiceUploadUrl(req.userId!);
    return res.status(200).json(credentials);
  } catch (error) {
    next(error);
  }
}

export async function getPdfUploadUrl(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return next(
        AppError.badRequest("File name is required", "MISSING_FILE_NAME"),
      );
    }

    const credentials = await UploadService.generatePdfUploadUrl(
      req.userId!,
      fileName,
    );
    return res.status(200).json(credentials);
  } catch (error) {
    next(error);
  }
}

export async function getImageUploadUrl(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return next(
        AppError.badRequest("File name is required", "MISSING_FILE_NAME"),
      );
    }

    const credentials = await UploadService.generateImageUploadUrl(
      req.userId!,
      fileName,
    );
    return res.status(200).json(credentials);
  } catch (error) {
    next(error);
  }
}

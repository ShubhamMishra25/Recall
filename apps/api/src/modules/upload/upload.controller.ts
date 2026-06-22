import { Response } from "express";
import { RequestWithUser } from "../../types/request";
import { UploadService } from "./upload.service";

export async function getVoiceUploadUrl(
    req: RequestWithUser,
    res: Response,
) {
    try {
        const credentials = await UploadService.generateVoiceUploadUrl(req.userId!);

        return res.status(200).json(credentials);
    } catch (error) {
        console.error("Failed to generate upload URL", error);
        return res.status(500).json({ error: "Failed to generate upload URL" });
    }
}

export async function getPdfUploadUrl(
    req: RequestWithUser,
    res: Response,
) {
    try {
        const { fileName } = req.body;

        if (!fileName) {
            return res.status(400).json({ error: "File name is required" });
        }

        const credentials = await UploadService.generatePdfUploadUrl(req.userId!, fileName);

        return res.status(200).json(credentials);
    } catch (error) {
        console.error("Failed to generate upload URL", error);
        return res.status(500).json({ error: "Failed to generate upload URL" });
    }
}
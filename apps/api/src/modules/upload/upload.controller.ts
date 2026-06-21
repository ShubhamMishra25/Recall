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
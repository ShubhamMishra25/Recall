import { BlobSASPermissions } from "@azure/storage-blob";
import { randomUUID } from "crypto";
import { containerClient } from "../../lib/azure-storage";

export class UploadService {

    static async generateVoiceUploadUrl(userId: string) {
        const blobName = `voice/${userId}/${randomUUID()}.webm`;

        const blobClient = containerClient.getBlockBlobClient(blobName);

        const uploadUrl = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse("cw"),
            expiresOn: new Date(Date.now() + 15 * 60 * 1000)
        });

        return {
            uploadUrl,
            fileUrl: blobClient.url
        };
    }

    static async generatePdfUploadUrl(userId: string, fileName: string) {

        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

        const blobName = `pdf/${userId}/${randomUUID()}-${safeFileName}`;

        const blobClient = containerClient.getBlockBlobClient(blobName);

        const uploadUrl = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse("cw"),
            expiresOn: new Date(Date.now() + 15 * 60 * 1000)
        });

        return {
            uploadUrl,
            fileUrl: blobClient.url
        };
    }

    static async generateImageUploadUrl(userId: string, fileName: string) {
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const blobName = `images/${userId}/${randomUUID()}-${safeFileName}`;

        const blobClient = containerClient.getBlockBlobClient(blobName);

        const uploadUrl = await blobClient.generateSasUrl({
            permissions: BlobSASPermissions.parse("cw"),
            expiresOn: new Date(Date.now() + 15 * 60 * 1000)
        });

        return {
            uploadUrl,
            fileUrl: blobClient.url
        };
    }
}
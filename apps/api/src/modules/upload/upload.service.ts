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
}
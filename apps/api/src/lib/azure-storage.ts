import { BlobServiceClient } from "@azure/storage-blob";

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error("Missing AZURE_STORAGE_CONNECTION_STRING environment variable");
}
if (!process.env.AZURE_STORAGE_CONTAINER_NAME) {
  throw new Error("Missing AZURE_STORAGE_CONTAINER_NAME environment variable");
}

export const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
export const azureStorageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

export const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
export const containerClient = blobServiceClient.getContainerClient(azureStorageContainerName);

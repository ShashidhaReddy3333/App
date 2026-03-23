import { put, del } from "@vercel/blob";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/csv",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type BlobUploadResponse = {
  url: string;
};

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

/**
 * Upload a file to Vercel Blob storage.
 */
export async function uploadFile(file: File, pathPrefix: string): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`);
  }

  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const key = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const blob = (await put(key, file, {
    access: "public",
    contentType: file.type,
  })) as BlobUploadResponse;

  return {
    key,
    url: blob.url,
    contentType: file.type,
    size: file.size,
  };
}

/**
 * Delete a file from Vercel Blob by URL.
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * Generate a presigned upload URL (Vercel Blob does not support presigned URLs natively;
 * this returns a token URL for client-side upload via handleUpload).
 */
export async function getBlobToken(): Promise<string | null> {
  return process.env.BLOB_READ_WRITE_TOKEN ?? null;
}

export { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES };

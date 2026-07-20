import { randomUUID } from "node:crypto";
import { writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { projectUploadDir } from "./store";
import { DocumentCategory, StoredDocument } from "./types";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB per file
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "text/"];

export class UploadRejectedError extends Error {}

export async function saveUploadedFile(
  projectId: string,
  file: File,
  category: DocumentCategory
): Promise<StoredDocument> {
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadRejectedError(`${file.name} is larger than the 20MB limit.`);
  }
  const mimeType = file.type || "application/octet-stream";
  const allowed = ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p));
  if (!allowed) {
    throw new UploadRejectedError(`${file.name} has an unsupported file type (${mimeType}).`);
  }

  const dir = await projectUploadDir(projectId);
  const id = randomUUID();
  const ext = path.extname(file.name).slice(0, 10);
  const storedFilename = `${id}${ext}`;
  const storagePath = path.join(dir, storedFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  return {
    id,
    filename: file.name,
    mimeType,
    sizeBytes: file.size,
    category,
    uploadedAt: new Date().toISOString(),
    storagePath,
  };
}

export async function readStoredFile(storagePath: string): Promise<Buffer> {
  return readFile(storagePath);
}

export async function deleteStoredFile(storagePath: string): Promise<void> {
  try {
    await unlink(storagePath);
  } catch {
    // already gone; nothing to do
  }
}

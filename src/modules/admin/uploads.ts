import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 2 * 1024 * 1024;

// Saves an admin-uploaded tree or product photo. Returns its URL, null if no file, or an error message.
// Online (on Vercel) photos go to Vercel Blob storage; on your own computer they go to the uploads folder.
export async function saveImage(file: File | null, slug: string): Promise<{ url: string | null; error?: string }> {
  if (!file || file.size === 0) return { url: null };
  const ext = TYPES[file.type];
  if (!ext) return { url: null, error: "Upload a JPG, PNG or WebP image." };
  if (file.size > MAX_BYTES) return { url: null, error: "Images must be under 2 MB. Compress it and try again." };
  const bytes = Buffer.from(await file.arrayBuffer());
  // Check the file really is the image type it claims to be
  const sig = bytes.subarray(0, 12).toString("hex");
  const ok = (ext === "jpg" && sig.startsWith("ffd8ff")) || (ext === "png" && sig.startsWith("89504e47")) || (ext === "webp" && sig.startsWith("52494646") && sig.slice(16, 24) === "57454250");
  if (!ok) return { url: null, error: "That file does not look like a valid image." };
  const name = `${slug}-${randomBytes(4).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`trees/${name}`, bytes, { access: "public", contentType: file.type, addRandomSuffix: false });
      return { url: blob.url };
    } catch (e) {
      console.error("photo upload to Vercel Blob failed", e);
      return { url: null, error: "The photo could not be saved online. Please try again." };
    }
  }
  if (process.env.VERCEL) return { url: null, error: "Photo storage is not connected. In Vercel, open Storage and connect a Blob store, then redeploy." };
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}` };
}

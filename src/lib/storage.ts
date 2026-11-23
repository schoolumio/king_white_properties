import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MediaAsset, MediaVisibility } from "@prisma/client";
import { db } from "./db";
import { env } from "./env";
import { randomToken } from "./crypto";
import { slugify } from "./utils";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// Serverless hosts (Vercel) cap request bodies at ~4.5 MB, so uploads are limited to 4 MB.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

/** Verifies the leading bytes match the declared MIME type for the formats we can sniff. */
function sniff(buffer: Buffer, mime: string) {
  const hex = buffer.subarray(0, 12).toString("hex");
  switch (mime) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e470d0a1a0a");
    case "image/webp":
      return hex.startsWith("52494646") && buffer.subarray(8, 12).toString() === "WEBP";
    case "image/avif":
      return buffer.subarray(4, 12).toString().startsWith("ftyp");
    case "application/pdf":
      return buffer.subarray(0, 5).toString() === "%PDF-";
    default:
      // Office formats: OOXML are zip containers, legacy are OLE compound files.
      return hex.startsWith("504b0304") || hex.startsWith("d0cf11e0a1b11ae1");
  }
}

export function validateFile(file: File, kind: "image" | "document" | "any") {
  const allowed = kind === "image" ? IMAGE_TYPES : kind === "document" ? DOCUMENT_TYPES : [...IMAGE_TYPES, ...DOCUMENT_TYPES];
  if (!allowed.includes(file.type)) {
    throw new UploadError(`Unsupported file type for "${file.name}".`);
  }
  const max = IMAGE_TYPES.includes(file.type) ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > max) throw new UploadError(`"${file.name}" exceeds the ${Math.round(max / 1048576)} MB limit.`);
  if (file.size === 0) throw new UploadError(`"${file.name}" is empty.`);
}

function extensionFor(file: File) {
  const fromName = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (fromName) return fromName;
  const map: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif", "application/pdf": ".pdf" };
  return map[file.type] ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary (REST API, signed requests — no SDK dependency)
// ─────────────────────────────────────────────────────────────────────────────

function cloudinarySign(params: Record<string, string | number>) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + env.storage.cloudinary.apiSecret).digest("hex");
}

function cloudinaryConfigured() {
  const c = env.storage.cloudinary;
  return Boolean(c.cloudName && c.apiKey && c.apiSecret);
}

async function cloudinaryUpload(buffer: Buffer, file: File, folder: string, visibility: MediaVisibility) {
  const c = env.storage.cloudinary;
  const resourceType = IMAGE_TYPES.includes(file.type) ? "image" : "raw";
  const timestamp = Math.floor(Date.now() / 1000);
  const base = slugify(path.parse(file.name).name) || "file";
  const publicId = `${base}-${randomToken(6)}${resourceType === "raw" ? extensionFor(file) : ""}`;
  const params = {
    folder: `${c.folder}/${folder}`,
    public_id: publicId,
    timestamp,
    type: visibility === "PRIVATE" ? "authenticated" : "upload",
  };
  const form = new FormData();
  Object.entries(params).forEach(([k, v]) => form.append(k, String(v)));
  form.append("api_key", c.apiKey);
  form.append("signature", cloudinarySign(params));
  form.append("file", new Blob([new Uint8Array(buffer)], { type: file.type }), file.name);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/upload`, { method: "POST", body: form });
  const json = (await res.json()) as {
    public_id?: string;
    secure_url?: string;
    width?: number;
    height?: number;
    error?: { message: string };
  };
  if (!res.ok || !json.public_id) throw new UploadError(json.error?.message || "Cloudinary upload failed.");
  return {
    storageKey: `${resourceType}:${params.type}:${json.public_id}`,
    url: visibility === "PUBLIC" ? json.secure_url ?? null : null,
    width: json.width ?? null,
    height: json.height ?? null,
  };
}

async function cloudinaryFetchPrivate(storageKey: string) {
  const c = env.storage.cloudinary;
  const [resourceType, type, ...rest] = storageKey.split(":");
  const publicId = rest.join(":");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp, type, expires_at: timestamp + 120 };
  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    api_key: c.apiKey,
    signature: cloudinarySign(params),
  });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/download?${qs}`);
  if (!res.ok) throw new Error(`Cloudinary download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function cloudinaryDelete(storageKey: string) {
  const c = env.storage.cloudinary;
  const [resourceType, type, ...rest] = storageKey.split(":");
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: rest.join(":"), timestamp, type };
  const form = new FormData();
  Object.entries(params).forEach(([k, v]) => form.append(k, String(v)));
  form.append("api_key", c.apiKey);
  form.append("signature", cloudinarySign(params));
  await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/destroy`, { method: "POST", body: form });
}

// ─────────────────────────────────────────────────────────────────────────────
// Local disk (development / single server)
// ─────────────────────────────────────────────────────────────────────────────

function localPath(storageKey: string) {
  const root = path.resolve(env.storage.localDir);
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

async function localUpload(buffer: Buffer, file: File, folder: string, visibility: MediaVisibility) {
  const base = slugify(path.parse(file.name).name) || "file";
  const key = `${visibility === "PRIVATE" ? "private" : "public"}/${slugify(folder) || "general"}/${base}-${randomToken(6)}${extensionFor(file)}`;
  const full = localPath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
  return {
    storageKey: key,
    url: visibility === "PUBLIC" ? `/media/${key.replace(/^public\//, "")}` : null,
    width: null,
    height: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function storeFile(
  file: File,
  opts: { folder: string; visibility: MediaVisibility; kind: "image" | "document" | "any"; uploadedById?: string | null; alt?: string | null },
): Promise<MediaAsset> {
  validateFile(file, opts.kind);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniff(buffer, file.type)) throw new UploadError(`"${file.name}" does not match its declared file type.`);

  const driver = env.storage.driver;
  if (driver === "cloudinary" && !cloudinaryConfigured()) {
    throw new UploadError("Cloudinary storage is selected but its credentials are not configured.");
  }
  if (driver === "database") {
    return db.mediaAsset.create({
      data: {
        driver: "database",
        storageKey: `db:${randomToken(9)}`,
        url: null, // always delivered through /api/files/[id]
        visibility: opts.visibility,
        mimeType: file.type,
        size: file.size,
        originalName: file.name.slice(0, 200),
        alt: opts.alt ?? null,
        folder: opts.folder,
        uploadedById: opts.uploadedById ?? null,
        blob: { create: { data: new Uint8Array(buffer) } },
      },
    });
  }
  const useCloudinary = driver === "cloudinary";
  const stored = useCloudinary
    ? await cloudinaryUpload(buffer, file, opts.folder, opts.visibility)
    : await localUpload(buffer, file, opts.folder, opts.visibility);

  return db.mediaAsset.create({
    data: {
      driver: useCloudinary ? "cloudinary" : "local",
      storageKey: stored.storageKey,
      url: stored.url,
      visibility: opts.visibility,
      mimeType: file.type,
      size: file.size,
      width: stored.width,
      height: stored.height,
      originalName: file.name.slice(0, 200),
      alt: opts.alt ?? null,
      folder: opts.folder,
      uploadedById: opts.uploadedById ?? null,
    },
  });
}

export async function readStoredFile(asset: Pick<MediaAsset, "id" | "driver" | "storageKey" | "url">) {
  if (asset.driver === "database") {
    const blob = await db.mediaBlob.findUnique({ where: { mediaId: asset.id } });
    if (!blob) throw new Error("File unavailable");
    return Buffer.from(blob.data);
  }
  if (asset.driver === "remote") {
    if (!asset.url) throw new Error("File unavailable");
    const res = await fetch(asset.url);
    if (!res.ok) throw new Error("File unavailable");
    return Buffer.from(await res.arrayBuffer());
  }
  if (asset.driver === "cloudinary") {
    const [, type] = asset.storageKey.split(":");
    if (type === "upload" && asset.url) {
      const res = await fetch(asset.url);
      if (!res.ok) throw new Error("File unavailable");
      return Buffer.from(await res.arrayBuffer());
    }
    return cloudinaryFetchPrivate(asset.storageKey);
  }
  return readFile(localPath(asset.storageKey));
}

export async function readLocalPublic(relativeKey: string) {
  return readFile(localPath(`public/${relativeKey}`));
}

export async function deleteStoredFile(asset: Pick<MediaAsset, "driver" | "storageKey">) {
  try {
    if (asset.driver === "cloudinary") await cloudinaryDelete(asset.storageKey);
    else if (asset.driver === "local") await unlink(localPath(asset.storageKey));
  } catch (err) {
    console.error("[storage] delete failed", err);
  }
}

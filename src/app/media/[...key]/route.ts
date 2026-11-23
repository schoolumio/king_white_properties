import { NextResponse } from "next/server";
import path from "node:path";
import { db } from "@/lib/db";
import { readLocalPublic } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

/** Serves PUBLIC files written by the local storage driver (development / single server). */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const rel = key.join("/");
  if (rel.includes("..")) return new NextResponse("Not found", { status: 404 });
  // A file can be made private after upload — only serve it while its record is PUBLIC.
  const asset = await db.mediaAsset.findFirst({ where: { storageKey: `public/${rel}` }, select: { visibility: true } });
  if (!asset || asset.visibility !== "PUBLIC") return new NextResponse("Not found", { status: 404 });
  try {
    const data = await readLocalPublic(rel);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

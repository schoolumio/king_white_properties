import { NextResponse, type NextRequest } from "next/server";
import { can, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { mediaUrl } from "@/lib/media";
import { storeFile, UploadError } from "@/lib/storage";
import { slugify } from "@/lib/utils";

const UPLOAD_PERMISSIONS = [
  "media.manage",
  "property.manage",
  "development.manage",
  "vehicle.manage",
  "investment.manage",
  "insights.manage",
  "publication.manage",
  "leadership.manage",
  "content.manage",
  "settings.manage",
] as const;

/** Authenticated upload endpoint used by admin media fields (one file per request). */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
  if (!can(user, [...UPLOAD_PERMISSIONS])) return NextResponse.json({ error: "You do not have permission to upload files." }, { status: 403 });

  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const kind = fd.get("kind") === "document" ? "document" : fd.get("kind") === "any" ? "any" : "image";
    const visibility = fd.get("visibility") === "PRIVATE" ? "PRIVATE" : "PUBLIC";
    const folder = slugify(String(fd.get("folder") ?? "general")) || "general";
    const asset = await storeFile(file, { folder, visibility, kind, uploadedById: user.id });
    await audit({ userId: user.id, action: "media.upload", entityType: "MediaAsset", entityId: asset.id, summary: `Uploaded ${asset.originalName}` });
    return NextResponse.json({
      id: asset.id,
      url: mediaUrl(asset),
      mimeType: asset.mimeType,
      originalName: asset.originalName,
      size: asset.size,
      visibility: asset.visibility,
    });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canViewEnquiry } from "@/lib/enquiry-access";
import { readStoredFile } from "@/lib/storage";

/**
 * Central, access-controlled file delivery.
 *  - PUBLIC assets are streamed to anyone (used for brochure/publication downloads).
 *  - PRIVATE assets require an authenticated staff session; enquiry attachments
 *    additionally require permission to view that enquiry.
 * Private files never have a public storage URL.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await db.mediaAsset.findUnique({
    where: { id },
    include: { enquiryAttachments: { include: { enquiry: { select: { category: true, assignedToId: true } } } } },
  });
  if (!asset) return new NextResponse("Not found", { status: 404 });

  if (asset.visibility === "PRIVATE") {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Not found", { status: 404 });
    const linked = asset.enquiryAttachments.map((a) => a.enquiry);
    if (linked.length && !linked.some((e) => canViewEnquiry(user, e))) return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readStoredFile(asset);
    const download = req.nextUrl.searchParams.get("download") === "1";
    const filename = asset.originalName.replace(/[^\w.\- ]+/g, "_");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(data.length),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": asset.visibility === "PUBLIC" ? "public, max-age=3600" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[files] read failed", err);
    return new NextResponse("File unavailable", { status: 404 });
  }
}

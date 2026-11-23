import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { can, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { buildEnquiryWhere } from "@/lib/enquiry-filters";
import { ENQUIRY_CATEGORIES } from "@/lib/enquiry-meta";

const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !can(user, "enquiry.export")) return new NextResponse("Forbidden", { status: 403 });
  const p = req.nextUrl.searchParams;
  const where = buildEnquiryWhere(user, {
    q: p.get("q") ?? undefined,
    category: p.get("category") ?? undefined,
    status: p.get("status") ?? undefined,
    priority: p.get("priority") ?? undefined,
    assigned: p.get("assigned") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
  });
  const rows = await db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 10000, include: { assignedTo: { select: { name: true } } } });
  const header = ["Reference", "Category", "Status", "Priority", "Name", "Organisation", "Email", "Phone", "Country", "Subject", "Assigned to", "Submitted"];
  const lines = [header.map(cell).join(",")].concat(
    rows.map((e) =>
      [e.reference, ENQUIRY_CATEGORIES[e.category].label, e.status, e.priority, e.name, e.organisation, e.email, e.phone, e.country, e.subject, e.assignedTo?.name, e.createdAt.toISOString()].map(cell).join(","),
    ),
  );
  await audit({ userId: user.id, action: "enquiry.export", summary: `Exported ${rows.length} enquiries to CSV` });
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

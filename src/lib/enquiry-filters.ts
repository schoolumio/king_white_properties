import "server-only";
import type { EnquiryCategory, EnquiryPriority, EnquiryStatus, Prisma } from "@prisma/client";
import type { CurrentUser } from "./auth";
import { enquiryScope } from "./enquiry-access";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES, OPEN_STATUSES, PRIORITIES } from "./enquiry-meta";

export type EnquiryFilterValues = { q?: string; category?: string; status?: string; priority?: string; assigned?: string; from?: string; to?: string };

export function buildEnquiryWhere(user: CurrentUser, v: EnquiryFilterValues): Prisma.EnquiryWhereInput {
  const and: Prisma.EnquiryWhereInput[] = [enquiryScope(user)];
  if (v.category && v.category in ENQUIRY_CATEGORIES) and.push({ category: v.category as EnquiryCategory });
  if (v.status === "OPEN") and.push({ status: { in: OPEN_STATUSES } });
  else if (v.status && ENQUIRY_STATUSES.some((s) => s.value === v.status)) and.push({ status: v.status as EnquiryStatus });
  if (v.priority && PRIORITIES.some((p) => p.value === v.priority)) and.push({ priority: v.priority as EnquiryPriority });
  if (v.assigned === "me") and.push({ assignedToId: user.id });
  else if (v.assigned === "none") and.push({ assignedToId: null });
  else if (v.assigned) and.push({ assignedToId: v.assigned });
  if (v.from) and.push({ createdAt: { gte: new Date(v.from) } });
  if (v.to) and.push({ createdAt: { lte: new Date(new Date(v.to).getTime() + 86400000) } });
  if (v.q) {
    const q = v.q.slice(0, 80);
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { organisation: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  return { AND: and };
}

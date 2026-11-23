import "server-only";
import type { EnquiryCategory, Prisma } from "@prisma/client";
import { can, type CurrentUser } from "./auth";
import { ENQUIRY_CATEGORIES, ENQUIRY_CATEGORY_KEYS } from "./enquiry-meta";

/** Enquiry categories a user may see across the CRM. */
export function visibleCategories(user: CurrentUser): EnquiryCategory[] {
  if (can(user, "enquiry.view_all")) return ENQUIRY_CATEGORY_KEYS;
  return ENQUIRY_CATEGORY_KEYS.filter((c) => can(user, ENQUIRY_CATEGORIES[c].viewPermission));
}

/** Prisma filter that restricts enquiries to what the user is allowed to see. */
export function enquiryScope(user: CurrentUser): Prisma.EnquiryWhereInput {
  if (can(user, "enquiry.view_all")) return {};
  const cats = visibleCategories(user);
  const or: Prisma.EnquiryWhereInput[] = [];
  if (cats.length) or.push({ category: { in: cats } });
  if (can(user, "enquiry.view_assigned")) or.push({ assignedToId: user.id });
  if (!or.length) return { id: "__none__" };
  return { OR: or };
}

export function canViewEnquiry(user: CurrentUser, enquiry: { category: EnquiryCategory; assignedToId: string | null }) {
  if (can(user, "enquiry.view_all")) return true;
  if (visibleCategories(user).includes(enquiry.category)) return true;
  return can(user, "enquiry.view_assigned") && enquiry.assignedToId === user.id;
}

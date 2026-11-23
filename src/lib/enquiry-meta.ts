import type { EnquiryCategory, EnquiryPriority, EnquiryStatus } from "@prisma/client";
import type { PermissionKey } from "./permissions";

export const ENQUIRY_CATEGORIES: Record<
  EnquiryCategory,
  { label: string; prefix: string; division: "real-estate" | "automotive" | null; viewPermission: PermissionKey }
> = {
  PROPERTY: { label: "Property enquiry", prefix: "PRP", division: "real-estate", viewPermission: "enquiry.view_real_estate" },
  PROPERTY_INSPECTION: { label: "Property inspection", prefix: "INS", division: "real-estate", viewPermission: "enquiry.view_real_estate" },
  DEVELOPMENT: { label: "Development enquiry", prefix: "DEV", division: "real-estate", viewPermission: "enquiry.view_real_estate" },
  AUTOMOTIVE: { label: "Automotive enquiry", prefix: "AUT", division: "automotive", viewPermission: "enquiry.view_automotive" },
  TEST_DRIVE: { label: "Test drive / inspection", prefix: "TDR", division: "automotive", viewPermission: "enquiry.view_automotive" },
  VEHICLE_SOURCING: { label: "Vehicle sourcing", prefix: "SRC", division: "automotive", viewPermission: "enquiry.view_automotive" },
  FLEET: { label: "Fleet enquiry", prefix: "FLT", division: "automotive", viewPermission: "enquiry.view_automotive" },
  INVESTMENT: { label: "Investment enquiry", prefix: "INV", division: null, viewPermission: "enquiry.view_corporate" },
  PARTNERSHIP: { label: "Partnership proposal", prefix: "PTN", division: null, viewPermission: "enquiry.view_corporate" },
  GENERAL: { label: "General corporate enquiry", prefix: "GEN", division: null, viewPermission: "enquiry.view_corporate" },
};

export const ENQUIRY_CATEGORY_KEYS = Object.keys(ENQUIRY_CATEGORIES) as EnquiryCategory[];

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string; tone: string }[] = [
  { value: "NEW", label: "New", tone: "bg-gold/15 text-[#7a6235]" },
  { value: "CONTACTED", label: "Contacted", tone: "bg-sky-100 text-sky-800" },
  { value: "UNDER_REVIEW", label: "Under Review", tone: "bg-indigo-100 text-indigo-800" },
  { value: "QUALIFIED", label: "Qualified", tone: "bg-emerald-100 text-emerald-800" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent", tone: "bg-violet-100 text-violet-800" },
  { value: "NEGOTIATION", label: "Negotiation", tone: "bg-amber-100 text-amber-800" },
  { value: "CONVERTED", label: "Converted", tone: "bg-emerald-600 text-white" },
  { value: "CLOSED", label: "Closed", tone: "bg-slate-200 text-slate-700" },
  { value: "REJECTED", label: "Rejected", tone: "bg-rose-100 text-rose-800" },
];

export const OPEN_STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "UNDER_REVIEW", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"];

export const PRIORITIES: { value: EnquiryPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function statusMeta(status: EnquiryStatus) {
  return ENQUIRY_STATUSES.find((s) => s.value === status) ?? ENQUIRY_STATUSES[0];
}

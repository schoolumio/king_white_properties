"use server";

import type { EnquiryCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { createEnquiry, type NewEnquiry } from "@/lib/enquiries";
import { FORM_SCHEMAS, PARTNERSHIP_DOCUMENT_MAX, PARTNERSHIP_DOCUMENT_TYPES, type FormType } from "@/lib/forms";
import { clientContext } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { storeFile, UploadError } from "@/lib/storage";

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const MIN_FILL_MS = 2500;

export async function submitEnquiry(formType: FormType, formData: FormData): Promise<SubmitResult> {
  const schema = FORM_SCHEMAS[formType];
  if (!schema) return { ok: false, error: "Unknown form." };

  // ── Spam protection: honeypot, minimum completion time, per-IP rate limit
  if (String(formData.get("company_website") ?? "").length > 0) {
    return { ok: false, error: "Your submission could not be accepted." };
  }
  const startedAt = Number(formData.get("_startedAt") ?? 0);
  if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
    return { ok: false, error: "Please take a moment to review your details, then submit again." };
  }
  const ctx = await clientContext();
  const limited = await rateLimit(`enquiry:${ctx.ipHash ?? "unknown"}`, 6, 600);
  if (!limited.ok) {
    return { ok: false, error: "We have received several submissions from your connection. Please try again in a few minutes." };
  }

  // ── Validation
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_") || key === "company_website" || value instanceof File) continue;
    raw[key] = value;
  }
  raw.consent = raw.consent === "true" || raw.consent === "on";
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }
  const v = parsed.data as Record<string, string | boolean | undefined>;
  const s = (k: string) => (typeof v[k] === "string" && v[k] ? (v[k] as string) : null);
  const sourcePath = String(formData.get("_path") ?? "") || ctx.referer;

  try {
    const base = {
      name: s("name")!,
      email: s("email")!,
      phone: s("phone"),
      organisation: s("organisation"),
      position: s("position"),
      country: s("country"),
      message: s("message"),
      consent: true,
      sourcePath,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
    };
    let input: NewEnquiry;
    const relatedId = s("relatedId");

    switch (formType) {
      case "general": {
        const map: Record<string, EnquiryCategory> = { GENERAL: "GENERAL", PROPERTY: "PROPERTY", AUTOMOTIVE: "AUTOMOTIVE", INVESTMENT: "INVESTMENT" };
        input = { ...base, category: map[s("topic") ?? "GENERAL"] ?? "GENERAL", subject: s("subject") };
        break;
      }
      case "property":
      case "inspection": {
        const property = relatedId
          ? await db.property.findFirst({ where: { id: relatedId, publishStatus: "PUBLISHED" }, select: { id: true, title: true } })
          : null;
        if (!property) return { ok: false, error: "This property is no longer available for enquiries." };
        if (formType === "property") {
          input = { ...base, category: "PROPERTY", propertyId: property.id, subject: `Enquiry: ${property.title}`, summaryRows: [["Property", property.title]] };
        } else {
          const date = s("preferredDate");
          input = {
            ...base,
            category: "PROPERTY_INSPECTION",
            propertyId: property.id,
            subject: `Inspection request: ${property.title}`,
            inspection: {
              type: "PROPERTY_INSPECTION",
              preferredDate: date ? new Date(date) : null,
              preferredTime: s("preferredTime"),
              attendees: s("attendees") ? Number(s("attendees")) : null,
            },
            summaryRows: [
              ["Property", property.title],
              ["Preferred date", date ?? ""],
              ["Preferred time", s("preferredTime") ?? ""],
            ],
          };
        }
        break;
      }
      case "development": {
        const project = relatedId
          ? await db.developmentProject.findFirst({ where: { id: relatedId, publishStatus: "PUBLISHED" }, select: { id: true, name: true } })
          : null;
        if (!project) return { ok: false, error: "This development is no longer available for enquiries." };
        const interest = s("interest") ?? "INFORMATION";
        const category: EnquiryCategory = interest === "INVESTMENT" ? "INVESTMENT" : interest === "PARTNERSHIP" ? "PARTNERSHIP" : "DEVELOPMENT";
        input = {
          ...base,
          category,
          projectId: project.id,
          subject: `${project.name} — ${interest.toLowerCase()} enquiry`,
          metadata: { interest },
          summaryRows: [
            ["Development", project.name],
            ["Interest", interest],
          ],
        };
        break;
      }
      case "vehicle":
      case "testDrive": {
        const vehicle = relatedId
          ? await db.vehicle.findFirst({
              where: { id: relatedId, publishStatus: "PUBLISHED" },
              select: { id: true, make: true, model: true, year: true },
            })
          : null;
        if (!vehicle) return { ok: false, error: "This vehicle is no longer available for enquiries." };
        const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        if (formType === "vehicle") {
          input = { ...base, category: "AUTOMOTIVE", vehicleId: vehicle.id, subject: `Enquiry: ${label}`, summaryRows: [["Vehicle", label]] };
        } else {
          const type = s("requestType") === "VEHICLE_INSPECTION" ? "VEHICLE_INSPECTION" : "TEST_DRIVE";
          const date = s("preferredDate");
          input = {
            ...base,
            category: "TEST_DRIVE",
            vehicleId: vehicle.id,
            subject: `${type === "TEST_DRIVE" ? "Test drive" : "Inspection"} request: ${label}`,
            inspection: { type, preferredDate: date ? new Date(date) : null, preferredTime: s("preferredTime") },
            summaryRows: [
              ["Vehicle", label],
              ["Request", type === "TEST_DRIVE" ? "Test drive" : "Vehicle inspection"],
              ["Preferred date", date ?? ""],
              ["Preferred time", s("preferredTime") ?? ""],
            ],
          };
        }
        break;
      }
      case "fleet": {
        const quantity = Number(s("quantity"));
        input = {
          ...base,
          category: "FLEET",
          subject: `Fleet request — ${s("organisation")}`,
          priority: quantity >= 10 ? "HIGH" : "NORMAL",
          fleet: {
            organisationName: s("organisation")!,
            vehicleCategory: s("vehicleCategory")!,
            quantity,
            budgetRange: s("budgetRange"),
            procurementTimeline: s("timeline"),
            acquisitionMode: s("acquisitionMode"),
            requirements: s("message"),
          },
          summaryRows: [
            ["Vehicle category", s("vehicleCategory") ?? ""],
            ["Quantity", String(quantity)],
            ["Budget range", s("budgetRange") ?? ""],
            ["Timeline", s("timeline") ?? ""],
            ["Acquisition", s("acquisitionMode") ?? ""],
          ],
        };
        break;
      }
      case "sourcing": {
        const yearFrom = s("yearFrom") ? Number(s("yearFrom")) : null;
        const yearTo = s("yearTo") ? Number(s("yearTo")) : null;
        if (yearFrom && yearTo && yearFrom > yearTo) {
          return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: { yearTo: "Must be after the start year" } };
        }
        input = {
          ...base,
          category: "VEHICLE_SOURCING",
          subject: `Sourcing request — ${s("make")} ${s("model")}`,
          sourcing: {
            make: s("make")!,
            model: s("model")!,
            yearFrom,
            yearTo,
            budget: s("budget"),
            conditionPreference: s("condition"),
            countryPreference: s("country"),
            specifications: s("message"),
          },
          country: null,
          summaryRows: [
            ["Vehicle", `${s("make")} ${s("model")}`],
            ["Years", [yearFrom, yearTo].filter(Boolean).join(" – ")],
            ["Budget", s("budget") ?? ""],
            ["Condition", s("condition") ?? ""],
            ["Country preference", s("country") ?? ""],
          ],
        };
        break;
      }
      case "investment": {
        const opportunity = relatedId
          ? await db.investmentOpportunity.findFirst({ where: { id: relatedId, publishStatus: "PUBLISHED" }, select: { id: true, title: true } })
          : null;
        input = {
          ...base,
          category: "INVESTMENT",
          opportunityId: opportunity?.id ?? null,
          subject: opportunity ? `Investment enquiry: ${opportunity.title}` : `Investment enquiry — ${s("investorType")}`,
          priority: "HIGH",
          metadata: { investorType: s("investorType"), interest: s("interest"), indicativeRange: s("indicativeRange") },
          summaryRows: [
            ["Opportunity", opportunity?.title ?? s("interest") ?? "General"],
            ["Investor type", s("investorType") ?? ""],
            ["Indicative range", s("indicativeRange") ?? ""],
            ["Country", s("country") ?? ""],
          ],
        };
        break;
      }
      case "partnership": {
        const attachmentIds: string[] = [];
        const file = formData.get("document");
        if (file instanceof File && file.size > 0) {
          if (!PARTNERSHIP_DOCUMENT_TYPES.includes(file.type)) {
            return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: { document: "Upload a PDF, Word or PowerPoint document" } };
          }
          if (file.size > PARTNERSHIP_DOCUMENT_MAX) {
            return { ok: false, error: "Please correct the highlighted fields.", fieldErrors: { document: "The document must be 10 MB or smaller" } };
          }
          const asset = await storeFile(file, { folder: "enquiries", visibility: "PRIVATE", kind: "document" });
          attachmentIds.push(asset.id);
        }
        input = {
          ...base,
          category: "PARTNERSHIP",
          subject: `Partnership proposal — ${s("organisation")}`,
          priority: "HIGH",
          attachmentIds,
          partnership: {
            organisationName: s("organisation")!,
            organisationType: s("organisationType")!,
            category: s("category")!,
            proposalSummary: s("message")!,
            estimatedValue: s("estimatedValue"),
          },
          summaryRows: [
            ["Organisation type", s("organisationType") ?? ""],
            ["Position", s("position") ?? ""],
            ["Country", s("country") ?? ""],
            ["Category", s("category") ?? ""],
            ["Estimated value", s("estimatedValue") ?? ""],
            ["Supporting document", attachmentIds.length ? "Attached (available in admin portal)" : "None"],
          ],
        };
        break;
      }
      default:
        return { ok: false, error: "Unknown form." };
    }

    const enquiry = await createEnquiry(input);
    return { ok: true, reference: enquiry.reference };
  } catch (err) {
    if (err instanceof UploadError) return { ok: false, error: err.message, fieldErrors: { document: err.message } };
    console.error("[enquiry] submission failed", err);
    return { ok: false, error: "We could not record your submission due to a technical problem. Please try again, or contact us directly." };
  }
}

import "server-only";
import { Prisma, type EnquiryCategory } from "@prisma/client";
import { db } from "./db";
import { env } from "./env";
import { referenceSuffix } from "./crypto";
import { ENQUIRY_CATEGORIES } from "./enquiry-meta";
import { getContent, getSite } from "./content";
import { renderEmail, sendEmail } from "./email";

export type NewEnquiry = {
  category: EnquiryCategory;
  name: string;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  position?: string | null;
  country?: string | null;
  subject?: string | null;
  message?: string | null;
  consent: boolean;
  propertyId?: string | null;
  projectId?: string | null;
  vehicleId?: string | null;
  opportunityId?: string | null;
  sourcePath?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  attachmentIds?: string[];
  inspection?: Omit<Prisma.InspectionRequestCreateWithoutEnquiryInput, never>;
  fleet?: Prisma.FleetRequestCreateWithoutEnquiryInput;
  sourcing?: Prisma.VehicleSourcingRequestCreateWithoutEnquiryInput;
  partnership?: Prisma.PartnershipProposalCreateWithoutEnquiryInput;
  /** Extra rows for the notification email. */
  summaryRows?: [string, string][];
};

function makeReference(category: EnquiryCategory) {
  const now = new Date();
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${ENQUIRY_CATEGORIES[category].prefix}-${yymm}-${referenceSuffix(5)}`;
}

/**
 * Persists an enquiry (and its typed detail record) atomically and returns its
 * reference. Notifications are dispatched only after the database commit.
 */
export async function createEnquiry(input: NewEnquiry) {
  const meta = ENQUIRY_CATEGORIES[input.category];
  const division = meta.division ? await db.division.findUnique({ where: { slug: meta.division } }) : null;

  let enquiry: { id: string; reference: string } | null = null;
  for (let attempt = 0; attempt < 5 && !enquiry; attempt++) {
    try {
      enquiry = await db.$transaction(async (tx) => {
        const created = await tx.enquiry.create({
          data: {
            reference: makeReference(input.category),
            category: input.category,
            priority: input.priority ?? "NORMAL",
            divisionId: division?.id,
            name: input.name,
            email: input.email.toLowerCase(),
            phone: input.phone || null,
            organisation: input.organisation || null,
            position: input.position || null,
            country: input.country || null,
            subject: input.subject || null,
            message: input.message || null,
            consent: input.consent,
            propertyId: input.propertyId || null,
            projectId: input.projectId || null,
            vehicleId: input.vehicleId || null,
            opportunityId: input.opportunityId || null,
            sourcePath: input.sourcePath?.slice(0, 300) || null,
            ipHash: input.ipHash,
            userAgent: input.userAgent,
            metadata: input.metadata,
            inspection: input.inspection ? { create: input.inspection } : undefined,
            fleetRequest: input.fleet ? { create: input.fleet } : undefined,
            sourcing: input.sourcing ? { create: input.sourcing } : undefined,
            partnership: input.partnership ? { create: input.partnership } : undefined,
            activities: { create: { type: "CREATED", message: `${meta.label} submitted via website` } },
            attachments: input.attachmentIds?.length
              ? { create: input.attachmentIds.map((mediaId) => ({ mediaId })) }
              : undefined,
          },
          select: { id: true, reference: true },
        });
        return created;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue; // reference collision
      throw err;
    }
  }
  if (!enquiry) throw new Error("Could not allocate an enquiry reference.");

  // Fire-and-forget would risk being cut off in serverless runtimes; await but never fail the submission.
  try {
    await notifyNewEnquiry(enquiry, input);
  } catch (err) {
    console.error("[enquiry] notification failed", err);
  }
  return enquiry;
}

const RECIPIENT_GROUP: Record<EnquiryCategory, string> = {
  PROPERTY: "realEstate",
  PROPERTY_INSPECTION: "realEstate",
  DEVELOPMENT: "realEstate",
  AUTOMOTIVE: "automotive",
  TEST_DRIVE: "automotive",
  VEHICLE_SOURCING: "automotive",
  FLEET: "fleet",
  INVESTMENT: "investment",
  PARTNERSHIP: "partnership",
  GENERAL: "general",
};

async function notifyNewEnquiry(enquiry: { id: string; reference: string }, input: NewEnquiry) {
  const [site, settings] = await Promise.all([getSite(), getContent<Record<string, unknown>>("notifications")]);
  const meta = ENQUIRY_CATEGORIES[input.category];
  const group = (settings[RECIPIENT_GROUP[input.category]] as string[] | undefined) ?? [];
  const defaults = (settings.defaultRecipients as string[] | undefined) ?? [];
  const recipients = [...group, ...defaults].filter((e) => /.+@.+\..+/.test(e));

  if (recipients.length) {
    const { html, text } = renderEmail({
      company: site.companyName,
      heading: `New ${meta.label.toLowerCase()} — ${enquiry.reference}`,
      intro: "A new submission has been received through the website and recorded in the enquiry management system.",
      rows: [
        ["Reference", enquiry.reference],
        ["Category", meta.label],
        ["Name", input.name],
        ["Organisation", input.organisation ?? ""],
        ["Email", input.email],
        ["Telephone", input.phone ?? ""],
        ...(input.summaryRows ?? []),
        ["Message", input.message ?? ""],
      ],
      ctaLabel: "Open in admin portal",
      ctaUrl: `${env.siteUrl}/admin/enquiries/${enquiry.id}`,
      footer: "Confidential — internal notification.",
    });
    await sendEmail({ to: recipients, subject: `[${enquiry.reference}] New ${meta.label.toLowerCase()}`, html, text, replyTo: input.email }, { enquiryId: enquiry.id });
  }

  if (settings.acknowledge) {
    const { html, text } = renderEmail({
      company: site.companyName,
      heading: "Thank you — we have received your enquiry",
      intro: `Dear ${input.name}, your ${meta.label.toLowerCase()} has been received. Please quote the reference below in any correspondence. A member of our team will be in touch.`,
      rows: [["Reference", enquiry.reference]],
      footer: [site.companyName, site.email, site.phone].filter(Boolean).join(" · "),
    });
    await sendEmail({ to: [input.email], subject: `We have received your enquiry (${enquiry.reference})`, html, text }, { enquiryId: enquiry.id });
  }
}

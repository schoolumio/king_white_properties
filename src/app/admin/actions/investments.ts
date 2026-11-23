"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize, can } from "@/lib/auth";
import { fd, handleActionError, parseMedia, refresh, uniqueSlug } from "@/lib/admin-form";
import { CURRENCIES } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { ActionState } from "./types";

const schema = z.object({
  title: z.string().min(3, "Enter a title").max(160),
  summary: z.string().min(10, "Enter a summary").max(500),
  description: z.string().min(10, "Enter a description").max(20000),
  sector: z.enum(["REAL_ESTATE", "INFRASTRUCTURE", "AUTOMOTIVE", "CORPORATE"]),
  status: z.enum(["COMING_SOON", "OPEN", "UNDER_REVIEW", "FULLY_SUBSCRIBED", "CLOSED"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  currency: z.enum(CURRENCIES),
});

export async function saveOpportunity(_prev: ActionState, f: FormData): Promise<ActionState> {
  let id = fd.opt(f, "id");
  try {
    const user = await authorize("investment.manage");
    const base = schema.parse({
      title: fd.str(f, "title"),
      summary: fd.str(f, "summary"),
      description: fd.str(f, "description"),
      sector: fd.str(f, "sector"),
      status: fd.str(f, "status"),
      publishStatus: fd.str(f, "publishStatus") || "DRAFT",
      currency: fd.str(f, "currency") || "NGN",
    });
    const existing = id ? await db.investmentOpportunity.findUnique({ where: { id } }) : null;
    const requested = slugify(fd.str(f, "slug") || base.title);
    const slug = existing?.slug === requested ? requested : await uniqueSlug(requested, async (s) => !!(await db.investmentOpportunity.findFirst({ where: { slug: s, NOT: id ? { id } : undefined } })));

    const termsSummary = fd.opt(f, "termsSummary");
    const minimumParticipation = fd.num(f, "minimumParticipation");
    // Any change to commercial terms revokes prior approval.
    const termsChanged = !existing || existing.termsSummary !== termsSummary || (existing.minimumParticipation?.toString() ?? null) !== (minimumParticipation?.toString() ?? null) || existing.currency !== base.currency;
    const cover = await parseMedia(f, "cover");
    const documents = await parseMedia(f, "documents");

    const data: Prisma.InvestmentOpportunityUncheckedCreateInput = {
      ...base,
      slug,
      investmentStructure: fd.opt(f, "investmentStructure"),
      locationId: fd.opt(f, "locationId"),
      projectId: fd.opt(f, "projectId"),
      coverId: cover[0]?.mediaId ?? null,
      termsSummary,
      minimumParticipation,
      disclaimer: fd.opt(f, "disclaimer"),
      featured: fd.bool(f, "featured"),
      ...(termsChanged ? { termsApproved: false, approvedById: null, approvedAt: null } : {}),
      publishedAt: base.publishStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };
    const saved = await db.$transaction(async (tx) => {
      const o = id ? await tx.investmentOpportunity.update({ where: { id }, data }) : await tx.investmentOpportunity.create({ data });
      await tx.investmentDocument.deleteMany({ where: { opportunityId: o.id } });
      if (documents.length) await tx.investmentDocument.createMany({ data: documents.map((m, i) => ({ opportunityId: o.id, mediaId: m.mediaId, title: m.title || "Document", access: m.flag ? "PUBLIC" : "ON_REQUEST", order: i })) });
      return o;
    });
    // Visibility follows the access flag. Files are always delivered through /api/files,
    // which refuses PRIVATE assets to anyone without a staff session.
    const onRequest = documents.filter((d) => !d.flag).map((d) => d.mediaId);
    const publicDocs = documents.filter((d) => d.flag).map((d) => d.mediaId);
    if (onRequest.length) await db.mediaAsset.updateMany({ where: { id: { in: onRequest } }, data: { visibility: "PRIVATE", url: null } });
    if (publicDocs.length) await db.mediaAsset.updateMany({ where: { id: { in: publicDocs } }, data: { visibility: "PUBLIC", url: null } });

    await audit({ userId: user.id, action: id ? "investment.update" : "investment.create", entityType: "InvestmentOpportunity", entityId: saved.id, summary: `${id ? "Updated" : "Created"} opportunity “${saved.title}”${termsChanged && existing?.termsApproved ? " (terms approval revoked)" : ""}` });
    refresh("/investments", "/real-estate/investment-opportunities");
    if (id) return { success: termsChanged && existing?.termsApproved ? "Saved. Commercial terms changed, so approval has been revoked." : "Opportunity saved." };
    id = saved.id;
  } catch (err) {
    return handleActionError(err);
  }
  redirect(`/admin/investments/${id}?created=1`);
}

export async function opportunityCommand(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const op = String(f.get("op"));
    const user = await authorize(op === "approve" || op === "revoke" ? "investment.approve" : "investment.manage");
    const id = z.string().parse(f.get("id"));
    const o = await db.investmentOpportunity.findUniqueOrThrow({ where: { id } });
    if (op === "approve") {
      if (!o.termsSummary && !o.minimumParticipation) return { error: "There are no commercial terms to approve." };
      await db.investmentOpportunity.update({ where: { id }, data: { termsApproved: true, approvedById: user.id, approvedAt: new Date() } });
      await audit({ userId: user.id, action: "investment.approve_terms", entityType: "InvestmentOpportunity", entityId: id, summary: `Approved published terms for “${o.title}”` });
    } else if (op === "revoke") {
      await db.investmentOpportunity.update({ where: { id }, data: { termsApproved: false, approvedById: null, approvedAt: null } });
      await audit({ userId: user.id, action: "investment.revoke_terms", entityType: "InvestmentOpportunity", entityId: id, summary: `Revoked terms approval for “${o.title}”` });
    } else if (op === "delete") {
      const linked = await db.enquiry.count({ where: { opportunityId: id } });
      if (linked) return { error: `This opportunity has ${linked} linked enquiries. Archive it instead.` };
      await db.investmentOpportunity.delete({ where: { id } });
      await audit({ userId: user.id, action: "investment.delete", entityType: "InvestmentOpportunity", entityId: id, summary: `Deleted opportunity “${o.title}”` });
      refresh("/investments");
      redirect("/admin/investments");
    } else {
      const map = { publish: "PUBLISHED", unpublish: "DRAFT", archive: "ARCHIVED" } as const;
      const next = map[op as keyof typeof map];
      if (!next) return { error: "Unknown action." };
      if (next === "PUBLISHED" && (o.termsSummary || o.minimumParticipation) && !o.termsApproved && !can(user, "investment.approve")) {
        // Allowed: unapproved terms are simply withheld from the public page.
      }
      await db.investmentOpportunity.update({ where: { id }, data: { publishStatus: next, publishedAt: next === "PUBLISHED" ? (o.publishedAt ?? new Date()) : o.publishedAt } });
      await audit({ userId: user.id, action: `investment.${op}`, entityType: "InvestmentOpportunity", entityId: id, summary: `Set opportunity “${o.title}” to ${next.toLowerCase()}` });
    }
    refresh("/investments", "/real-estate/investment-opportunities");
    return { success: "Opportunity updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

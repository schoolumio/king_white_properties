"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { fd, handleActionError, parseMedia, refresh, syncDocumentVisibility, uniqueSlug } from "@/lib/admin-form";
import { CURRENCIES } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { ActionState } from "./types";

const schema = z.object({
  name: z.string().min(3, "Enter a project name").max(160),
  summary: z.string().min(10, "Enter a short summary").max(400),
  overview: z.string().min(10, "Enter a project overview").max(20000),
  sector: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND", "MIXED_USE"]),
  status: z.enum(["UPCOMING", "UNDER_DEVELOPMENT", "COMPLETED", "AVAILABLE_FOR_ACQUISITION"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function saveDevelopment(_prev: ActionState, f: FormData): Promise<ActionState> {
  let id = fd.opt(f, "id");
  try {
    const user = await authorize("development.manage");
    const base = schema.parse({
      name: fd.str(f, "name"),
      summary: fd.str(f, "summary"),
      overview: fd.str(f, "overview"),
      sector: fd.str(f, "sector"),
      status: fd.str(f, "status"),
      publishStatus: fd.str(f, "publishStatus") || "DRAFT",
    });
    const progress = fd.int(f, "progressPercent");
    if (progress !== null && (progress < 0 || progress > 100)) return { error: "Progress must be between 0 and 100.", fieldErrors: { progressPercent: "0 – 100" } };
    const existing = id ? await db.developmentProject.findUnique({ where: { id }, select: { slug: true, publishedAt: true } }) : null;
    const requested = slugify(fd.str(f, "slug") || base.name);
    const slug = existing?.slug === requested ? requested : await uniqueSlug(requested, async (s) => !!(await db.developmentProject.findFirst({ where: { slug: s, NOT: id ? { id } : undefined } })));

    const data: Prisma.DevelopmentProjectUncheckedCreateInput = {
      ...base,
      slug,
      projectType: fd.opt(f, "projectType"),
      currentStage: fd.opt(f, "currentStage"),
      progressPercent: progress,
      locationId: fd.opt(f, "locationId"),
      address: fd.opt(f, "address"),
      latitude: fd.num(f, "latitude"),
      longitude: fd.num(f, "longitude"),
      developerInfo: fd.opt(f, "developerInfo"),
      siteAreaSqm: fd.num(f, "siteAreaSqm"),
      totalUnits: fd.int(f, "totalUnits"),
      startDate: fd.date(f, "startDate"),
      completionDate: fd.date(f, "completionDate"),
      featured: fd.bool(f, "featured"),
      metaTitle: fd.opt(f, "metaTitle"),
      metaDescription: fd.opt(f, "metaDescription"),
      publishedAt: base.publishStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };
    const gallery = await parseMedia(f, "gallery");
    const masterplans = await parseMedia(f, "masterplans");
    const documents = await parseMedia(f, "documents");

    const saved = await db.$transaction(async (tx) => {
      const p = id ? await tx.developmentProject.update({ where: { id }, data }) : await tx.developmentProject.create({ data });
      await tx.projectMedia.deleteMany({ where: { projectId: p.id } });
      const media = [
        ...gallery.map((m, i) => ({ projectId: p.id, mediaId: m.mediaId, caption: m.alt || null, kind: "GALLERY" as const, order: i })),
        ...masterplans.map((m, i) => ({ projectId: p.id, mediaId: m.mediaId, caption: m.alt || null, kind: "MASTERPLAN" as const, order: i })),
      ];
      if (media.length) await tx.projectMedia.createMany({ data: media });
      await tx.projectDocument.deleteMany({ where: { projectId: p.id } });
      if (documents.length) await tx.projectDocument.createMany({ data: documents.map((m, i) => ({ projectId: p.id, mediaId: m.mediaId, title: m.title || "Document", isPublic: m.flag !== false, order: i })) });
      return p;
    });
    await syncDocumentVisibility(documents);
    await audit({ userId: user.id, action: id ? "development.update" : "development.create", entityType: "DevelopmentProject", entityId: saved.id, summary: `${id ? "Updated" : "Created"} development “${saved.name}”` });
    refresh("/real-estate/developments", `/real-estate/developments/${saved.slug}`);
    if (id) return { success: "Development saved." };
    id = saved.id;
  } catch (err) {
    return handleActionError(err);
  }
  redirect(`/admin/developments/${id}?created=1`);
}

const PAST = { publish: "Published", unpublish: "Unpublished", archive: "Archived" } as const;

export async function developmentCommand(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("development.manage");
    const id = z.string().parse(f.get("id"));
    const op = String(f.get("op"));
    const p = await db.developmentProject.findUniqueOrThrow({ where: { id } });
    if (op === "delete") {
      const linked = await db.enquiry.count({ where: { projectId: id } });
      if (linked) return { error: `This development has ${linked} linked enquiries. Archive it instead.` };
      await db.developmentProject.delete({ where: { id } });
      await audit({ userId: user.id, action: "development.delete", entityType: "DevelopmentProject", entityId: id, summary: `Deleted development “${p.name}”` });
      refresh("/real-estate/developments");
    } else {
      const map = { publish: "PUBLISHED", unpublish: "DRAFT", archive: "ARCHIVED" } as const;
      const next = map[op as keyof typeof map];
      if (!next) return { error: "Unknown action." };
      await db.developmentProject.update({ where: { id }, data: { publishStatus: next, publishedAt: next === "PUBLISHED" ? (p.publishedAt ?? new Date()) : p.publishedAt } });
      await audit({ userId: user.id, action: `development.${op}`, entityType: "DevelopmentProject", entityId: id, summary: `${PAST[op as keyof typeof PAST]} development “${p.name}”` });
      refresh("/real-estate/developments", `/real-estate/developments/${p.slug}`);
      return { success: `Development ${next.toLowerCase()}.` };
    }
  } catch (err) {
    return handleActionError(err);
  }
  redirect("/admin/developments");
}

export async function saveUnit(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("development.manage");
    const projectId = z.string().parse(f.get("projectId"));
    const unitId = fd.opt(f, "unitId");
    if (f.get("op") === "delete" && unitId) {
      await db.developmentUnit.delete({ where: { id: unitId } });
      await audit({ userId: user.id, action: "development.unit_delete", entityType: "DevelopmentProject", entityId: projectId, summary: "Removed a unit type" });
    } else {
      const name = z.string().min(1, "Enter a unit name").max(120).parse(fd.str(f, "name"));
      const data = {
        name,
        bedrooms: fd.int(f, "bedrooms"),
        floorAreaSqm: fd.num(f, "floorAreaSqm"),
        price: fd.num(f, "price"),
        currency: z.enum(CURRENCIES).parse(fd.str(f, "currency") || "NGN"),
        priceOnRequest: fd.bool(f, "priceOnRequest") || fd.num(f, "price") === null,
        totalUnits: fd.int(f, "totalUnits"),
        availableUnits: fd.int(f, "availableUnits"),
        status: z.enum(["AVAILABLE", "LIMITED", "SOLD_OUT", "COMING_SOON"]).parse(fd.str(f, "status") || "AVAILABLE"),
        order: fd.int(f, "order") ?? 0,
      };
      if (data.totalUnits !== null && data.availableUnits !== null && data.availableUnits > data.totalUnits) return { error: "Available units cannot exceed total units." };
      if (unitId) await db.developmentUnit.update({ where: { id: unitId }, data });
      else await db.developmentUnit.create({ data: { ...data, projectId } });
      await audit({ userId: user.id, action: "development.unit_save", entityType: "DevelopmentProject", entityId: projectId, summary: `Saved unit type “${name}”` });
    }
    const p = await db.developmentProject.findUnique({ where: { id: projectId }, select: { slug: true } });
    refresh(`/admin/developments/${projectId}`, p ? `/real-estate/developments/${p.slug}` : "/");
    return { success: "Unit availability updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveProjectUpdate(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("development.manage");
    const projectId = z.string().parse(f.get("projectId"));
    const updateId = fd.opt(f, "updateId");
    if (f.get("op") === "delete" && updateId) {
      await db.projectUpdate.delete({ where: { id: updateId } });
    } else {
      const title = z.string().min(3, "Enter a title").max(160).parse(fd.str(f, "title"));
      const body = z.string().min(5, "Enter the update").max(10000).parse(fd.str(f, "body"));
      const media = await parseMedia(f, "image");
      await db.projectUpdate.create({
        data: { projectId, title, body, publishedAt: fd.date(f, "publishedAt") ?? new Date(), published: fd.bool(f, "published"), mediaId: media[0]?.mediaId ?? null },
      });
      await audit({ userId: user.id, action: "development.progress_update", entityType: "DevelopmentProject", entityId: projectId, summary: `Posted progress update “${title}”` });
    }
    const p = await db.developmentProject.findUnique({ where: { id: projectId }, select: { slug: true } });
    refresh(`/admin/developments/${projectId}`, p ? `/real-estate/developments/${p.slug}` : "/");
    return { success: "Progress updates saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

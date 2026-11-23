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
  title: z.string().min(3, "Enter a title").max(160),
  summary: z.string().min(10, "Enter a short summary").max(400),
  description: z.string().min(10, "Enter a description").max(20000),
  sector: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND", "MIXED_USE"]),
  listingType: z.enum(["SALE", "LEASE", "SALE_OR_LEASE"]),
  status: z.enum(["AVAILABLE", "UNDER_OFFER", "SOLD", "LEASED", "OFF_MARKET"]),
  pricePeriod: z.enum(["TOTAL", "PER_ANNUM", "PER_MONTH", "PER_SQM"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  currency: z.enum(CURRENCIES),
});

export async function saveProperty(_prev: ActionState, f: FormData): Promise<ActionState> {
  let id = fd.opt(f, "id");
  try {
    const user = await authorize("property.manage");
    const base = schema.parse({
      title: fd.str(f, "title"),
      summary: fd.str(f, "summary"),
      description: fd.str(f, "description"),
      sector: fd.str(f, "sector"),
      listingType: fd.str(f, "listingType"),
      status: fd.str(f, "status"),
      pricePeriod: fd.str(f, "pricePeriod") || "TOTAL",
      publishStatus: fd.str(f, "publishStatus") || "DRAFT",
      currency: fd.str(f, "currency") || "NGN",
    });
    const price = fd.num(f, "price");
    const priceOnRequest = fd.bool(f, "priceOnRequest");
    if (!priceOnRequest && price === null && base.publishStatus === "PUBLISHED") {
      return { error: "Enter a price or tick “Price on request” before publishing.", fieldErrors: { price: "Required unless price is on request" } };
    }
    const lat = fd.num(f, "latitude");
    const lng = fd.num(f, "longitude");
    if ((lat !== null && (lat < -90 || lat > 90)) || (lng !== null && (lng < -180 || lng > 180))) return { error: "Coordinates are out of range.", fieldErrors: { latitude: "Invalid coordinate" } };

    const existing = id ? await db.property.findUnique({ where: { id }, select: { slug: true, publishedAt: true } }) : null;
    const requestedSlug = slugify(fd.str(f, "slug") || base.title);
    const slug =
      existing && existing.slug === requestedSlug
        ? existing.slug
        : await uniqueSlug(requestedSlug, async (s) => !!(await db.property.findFirst({ where: { slug: s, NOT: id ? { id } : undefined } })));

    const data: Prisma.PropertyUncheckedCreateInput = {
      ...base,
      slug,
      price,
      priceOnRequest,
      propertyTypeId: fd.opt(f, "propertyTypeId"),
      locationId: fd.opt(f, "locationId"),
      developmentId: fd.opt(f, "developmentId"),
      address: fd.opt(f, "address"),
      latitude: lat,
      longitude: lng,
      bedrooms: fd.int(f, "bedrooms"),
      bathrooms: fd.int(f, "bathrooms"),
      parkingSpaces: fd.int(f, "parkingSpaces"),
      floorAreaSqm: fd.num(f, "floorAreaSqm"),
      landAreaSqm: fd.num(f, "landAreaSqm"),
      titleDocument: fd.opt(f, "titleDocument"),
      yearBuilt: fd.int(f, "yearBuilt"),
      features: fd.lines(f, "features"),
      amenities: fd.lines(f, "amenities"),
      specifications: fd.specs(f, "specifications"),
      featured: fd.bool(f, "featured"),
      availabilityVerifiedAt: fd.bool(f, "verifyNow") ? new Date() : fd.date(f, "availabilityVerifiedAt"),
      metaTitle: fd.opt(f, "metaTitle"),
      metaDescription: fd.opt(f, "metaDescription"),
      publishedAt: base.publishStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };

    const images = await parseMedia(f, "images");
    const documents = await parseMedia(f, "documents");

    const saved = await db.$transaction(async (tx) => {
      const p = id ? await tx.property.update({ where: { id }, data }) : await tx.property.create({ data });
      await tx.propertyImage.deleteMany({ where: { propertyId: p.id } });
      if (images.length)
        await tx.propertyImage.createMany({
          data: images.map((m, i) => ({ propertyId: p.id, mediaId: m.mediaId, alt: m.alt || null, kind: m.kind === "FLOOR_PLAN" ? "FLOOR_PLAN" : "PHOTO", order: i })),
        });
      await tx.propertyDocument.deleteMany({ where: { propertyId: p.id } });
      if (documents.length)
        await tx.propertyDocument.createMany({
          data: documents.map((m, i) => ({ propertyId: p.id, mediaId: m.mediaId, title: m.title || "Document", isPublic: m.flag !== false, order: i })),
        });
      return p;
    });
    await syncDocumentVisibility(documents);
    await audit({ userId: user.id, action: id ? "property.update" : "property.create", entityType: "Property", entityId: saved.id, summary: `${id ? "Updated" : "Created"} property “${saved.title}” (${saved.publishStatus.toLowerCase()})` });
    refresh("/real-estate/properties", `/real-estate/properties/${saved.slug}`);
    if (!id) id = saved.id;
    else return { success: "Property saved." };
  } catch (err) {
    return handleActionError(err);
  }
  redirect(`/admin/properties/${id}?created=1`);
}

const PAST = { publish: "Published", unpublish: "Unpublished", archive: "Archived" } as const;

export async function propertyCommand(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("property.manage");
    const id = z.string().parse(f.get("id"));
    const op = String(f.get("op"));
    const p = await db.property.findUniqueOrThrow({ where: { id } });
    if (op === "delete") {
      const enquiries = await db.enquiry.count({ where: { propertyId: id } });
      if (enquiries > 0) return { error: `This property has ${enquiries} linked enquir${enquiries === 1 ? "y" : "ies"}. Archive it instead to preserve the CRM history.` };
      await db.property.delete({ where: { id } });
      await audit({ userId: user.id, action: "property.delete", entityType: "Property", entityId: id, summary: `Deleted property “${p.title}”` });
      refresh("/real-estate/properties");
    } else {
      const map = { publish: "PUBLISHED", unpublish: "DRAFT", archive: "ARCHIVED" } as const;
      const next = map[op as keyof typeof map];
      if (!next) return { error: "Unknown action." };
      await db.property.update({ where: { id }, data: { publishStatus: next, publishedAt: next === "PUBLISHED" ? (p.publishedAt ?? new Date()) : p.publishedAt } });
      await audit({ userId: user.id, action: `property.${op}`, entityType: "Property", entityId: id, summary: `${PAST[op as keyof typeof PAST]} property “${p.title}”` });
      refresh("/real-estate/properties", `/real-estate/properties/${p.slug}`);
      return { success: `Property ${next.toLowerCase()}.` };
    }
  } catch (err) {
    return handleActionError(err);
  }
  redirect("/admin/properties");
}

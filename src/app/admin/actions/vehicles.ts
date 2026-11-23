"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { fd, handleActionError, parseMedia, refresh, uniqueSlug } from "@/lib/admin-form";
import { CURRENCIES } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { ActionState } from "./types";

const year = new Date().getFullYear();
const schema = z.object({
  make: z.string().min(1, "Enter the make").max(60),
  model: z.string().min(1, "Enter the model").max(80),
  year: z.number({ message: "Enter the year" }).int().min(1950, "Invalid year").max(year + 2, "Invalid year"),
  condition: z.enum(["NEW", "FOREIGN_USED", "LOCALLY_USED", "CERTIFIED_PRE_OWNED"]),
  bodyType: z.enum(["SUV", "SEDAN", "COUPE", "HATCHBACK", "CONVERTIBLE", "WAGON", "PICKUP", "VAN", "TRUCK", "BUS", "OTHER"]),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "OTHER"]),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC", "CNG", "OTHER"]),
  availability: z.enum(["AVAILABLE", "RESERVED", "IN_TRANSIT", "ON_ORDER", "SOLD"]),
  publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  currency: z.enum(CURRENCIES),
});

export async function saveVehicle(_prev: ActionState, f: FormData): Promise<ActionState> {
  let id = fd.opt(f, "id");
  try {
    const user = await authorize("vehicle.manage");
    const base = schema.parse({
      make: fd.str(f, "make"),
      model: fd.str(f, "model"),
      year: fd.int(f, "year") ?? undefined,
      condition: fd.str(f, "condition"),
      bodyType: fd.str(f, "bodyType"),
      transmission: fd.str(f, "transmission"),
      fuelType: fd.str(f, "fuelType"),
      availability: fd.str(f, "availability"),
      publishStatus: fd.str(f, "publishStatus") || "DRAFT",
      currency: fd.str(f, "currency") || "NGN",
    });
    const price = fd.num(f, "price");
    const priceOnRequest = fd.bool(f, "priceOnRequest");
    if (!priceOnRequest && price === null && base.publishStatus === "PUBLISHED") return { error: "Enter a price or tick “Price on request” before publishing.", fieldErrors: { price: "Required" } };

    const existing = id ? await db.vehicle.findUnique({ where: { id }, select: { slug: true, publishedAt: true, soldAt: true } }) : null;
    const variant = fd.opt(f, "variant");
    const requested = slugify(fd.str(f, "slug") || `${base.year} ${base.make} ${base.model} ${variant ?? ""}`);
    const slug = existing?.slug === requested ? requested : await uniqueSlug(requested, async (s) => !!(await db.vehicle.findFirst({ where: { slug: s, NOT: id ? { id } : undefined } })));
    const categoryIds = f.getAll("categoryIds").map(String).filter(Boolean);

    const data: Prisma.VehicleUncheckedCreateInput = {
      ...base,
      slug,
      variant,
      price,
      priceOnRequest,
      mileage: fd.int(f, "mileage"),
      mileageUnit: fd.str(f, "mileageUnit") === "mi" ? "mi" : "km",
      engine: fd.opt(f, "engine"),
      horsepower: fd.int(f, "horsepower"),
      drivetrain: fd.opt(f, "drivetrain"),
      seats: fd.int(f, "seats"),
      exteriorColour: fd.opt(f, "exteriorColour"),
      interiorColour: fd.opt(f, "interiorColour"),
      interiorDetails: fd.opt(f, "interiorDetails"),
      summary: fd.opt(f, "summary"),
      description: fd.opt(f, "description"),
      features: fd.lines(f, "features"),
      specifications: fd.specs(f, "specifications"),
      inspectionInfo: fd.opt(f, "inspectionInfo"),
      vin: fd.opt(f, "vin"),
      location: fd.opt(f, "location"),
      featured: fd.bool(f, "featured"),
      soldAt: base.availability === "SOLD" ? (existing?.soldAt ?? new Date()) : null,
      metaTitle: fd.opt(f, "metaTitle"),
      metaDescription: fd.opt(f, "metaDescription"),
      publishedAt: base.publishStatus === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };
    const images = await parseMedia(f, "images");

    const saved = await db.$transaction(async (tx) => {
      const v = id
        ? await tx.vehicle.update({ where: { id }, data: { ...data, categories: { set: categoryIds.map((cid) => ({ id: cid })) } } })
        : await tx.vehicle.create({ data: { ...data, categories: { connect: categoryIds.map((cid) => ({ id: cid })) } } as Prisma.VehicleCreateInput & Prisma.VehicleUncheckedCreateInput });
      await tx.vehicleImage.deleteMany({ where: { vehicleId: v.id } });
      if (images.length) await tx.vehicleImage.createMany({ data: images.map((m, i) => ({ vehicleId: v.id, mediaId: m.mediaId, alt: m.alt || null, order: i })) });
      return v;
    });
    await audit({ userId: user.id, action: id ? "vehicle.update" : "vehicle.create", entityType: "Vehicle", entityId: saved.id, summary: `${id ? "Updated" : "Created"} vehicle ${saved.year} ${saved.make} ${saved.model}` });
    refresh("/automotive", "/automotive/vehicles", `/automotive/vehicles/${saved.slug}`);
    if (id) return { success: "Vehicle saved." };
    id = saved.id;
  } catch (err) {
    return handleActionError(err);
  }
  redirect(`/admin/vehicles/${id}?created=1`);
}

const PAST = { publish: "Published", unpublish: "Unpublished", archive: "Archived", sold: "Marked as sold" } as const;

export async function vehicleCommand(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("vehicle.manage");
    const id = z.string().parse(f.get("id"));
    const op = String(f.get("op"));
    const v = await db.vehicle.findUniqueOrThrow({ where: { id } });
    const label = `${v.year} ${v.make} ${v.model}`;
    if (op === "delete") {
      const linked = await db.enquiry.count({ where: { vehicleId: id } });
      if (linked) return { error: `This vehicle has ${linked} linked enquiries. Archive it or mark it as sold instead.` };
      await db.vehicle.delete({ where: { id } });
      await audit({ userId: user.id, action: "vehicle.delete", entityType: "Vehicle", entityId: id, summary: `Deleted vehicle ${label}` });
      refresh("/automotive/vehicles");
    } else if (op === "sold") {
      await db.vehicle.update({ where: { id }, data: { availability: "SOLD", soldAt: new Date() } });
      await audit({ userId: user.id, action: "vehicle.sold", entityType: "Vehicle", entityId: id, summary: `Marked ${label} as sold` });
      refresh("/automotive/vehicles", `/automotive/vehicles/${v.slug}`);
      return { success: "Vehicle marked as sold." };
    } else {
      const map = { publish: "PUBLISHED", unpublish: "DRAFT", archive: "ARCHIVED" } as const;
      const next = map[op as keyof typeof map];
      if (!next) return { error: "Unknown action." };
      await db.vehicle.update({ where: { id }, data: { publishStatus: next, publishedAt: next === "PUBLISHED" ? (v.publishedAt ?? new Date()) : v.publishedAt } });
      await audit({ userId: user.id, action: `vehicle.${op}`, entityType: "Vehicle", entityId: id, summary: `${PAST[op as keyof typeof PAST]} vehicle ${label}` });
      refresh("/automotive/vehicles", `/automotive/vehicles/${v.slug}`);
      return { success: `Vehicle ${next.toLowerCase()}.` };
    }
  } catch (err) {
    return handleActionError(err);
  }
  redirect("/admin/vehicles");
}

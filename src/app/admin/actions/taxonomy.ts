"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { fd, handleActionError, refresh, uniqueSlug } from "@/lib/admin-form";
import type { ActionState } from "./types";

export async function saveLocation(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("taxonomy.real_estate");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      const used = await db.location.findUnique({ where: { id }, include: { _count: { select: { properties: true, projects: true, opportunities: true } } } });
      if (used && used._count.properties + used._count.projects + used._count.opportunities > 0) return { error: "This location is in use and cannot be deleted." };
      await db.location.delete({ where: { id } });
      await audit({ userId: user.id, action: "taxonomy.location_delete", summary: `Deleted location ${used?.name}` });
      refresh("/admin/taxonomy/real-estate");
      return { success: "Location deleted." };
    }
    const name = z.string().trim().min(2, "Enter a name").max(80).parse(fd.str(f, "name"));
    const data = { name, city: fd.opt(f, "city"), state: fd.opt(f, "state"), country: fd.opt(f, "country") ?? "Nigeria" };
    if (id) await db.location.update({ where: { id }, data });
    else {
      const slug = await uniqueSlug([name, data.state].filter(Boolean).join(" "), async (s) => !!(await db.location.findUnique({ where: { slug: s } })));
      await db.location.create({ data: { ...data, slug } });
    }
    await audit({ userId: user.id, action: "taxonomy.location_save", summary: `Saved location ${name}` });
    refresh("/admin/taxonomy/real-estate");
    return { success: "Location saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function savePropertyType(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("taxonomy.real_estate");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      const n = await db.property.count({ where: { propertyTypeId: id } });
      if (n) return { error: `This type is used by ${n} properties.` };
      await db.propertyType.delete({ where: { id } });
      refresh("/admin/taxonomy/real-estate");
      return { success: "Property type deleted." };
    }
    const name = z.string().trim().min(2).max(80).parse(fd.str(f, "name"));
    const sector = z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND", "MIXED_USE"]).parse(fd.str(f, "sector"));
    if (id) await db.propertyType.update({ where: { id }, data: { name, sector, order: fd.int(f, "order") ?? 0 } });
    else {
      const slug = await uniqueSlug(name, async (s) => !!(await db.propertyType.findUnique({ where: { slug: s } })));
      await db.propertyType.create({ data: { name, sector, slug, order: fd.int(f, "order") ?? 0 } });
    }
    await audit({ userId: user.id, action: "taxonomy.property_type_save", summary: `Saved property type ${name}` });
    refresh("/admin/taxonomy/real-estate");
    return { success: "Property type saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function saveVehicleCategory(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const user = await authorize("taxonomy.automotive");
    const id = fd.opt(f, "id");
    if (f.get("op") === "delete" && id) {
      await db.vehicleCategory.delete({ where: { id } });
      await audit({ userId: user.id, action: "taxonomy.vehicle_category_delete", summary: "Deleted a vehicle category" });
      refresh("/admin/taxonomy/automotive");
      return { success: "Category deleted." };
    }
    const name = z.string().trim().min(2).max(60).parse(fd.str(f, "name"));
    if (id) await db.vehicleCategory.update({ where: { id }, data: { name, order: fd.int(f, "order") ?? 0 } });
    else {
      const slug = await uniqueSlug(name, async (s) => !!(await db.vehicleCategory.findUnique({ where: { slug: s } })));
      await db.vehicleCategory.create({ data: { name, slug, order: fd.int(f, "order") ?? 0 } });
    }
    await audit({ userId: user.id, action: "taxonomy.vehicle_category_save", summary: `Saved vehicle category ${name}` });
    refresh("/admin/taxonomy/automotive");
    return { success: "Category saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

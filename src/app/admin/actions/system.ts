"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize, hashPassword } from "@/lib/auth";
import { fd, handleActionError, refresh } from "@/lib/admin-form";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { deleteStoredFile } from "@/lib/storage";
import { randomToken } from "@/lib/crypto";
import type { ActionState } from "./types";

// ─────────────────────────── Users
export async function saveUser(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const me = await authorize("users.manage");
    const id = fd.opt(f, "id");
    const email = z.string().trim().toLowerCase().email("Enter a valid email").parse(fd.str(f, "email"));
    const name = z.string().trim().min(2, "Enter a name").max(120).parse(fd.str(f, "name"));
    const roleId = z.string().min(1, "Choose a role").parse(fd.str(f, "roleId"));
    const active = fd.bool(f, "active");
    const password = fd.str(f, "password");
    if (password && password.length < 12) return { error: "Passwords must be at least 12 characters.", fieldErrors: { password: "At least 12 characters" } };

    const role = await db.role.findUniqueOrThrow({ where: { id: roleId } });
    if (id) {
      const target = await db.user.findUniqueOrThrow({ where: { id }, include: { role: true } });
      // Prevent locking the organisation out of administration.
      if (target.role.key === "super_admin" && (role.key !== "super_admin" || !active)) {
        const supers = await db.user.count({ where: { active: true, role: { key: "super_admin" } } });
        if (supers <= 1) return { error: "At least one active Super Admin must remain." };
      }
      if (id === me.id && !active) return { error: "You cannot deactivate your own account." };
      await db.user.update({
        where: { id },
        data: { email, name, roleId, active, position: fd.opt(f, "position"), phone: fd.opt(f, "phone"), ...(password ? { passwordHash: await hashPassword(password) } : {}) },
      });
      if (!active || password) await db.session.deleteMany({ where: { userId: id } });
      await audit({ userId: me.id, action: "user.update", entityType: "User", entityId: id, summary: `Updated user ${email} (${role.name}${active ? "" : ", deactivated"}${password ? ", password reset" : ""})` });
      refresh("/admin/users");
      return { success: "User updated." };
    }
    const initial = password || randomToken(12);
    const created = await db.user.create({ data: { email, name, roleId, active: true, position: fd.opt(f, "position"), phone: fd.opt(f, "phone"), passwordHash: await hashPassword(initial) } });
    await audit({ userId: me.id, action: "user.create", entityType: "User", entityId: created.id, summary: `Created user ${email} with role ${role.name}` });
    refresh("/admin/users");
    return { success: password ? `User created.` : `User created. Temporary password: ${initial} — share it securely; it will not be shown again.` };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─────────────────────────── Roles
export async function saveRole(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const me = await authorize("users.manage");
    const id = fd.opt(f, "id");
    const name = z.string().trim().min(2).max(80).parse(fd.str(f, "name"));
    const perms = f.getAll("permissions").map(String).filter((p) => (ALL_PERMISSIONS as string[]).includes(p));
    const permissions = await db.permission.findMany({ where: { key: { in: perms } } });
    if (id) {
      const role = await db.role.findUniqueOrThrow({ where: { id } });
      if (role.key === "super_admin") return { error: "The Super Admin role always has every permission and cannot be edited." };
      await db.$transaction([
        db.role.update({ where: { id }, data: { name, description: fd.opt(f, "description") } }),
        db.rolePermission.deleteMany({ where: { roleId: id } }),
        db.rolePermission.createMany({ data: permissions.map((p) => ({ roleId: id, permissionId: p.id })) }),
      ]);
      await audit({ userId: me.id, action: "role.update", entityType: "Role", entityId: id, summary: `Updated role ${name} (${permissions.length} permissions)` });
    } else {
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const role = await db.role.create({ data: { key, name, description: fd.opt(f, "description"), permissions: { create: permissions.map((p) => ({ permissionId: p.id })) } } });
      await audit({ userId: me.id, action: "role.create", entityType: "Role", entityId: role.id, summary: `Created role ${name}` });
    }
    refresh("/admin/roles");
    return { success: "Role saved." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─────────────────────────── Media
export async function mediaCommand(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const me = await authorize("media.manage");
    const id = z.string().parse(f.get("id"));
    const asset = await db.mediaAsset.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: {
            propertyImages: true,
            propertyDocuments: true,
            projectMedia: true,
            projectDocuments: true,
            projectUpdates: true,
            vehicleImages: true,
            opportunityDocs: true,
            opportunityCovers: true,
            articleCovers: true,
            publicationFiles: true,
            publicationCovers: true,
            leadershipPhotos: true,
            enquiryAttachments: true,
          },
        },
      },
    });
    if (f.get("op") === "alt") {
      await db.mediaAsset.update({ where: { id }, data: { alt: fd.opt(f, "alt") } });
      return { success: "Description saved." };
    }
    const uses = Object.values(asset._count).reduce((a, b) => a + b, 0);
    const inContent = await db.corporateContent.count({ where: { value: { string_contains: asset.url ?? `/api/files/${id}` } } }).catch(() => 0);
    if (uses > 0 || inContent > 0) return { error: "This file is in use and cannot be deleted. Remove it from the records that use it first." };
    await deleteStoredFile(asset);
    await db.mediaAsset.delete({ where: { id } });
    await audit({ userId: me.id, action: "media.delete", entityType: "MediaAsset", entityId: id, summary: `Deleted file ${asset.originalName}` });
    refresh("/admin/media");
    return { success: "File deleted." };
  } catch (err) {
    return handleActionError(err);
  }
}

// ─────────────────────────── Demo data
export async function purgeDemoData(_prev: ActionState, f: FormData): Promise<ActionState> {
  try {
    const me = await authorize("settings.manage");
    if (f.get("confirm") !== "DELETE DEMO DATA") return { error: "Type DELETE DEMO DATA to confirm." };
    const where = { isDemo: true };
    // Enquiries are never deleted here: links to removed records are cleared (SET NULL) so CRM history is preserved.
    const [p, d, v, o, a] = await db.$transaction([
      db.property.deleteMany({ where }),
      db.investmentOpportunity.deleteMany({ where }),
      db.vehicle.deleteMany({ where }),
      db.developmentProject.deleteMany({ where }),
      db.article.deleteMany({ where }),
    ]);
    await audit({ userId: me.id, action: "demo.purge", summary: `Removed demo data: ${p.count} properties, ${o.count} developments, ${v.count} vehicles, ${d.count} opportunities, ${a.count} articles` });
    refresh("/admin/settings");
    return { success: "All demonstration records have been removed." };
  } catch (err) {
    return handleActionError(err);
  }
}

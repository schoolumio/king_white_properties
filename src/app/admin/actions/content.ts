"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { handleActionError } from "@/lib/admin-form";
import { CONTENT_TAG } from "@/lib/content";
import { getSectionDef, type FieldDef } from "@/lib/content-schema";
import type { ActionState } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function cleanString(v: unknown, max: number) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function sanitize(fields: FieldDef[], input: any, errors: string[], path = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = input?.[f.name];
    const label = path ? `${path} › ${f.label}` : f.label;
    switch (f.type) {
      case "text":
        out[f.name] = cleanString(v, 300).trim();
        break;
      case "textarea":
        out[f.name] = cleanString(v, 4000).trim();
        break;
      case "markdown":
        out[f.name] = cleanString(v, 30000);
        break;
      case "email": {
        const s = cleanString(v, 200).trim();
        if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors.push(`${label}: invalid email address`);
        out[f.name] = s;
        break;
      }
      case "url": {
        const s = cleanString(v, 500).trim();
        if (s && !/^https:\/\/[^\s]+$/.test(s)) errors.push(`${label}: must be a full https:// address`);
        out[f.name] = s;
        break;
      }
      case "image": {
        const s = cleanString(v, 1000).trim();
        if (s && !/^(https:\/\/|\/(media|api\/files)\/)[^\s"'<>]+$/.test(s)) errors.push(`${label}: must be an uploaded image or an https:// URL`);
        out[f.name] = s;
        break;
      }
      case "color": {
        const s = cleanString(v, 7).trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(s)) errors.push(`${label}: use a 6-digit hex colour such as #101D32`);
        out[f.name] = s;
        break;
      }
      case "boolean":
        out[f.name] = v === true;
        break;
      case "stringList":
        out[f.name] = (Array.isArray(v) ? v : []).map((x) => cleanString(x, 300).trim()).filter(Boolean).slice(0, 50);
        break;
      case "group":
        out[f.name] = sanitize(f.fields, v ?? {}, errors, label);
        break;
      case "objectList":
        out[f.name] = (Array.isArray(v) ? v : []).slice(0, 30).map((item, i) => sanitize(f.fields, item, errors, `${label} ${i + 1}`));
        break;
    }
  }
  return out;
}

export async function saveContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const key = String(formData.get("key"));
    const def = getSectionDef(key);
    if (!def) return { error: "Unknown content section." };
    const user = await authorize(def.group === "System" ? "settings.manage" : "content.manage");
    let raw: unknown;
    try {
      raw = JSON.parse(String(formData.get("value") ?? "{}"));
    } catch {
      return { error: "The content could not be read. Please reload and try again." };
    }
    const errors: string[] = [];
    const value = sanitize(def.fields, raw, errors);
    if (key === "notifications") {
      for (const k of Object.keys(value)) {
        if (Array.isArray(value[k])) for (const e of value[k] as string[]) if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) errors.push(`Invalid email address: ${e}`);
      }
    }
    if (errors.length) return { error: errors.slice(0, 5).join(" · ") };

    await db.corporateContent.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue, updatedById: user.id },
      create: { key, value: value as Prisma.InputJsonValue, updatedById: user.id },
    });
    await audit({ userId: user.id, action: "content.update", entityType: "CorporateContent", entityId: key, summary: `Updated content: ${def.title}` });
    revalidateTag(CONTENT_TAG);
    revalidatePath("/", "layout");
    return { success: `“${def.title}” saved and published.` };
  } catch (err) {
    return handleActionError(err);
  }
}

export async function resetContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const key = String(formData.get("key"));
    const def = getSectionDef(key);
    if (!def) return { error: "Unknown content section." };
    const user = await authorize(def.group === "System" ? "settings.manage" : "content.manage");
    await db.corporateContent.deleteMany({ where: { key } });
    await audit({ userId: user.id, action: "content.reset", entityType: "CorporateContent", entityId: key, summary: `Reset content to defaults: ${def.title}` });
    revalidateTag(CONTENT_TAG);
    revalidatePath("/", "layout");
    return { success: "Restored the default content." };
  } catch (err) {
    return handleActionError(err);
  }
}

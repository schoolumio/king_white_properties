import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AuthorizationError } from "./auth";
import { slugify } from "./utils";
import type { ActionState } from "@/app/admin/actions/types";

/** Helpers for parsing admin FormData into typed values. */
export const fd = {
  str: (f: FormData, k: string) => {
    const v = f.get(k);
    return typeof v === "string" ? v.trim() : "";
  },
  opt: (f: FormData, k: string) => {
    const v = f.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  },
  int: (f: FormData, k: string) => {
    const v = f.get(k);
    if (typeof v !== "string" || !v.trim()) return null;
    const n = parseInt(v.replace(/[,\s]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  },
  num: (f: FormData, k: string) => {
    const v = f.get(k);
    if (typeof v !== "string" || !v.trim()) return null;
    const n = parseFloat(v.replace(/[,\s]/g, ""));
    return Number.isFinite(n) ? n : null;
  },
  bool: (f: FormData, k: string) => f.get(k) === "true" || f.get(k) === "on",
  date: (f: FormData, k: string) => {
    const v = f.get(k);
    if (typeof v !== "string" || !v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  },
  lines: (f: FormData, k: string) =>
    String(f.get(k) ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100),
  /** "Label: value" lines → [{label, value}] */
  specs: (f: FormData, k: string) =>
    String(f.get(k) ?? "")
      .split(/\r?\n/)
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx < 1) return null;
        return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      })
      .filter((x): x is { label: string; value: string } => !!x && !!x.label && !!x.value)
      .slice(0, 60),
};

export function specsToText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return (value as { label: string; value: string }[]).map((s) => `${s.label}: ${s.value}`).join("\n");
}

const mediaItem = z.object({
  mediaId: z.string().min(1).max(40),
  alt: z.string().max(300).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  kind: z.string().max(40).optional().nullable(),
  flag: z.boolean().optional().nullable(),
});
export type ParsedMedia = z.infer<typeof mediaItem>;

export async function parseMedia(f: FormData, key: string): Promise<ParsedMedia[]> {
  try {
    const raw = JSON.parse(String(f.get(key) ?? "[]"));
    const items = z.array(mediaItem).max(60).parse(raw);
    if (!items.length) return [];
    const existing = await db.mediaAsset.findMany({ where: { id: { in: items.map((i) => i.mediaId) } }, select: { id: true } });
    const ok = new Set(existing.map((e) => e.id));
    return items.filter((i) => ok.has(i.mediaId));
  } catch {
    return [];
  }
}

/** Ensures a unique slug for a model by appending a counter. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let slug = root;
  for (let i = 2; await exists(slug); i++) slug = `${root}-${i}`;
  return slug;
}

export function refresh(...paths: string[]) {
  revalidatePath("/", "layout");
  for (const p of paths) revalidatePath(p);
}

/** Converts thrown errors into user-facing ActionState. Re-throws Next redirects. */
export function handleActionError(err: unknown): ActionState {
  if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw err;
  if (err instanceof AuthorizationError) return { error: err.message };
  if (err instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const i of err.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return { error: "A record with the same unique value (e.g. URL slug or email) already exists." };
    if (err.code === "P2003") return { error: "This record is referenced by other records and cannot be removed." };
    if (err.code === "P2025") return { error: "The record no longer exists." };
  }
  console.error("[admin action]", err);
  return { error: "Something went wrong while saving. Please try again." };
}

/** Aligns stored file visibility with each document's public/internal flag. */
export async function syncDocumentVisibility(docs: ParsedMedia[]) {
  const priv = docs.filter((d) => d.flag === false).map((d) => d.mediaId);
  const pub = docs.filter((d) => d.flag !== false).map((d) => d.mediaId);
  if (priv.length) await db.mediaAsset.updateMany({ where: { id: { in: priv } }, data: { visibility: "PRIVATE", url: null } });
  if (pub.length) await db.mediaAsset.updateMany({ where: { id: { in: pub }, visibility: "PRIVATE" }, data: { visibility: "PUBLIC" } });
}

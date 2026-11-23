import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CONTENT_SECTIONS, getSectionDef } from "./content-schema";

export const CONTENT_TAG = "corporate-content";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

function deepMerge(base: Json, override: Json): Json {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (base && typeof base === "object" && override && typeof override === "object") {
    const out: Json = { ...base };
    for (const k of Object.keys(override)) out[k] = deepMerge(base[k], override[k]);
    return out;
  }
  return override === undefined || override === null ? base : override;
}

const loadAll = unstable_cache(
  async () => {
    try {
      const rows = await db.corporateContent.findMany();
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, Json>;
    } catch (err) {
      console.error("[content] could not load corporate content — using defaults", err);
      return {} as Record<string, Json>;
    }
  },
  ["corporate-content-all"],
  { tags: [CONTENT_TAG], revalidate: 3600 },
);

/** Returns the stored content for a section merged over its registered defaults. */
export async function getContent<T = Json>(key: string): Promise<T> {
  const def = getSectionDef(key);
  const all = await loadAll();
  return deepMerge(def?.defaults ?? {}, all[key]) as T;
}

export async function getSite() {
  return getContent<SiteContent>("site");
}

export type SiteContent = {
  companyName: string;
  legalName: string;
  registration: string;
  tagline: string;
  description: string;
  logo: string;
  logoInverse: string;
  country: string;
  currency: string;
  email: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  address: string;
  officeHours: string;
  socials: Record<"linkedin" | "x" | "instagram" | "facebook" | "youtube", string>;
};

export type Cta = { label: string; href: string };
export type Titled = { title: string; description: string };

export { CONTENT_SECTIONS };

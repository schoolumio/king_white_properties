import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

function opportunityPath(o: { slug: string; sector: string }) {
  return o.sector === "REAL_ESTATE" || o.sector === "INFRASTRUCTURE" ? `/real-estate/investment-opportunities/${o.slug}` : `/investments/opportunities/${o.slug}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = [
    "/",
    "/about",
    "/about/governance",
    "/real-estate",
    "/real-estate/properties",
    "/real-estate/developments",
    "/real-estate/investment-opportunities",
    "/automotive",
    "/automotive/vehicles",
    "/automotive/fleet-solutions",
    "/automotive/sourcing",
    "/investments",
    "/partnerships",
    "/insights",
    "/insights/publications",
    "/contact",
  ].map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 }));

  try {
    const pub = { publishStatus: "PUBLISHED" as const };
    const [properties, projects, vehicles, opportunities, articles, pages] = await Promise.all([
      db.property.findMany({ where: pub, select: { slug: true, updatedAt: true } }),
      db.developmentProject.findMany({ where: pub, select: { slug: true, updatedAt: true } }),
      db.vehicle.findMany({ where: { ...pub, availability: { not: "SOLD" } }, select: { slug: true, updatedAt: true } }),
      db.investmentOpportunity.findMany({ where: pub, select: { slug: true, sector: true, updatedAt: true } }),
      db.article.findMany({ where: { ...pub, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
      db.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...statics,
      ...properties.map((x) => ({ url: absoluteUrl(`/real-estate/properties/${x.slug}`), lastModified: x.updatedAt })),
      ...projects.map((x) => ({ url: absoluteUrl(`/real-estate/developments/${x.slug}`), lastModified: x.updatedAt })),
      ...vehicles.map((x) => ({ url: absoluteUrl(`/automotive/vehicles/${x.slug}`), lastModified: x.updatedAt })),
      ...opportunities.map((x) => ({ url: absoluteUrl(opportunityPath(x)), lastModified: x.updatedAt })),
      ...articles.map((x) => ({ url: absoluteUrl(`/insights/${x.slug}`), lastModified: x.updatedAt })),
      ...pages.map((x) => ({ url: absoluteUrl(`/legal/${x.slug}`), lastModified: x.updatedAt })),
    ];
  } catch {
    return statics;
  }
}

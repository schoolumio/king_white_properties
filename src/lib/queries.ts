import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

/** Public catalogue queries. Every query is restricted to published records. */

const firstPhoto = { where: { kind: "PHOTO" as const }, orderBy: { order: "asc" as const }, take: 1, include: { media: true } };

export const propertyCardInclude = {
  images: firstPhoto,
  location: true,
  propertyType: true,
} satisfies Prisma.PropertyInclude;

export const projectCardInclude = {
  media: { where: { kind: "GALLERY" as const }, orderBy: { order: "asc" as const }, take: 1, include: { media: true } },
  location: true,
} satisfies Prisma.DevelopmentProjectInclude;

export const vehicleCardInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1, include: { media: true } },
  categories: true,
} satisfies Prisma.VehicleInclude;

export type PropertyCardData = Prisma.PropertyGetPayload<{ include: typeof propertyCardInclude }>;
export type ProjectCardData = Prisma.DevelopmentProjectGetPayload<{ include: typeof projectCardInclude }>;
export type VehicleCardData = Prisma.VehicleGetPayload<{ include: typeof vehicleCardInclude }>;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[queries]", err);
    return fallback;
  }
}

export function featuredProjects(take = 4) {
  return safe(
    () =>
      db.developmentProject.findMany({
        where: { publishStatus: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take,
        include: projectCardInclude,
      }),
    [],
  );
}

export function featuredVehicles(take = 6) {
  return safe(
    () =>
      db.vehicle.findMany({
        where: { publishStatus: "PUBLISHED", availability: { not: "SOLD" } },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take,
        include: vehicleCardInclude,
      }),
    [],
  );
}

export function featuredProperties(take = 3) {
  return safe(
    () =>
      db.property.findMany({
        where: { publishStatus: "PUBLISHED", status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take,
        include: propertyCardInclude,
      }),
    [],
  );
}

export function openOpportunities(take = 6, sector?: Prisma.InvestmentOpportunityWhereInput["sector"]) {
  return safe(
    () =>
      db.investmentOpportunity.findMany({
        where: { publishStatus: "PUBLISHED", sector, status: { not: "CLOSED" } },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take,
        include: { location: true, cover: true },
      }),
    [],
  );
}

export function latestArticles(take = 3) {
  return safe(
    () =>
      db.article.findMany({
        where: { publishStatus: "PUBLISHED", publishedAt: { lte: new Date() } },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take,
        include: { cover: true },
      }),
    [],
  );
}

export function latestPublications(take = 3) {
  return safe(
    () =>
      db.publication.findMany({
        where: { publishStatus: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take,
        include: { file: true, cover: true },
      }),
    [],
  );
}

export function publishedLeadership() {
  return safe(
    () =>
      db.leadershipProfile.findMany({
        where: { published: true },
        orderBy: [{ group: "asc" }, { order: "asc" }],
        include: { photo: true },
      }),
    [],
  );
}

export function catalogueCounts() {
  return safe(
    async () => {
      const [properties, projects, vehicles] = await Promise.all([
        db.property.count({ where: { publishStatus: "PUBLISHED" } }),
        db.developmentProject.count({ where: { publishStatus: "PUBLISHED" } }),
        db.vehicle.count({ where: { publishStatus: "PUBLISHED", availability: { not: "SOLD" } } }),
      ]);
      return { properties, projects, vehicles };
    },
    { properties: 0, projects: 0, vehicles: 0 },
  );
}

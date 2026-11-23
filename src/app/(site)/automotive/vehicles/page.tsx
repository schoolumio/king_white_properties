import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { vehicleCardInclude } from "@/lib/queries";
import { AVAILABILITY_LABELS, BODY_LABELS, CONDITION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo";
import { firstParam, toInt } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/section";
import { LinkButton } from "@/components/ui/button";
import { VehicleCard } from "@/components/catalog/cards";
import { FilterBar, Pagination, ResultsMeta, opts } from "@/components/catalog/filters";

export const metadata: Metadata = pageMetadata({
  title: "Vehicle Inventory",
  description: "New and pre-owned SUVs, sedans, luxury, sports, commercial and electric vehicles with verified specifications and availability.",
  path: "/automotive/vehicles",
});

const PAGE_SIZE = 12;

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const keys = ["q", "category", "make", "model", "yearMin", "yearMax", "minPrice", "maxPrice", "condition", "maxMileage", "transmission", "fuel", "body", "availability", "sort"] as const;
  const v = Object.fromEntries(keys.map((k) => [k, firstParam(sp[k])?.slice(0, 60)])) as Record<(typeof keys)[number], string | undefined>;
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);

  const where: Prisma.VehicleWhereInput = { publishStatus: "PUBLISHED" };
  if (v.availability && v.availability in AVAILABILITY_LABELS) where.availability = v.availability as keyof typeof AVAILABILITY_LABELS;
  else where.availability = { not: "SOLD" };
  if (v.category) where.categories = { some: { slug: v.category } };
  if (v.make) where.make = { equals: v.make, mode: "insensitive" };
  if (v.model) where.model = { contains: v.model, mode: "insensitive" };
  const yMin = toInt(v.yearMin);
  const yMax = toInt(v.yearMax);
  if (yMin || yMax) where.year = { ...(yMin ? { gte: yMin } : {}), ...(yMax ? { lte: yMax } : {}) };
  const pMin = toInt(v.minPrice);
  const pMax = toInt(v.maxPrice);
  if (pMin || pMax) where.price = { ...(pMin ? { gte: pMin } : {}), ...(pMax ? { lte: pMax } : {}) };
  if (v.condition && v.condition in CONDITION_LABELS) where.condition = v.condition as keyof typeof CONDITION_LABELS;
  if (v.transmission && v.transmission in TRANSMISSION_LABELS) where.transmission = v.transmission as keyof typeof TRANSMISSION_LABELS;
  if (v.fuel && v.fuel in FUEL_LABELS) where.fuelType = v.fuel as keyof typeof FUEL_LABELS;
  if (v.body && v.body in BODY_LABELS) where.bodyType = v.body as keyof typeof BODY_LABELS;
  const mileage = toInt(v.maxMileage);
  if (mileage) where.mileage = { lte: mileage };
  if (v.q) {
    where.OR = [
      { make: { contains: v.q, mode: "insensitive" } },
      { model: { contains: v.q, mode: "insensitive" } },
      { variant: { contains: v.q, mode: "insensitive" } },
    ];
  }
  const orderBy: Prisma.VehicleOrderByWithRelationInput[] =
    v.sort === "price_asc"
      ? [{ price: "asc" }]
      : v.sort === "price_desc"
        ? [{ price: "desc" }]
        : v.sort === "year_desc"
          ? [{ year: "desc" }]
          : v.sort === "mileage_asc"
            ? [{ mileage: "asc" }]
            : v.sort === "newest"
              ? [{ publishedAt: "desc" }]
              : [{ featured: "desc" }, { publishedAt: "desc" }];

  const [total, vehicles, makes, categories] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: vehicleCardInclude }),
    db.vehicle.findMany({ where: { publishStatus: "PUBLISHED" }, distinct: ["make"], select: { make: true }, orderBy: { make: "asc" } }),
    db.vehicleCategory.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <PageHero eyebrow="Automotive Inventory" title="Vehicles" statement="New and pre-owned vehicles, presented with verified specifications and current availability." crumbs={[{ label: "Automotive", href: "/automotive" }, { label: "Vehicles" }]} size="sm" tone="graphite" />
      <section className="bg-[#f3f3f1] py-12 sm:py-16">
        <div className="shell">
          <FilterBar
            action="/automotive/vehicles"
            values={v}
            fields={[
              { name: "q", label: "Search", type: "text", placeholder: "Make or model" },
              { name: "category", label: "Category", type: "select", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
              { name: "make", label: "Make", type: "select", options: makes.map((m) => ({ value: m.make, label: m.make })) },
              { name: "model", label: "Model", type: "text", placeholder: "Any model" },
              { name: "yearMin", label: "Year from", type: "number", placeholder: "e.g. 2020" },
              { name: "yearMax", label: "Year to", type: "number", placeholder: "e.g. 2025" },
              { name: "minPrice", label: "Min price", type: "number", placeholder: "₦" },
              { name: "maxPrice", label: "Max price", type: "number", placeholder: "₦" },
              { name: "condition", label: "Condition", type: "select", options: opts(CONDITION_LABELS) },
              { name: "maxMileage", label: "Max mileage (km)", type: "number" },
              { name: "transmission", label: "Transmission", type: "select", options: opts(TRANSMISSION_LABELS) },
              { name: "fuel", label: "Fuel type", type: "select", options: opts(FUEL_LABELS) },
              { name: "body", label: "Body type", type: "select", options: opts(BODY_LABELS) },
              { name: "availability", label: "Availability", type: "select", options: opts(AVAILABILITY_LABELS) },
              {
                name: "sort",
                label: "Sort by",
                type: "select",
                options: [
                  { value: "newest", label: "Newest listings" },
                  { value: "price_asc", label: "Price: low to high" },
                  { value: "price_desc", label: "Price: high to low" },
                  { value: "year_desc", label: "Year: newest first" },
                  { value: "mileage_asc", label: "Mileage: lowest first" },
                ],
              },
            ]}
          />
          <div className="mt-10 mb-6">
            <ResultsMeta total={total} label="vehicle" />
          </div>
          {vehicles.length === 0 ? (
            <EmptyState
              title={Object.values(v).some(Boolean) ? "No vehicles match your criteria." : "No vehicles are currently listed."}
              description="Adjust your filters, or let our sourcing team find the exact vehicle you need."
              action={<LinkButton href="/automotive/sourcing" variant="outline" arrow>Request vehicle sourcing</LinkButton>}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((veh, i) => (
                <VehicleCard key={veh.id} vehicle={veh} priority={i < 3} />
              ))}
            </div>
          )}
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/automotive/vehicles" params={v} />
        </div>
      </section>
    </>
  );
}

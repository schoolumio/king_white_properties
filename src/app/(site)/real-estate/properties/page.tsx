import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { propertyCardInclude } from "@/lib/queries";
import { PROPERTY_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo";
import { firstParam, toInt } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/section";
import { LinkButton } from "@/components/ui/button";
import { PropertyCard } from "@/components/catalog/cards";
import { FilterBar, Pagination, ResultsMeta, opts } from "@/components/catalog/filters";

export const metadata: Metadata = pageMetadata({
  title: "Properties for Sale & Lease",
  description: "Search residential, commercial, industrial, land and mixed-use properties for sale and lease.",
  path: "/real-estate/properties",
});

const PAGE_SIZE = 12;
type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function PropertiesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const v = {
    q: firstParam(sp.q)?.slice(0, 80),
    sector: firstParam(sp.sector),
    listing: firstParam(sp.listing),
    location: firstParam(sp.location),
    minPrice: firstParam(sp.minPrice),
    maxPrice: firstParam(sp.maxPrice),
    beds: firstParam(sp.beds),
    status: firstParam(sp.status),
    sort: firstParam(sp.sort),
  };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);

  const where: Prisma.PropertyWhereInput = { publishStatus: "PUBLISHED" };
  if (v.sector && v.sector in SECTOR_LABELS) where.sector = v.sector as keyof typeof SECTOR_LABELS;
  if (v.listing === "SALE") where.listingType = { in: ["SALE", "SALE_OR_LEASE"] };
  if (v.listing === "LEASE") where.listingType = { in: ["LEASE", "SALE_OR_LEASE"] };
  if (v.status && v.status in PROPERTY_STATUS_LABELS) where.status = v.status as keyof typeof PROPERTY_STATUS_LABELS;
  if (v.location) where.location = { slug: v.location };
  const minP = toInt(v.minPrice);
  const maxP = toInt(v.maxPrice);
  if (minP || maxP) where.price = { ...(minP ? { gte: minP } : {}), ...(maxP ? { lte: maxP } : {}) };
  const beds = toInt(v.beds);
  if (beds) where.bedrooms = { gte: beds };
  if (v.q) {
    where.OR = [
      { title: { contains: v.q, mode: "insensitive" } },
      { summary: { contains: v.q, mode: "insensitive" } },
      { address: { contains: v.q, mode: "insensitive" } },
      { location: { name: { contains: v.q, mode: "insensitive" } } },
    ];
  }
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
    v.sort === "price_asc" ? [{ price: "asc" }] : v.sort === "price_desc" ? [{ price: "desc" }] : [{ featured: "desc" }, { publishedAt: "desc" }];

  const [total, properties, locations] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: propertyCardInclude }),
    db.location.findMany({ where: { properties: { some: { publishStatus: "PUBLISHED" } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHero eyebrow="Property Marketplace" title="Properties" statement="Residential, commercial, industrial, land and mixed-use property for sale and lease." crumbs={[{ label: "Real Estate", href: "/real-estate" }, { label: "Properties" }]} size="sm" />
      <section className="bg-surface py-12 sm:py-16">
        <div className="shell">
          <FilterBar
            action="/real-estate/properties"
            values={v}
            fields={[
              { name: "q", label: "Keyword", type: "text", placeholder: "Area, estate or title" },
              { name: "sector", label: "Property category", type: "select", options: opts(SECTOR_LABELS) },
              { name: "listing", label: "Sale or lease", type: "select", options: [{ value: "SALE", label: "For sale" }, { value: "LEASE", label: "For lease" }] },
              { name: "location", label: "Location", type: "select", options: locations.map((l) => ({ value: l.slug, label: [l.name, l.state].filter(Boolean).join(", ") })) },
              { name: "minPrice", label: "Min price", type: "number", placeholder: "₦" },
              { name: "maxPrice", label: "Max price", type: "number", placeholder: "₦" },
              { name: "beds", label: "Bedrooms (min)", type: "select", options: ["1", "2", "3", "4", "5"].map((b) => ({ value: b, label: `${b}+` })) },
              { name: "status", label: "Status", type: "select", options: opts(PROPERTY_STATUS_LABELS) },
              { name: "sort", label: "Sort by", type: "select", options: [{ value: "price_asc", label: "Price: low to high" }, { value: "price_desc", label: "Price: high to low" }] },
            ]}
          />
          <div className="mt-10 mb-6">
            <ResultsMeta total={total} label="property" />
          </div>
          {properties.length === 0 ? (
            <EmptyState
              title={total === 0 && Object.values(v).some(Boolean) ? "No properties match your criteria." : "No properties are currently listed."}
              description="Adjust your filters, or tell us what you are looking for and our real estate team will advise on suitable options."
              action={<LinkButton href="/contact?topic=property" variant="outline" arrow>Send a property brief</LinkButton>}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} priority={i < 3} />
              ))}
            </div>
          )}
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/real-estate/properties" params={v} />
        </div>
      </section>
    </>
  );
}


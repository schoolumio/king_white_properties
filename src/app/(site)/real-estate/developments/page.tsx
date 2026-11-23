import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { projectCardInclude } from "@/lib/queries";
import { PROJECT_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo";
import { firstParam, toInt } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/section";
import { LinkButton } from "@/components/ui/button";
import { ProjectCard } from "@/components/catalog/cards";
import { FilterBar, Pagination, ResultsMeta, opts } from "@/components/catalog/filters";

export const metadata: Metadata = pageMetadata({
  title: "Development Portfolio",
  description: "Completed, ongoing and upcoming real estate developments, and projects available for acquisition.",
  path: "/real-estate/developments",
});

const PAGE_SIZE = 9;

export default async function DevelopmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const v = { status: firstParam(sp.status), sector: firstParam(sp.sector), location: firstParam(sp.location) };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where: Prisma.DevelopmentProjectWhereInput = { publishStatus: "PUBLISHED" };
  if (v.status && v.status in PROJECT_STATUS_LABELS) where.status = v.status as keyof typeof PROJECT_STATUS_LABELS;
  if (v.sector && v.sector in SECTOR_LABELS) where.sector = v.sector as keyof typeof SECTOR_LABELS;
  if (v.location) where.location = { slug: v.location };

  const [total, projects, locations] = await Promise.all([
    db.developmentProject.count({ where }),
    db.developmentProject.findMany({ where, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: projectCardInclude }),
    db.location.findMany({ where: { projects: { some: { publishStatus: "PUBLISHED" } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHero eyebrow="Development Portfolio" title="Developments" statement="Our real estate projects — from upcoming schemes and developments under construction to completed assets and projects available for acquisition." crumbs={[{ label: "Real Estate", href: "/real-estate" }, { label: "Developments" }]} />
      <section className="bg-ivory py-12 sm:py-16">
        <div className="shell">
          <FilterBar
            action="/real-estate/developments"
            values={v}
            fields={[
              { name: "status", label: "Development status", type: "select", options: opts(PROJECT_STATUS_LABELS) },
              { name: "sector", label: "Project type", type: "select", options: opts(SECTOR_LABELS) },
              { name: "location", label: "Location", type: "select", options: locations.map((l) => ({ value: l.slug, label: l.name })) },
            ]}
          />
          <div className="mt-10 mb-8">
            <ResultsMeta total={total} label="development" />
          </div>
          {projects.length === 0 ? (
            <EmptyState
              title="No developments to show."
              description="Project information is published once verified and approved. Contact our development team to discuss current and future projects."
              action={<LinkButton href="/contact?topic=property" variant="outline" arrow>Contact the development team</LinkButton>}
            />
          ) : (
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} priority={i < 3} />
              ))}
            </div>
          )}
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/real-estate/developments" params={v} />
        </div>
      </section>
    </>
  );
}

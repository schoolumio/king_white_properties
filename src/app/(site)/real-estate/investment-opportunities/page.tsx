import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getContent } from "@/lib/content";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/section";
import { LinkButton } from "@/components/ui/button";
import { OpportunityRow } from "@/components/catalog/opportunity";
import { FilterBar, opts } from "@/components/catalog/filters";

export const metadata: Metadata = pageMetadata({
  title: "Real Estate Investment Opportunities",
  description: "Company-approved real estate and infrastructure investment opportunities for qualified investors.",
  path: "/real-estate/investment-opportunities",
});

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const status = firstParam(sp.status);
  const [page, items] = await Promise.all([
    getContent<{ disclaimer: string }>("investments.page"),
    db.investmentOpportunity.findMany({
      where: {
        publishStatus: "PUBLISHED",
        sector: { in: ["REAL_ESTATE", "INFRASTRUCTURE"] },
        ...(status && status in OPPORTUNITY_STATUS_LABELS ? { status: status as keyof typeof OPPORTUNITY_STATUS_LABELS } : {}),
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      include: { location: true },
    }),
  ]);
  return (
    <>
      <PageHero eyebrow="Real Estate Investment" title="Investment Opportunities" statement="Company-approved opportunities within our real estate and infrastructure portfolio. Terms are published only once formally approved." crumbs={[{ label: "Real Estate", href: "/real-estate" }, { label: "Investment Opportunities" }]} />
      <section className="bg-white py-14 sm:py-20">
        <div className="shell">
          <FilterBar action="/real-estate/investment-opportunities" values={{ status }} fields={[{ name: "status", label: "Opportunity status", type: "select", options: opts(OPPORTUNITY_STATUS_LABELS) }]} />
          <div className="mt-12">
            {items.length === 0 ? (
              <EmptyState title="No opportunities are currently published." description="Register your interest and our investor relations team will contact you as opportunities are approved." action={<LinkButton href="/investments#enquiry" variant="outline" arrow>Register interest</LinkButton>} />
            ) : (
              <ul className="border-t border-line">
                {items.map((o, i) => (
                  <OpportunityRow key={o.id} o={o} index={i} />
                ))}
              </ul>
            )}
          </div>
          <p className="mt-12 max-w-3xl border-l-2 border-accent pl-5 text-sm text-ink/55">{page.disclaimer}</p>
        </div>
      </section>
    </>
  );
}

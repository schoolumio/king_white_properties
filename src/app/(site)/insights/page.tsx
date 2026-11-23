import type { Metadata } from "next";
import Link from "next/link";
import type { ArticleType } from "@prisma/client";
import { db } from "@/lib/db";
import { getContent } from "@/lib/content";
import { ARTICLE_TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { cn, firstParam, toInt } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { EmptyState, DemoBadge } from "@/components/ui/section";
import { Pagination } from "@/components/catalog/filters";

export const metadata: Metadata = pageMetadata({
  title: "Insights",
  description: "Corporate announcements, real estate market insights, automotive developments, company news and project updates.",
  path: "/insights",
});

const PAGE_SIZE = 9;

export default async function InsightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const type = firstParam(sp.type);
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where = {
    publishStatus: "PUBLISHED" as const,
    publishedAt: { lte: new Date() },
    ...(type && type in ARTICLE_TYPE_LABELS ? { type: type as ArticleType } : {}),
  };
  const [c, total, articles] = await Promise.all([
    getContent<{ heading: string; intro: string }>("home.insights"),
    db.article.count({ where }),
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { cover: true } }),
  ]);
  const [lead, ...rest] = articles;

  return (
    <>
      <PageHero eyebrow="Insights" title={c.heading} statement={c.intro} crumbs={[{ label: "Insights" }]} />
      <section className="bg-white py-14 sm:py-20">
        <div className="shell">
          <nav aria-label="Insight categories" className="flex flex-wrap gap-2 border-b border-line pb-6">
            {[{ v: "", l: "All" }, ...Object.entries(ARTICLE_TYPE_LABELS).map(([v, l]) => ({ v, l }))].map((t) => (
              <Link
                key={t.v}
                href={t.v ? `/insights?type=${t.v}` : "/insights"}
                className={cn("border px-4 py-2 text-sm", (type ?? "") === t.v ? "border-navy bg-navy text-white" : "border-line text-ink/70 hover:border-navy")}
              >
                {t.l}
              </Link>
            ))}
            <Link href="/insights/publications" className="ml-auto border border-gold px-4 py-2 text-sm text-navy hover:bg-gold">
              Publications
            </Link>
          </nav>

          <div className="mt-12">
            {articles.length === 0 ? (
              <EmptyState title="No insights published yet." description="Corporate announcements, market perspectives and project updates will appear here." />
            ) : (
              <>
                {lead && page === 1 && (
                  <Link href={`/insights/${lead.slug}`} className="group grid gap-8 border-b border-line pb-14 lg:grid-cols-12">
                    <Photo src={mediaUrl(lead.cover)} alt={lead.cover?.alt || lead.title} className="aspect-[16/10] bg-ivory-deep lg:col-span-7" tone="ivory" sizes="(min-width:1024px) 58vw, 100vw" priority fallbackLabel={ARTICLE_TYPE_LABELS[lead.type]} />
                    <div className="lg:col-span-5 lg:pt-6">
                      <p className="text-[11.5px] font-medium tracking-[0.14em] text-steel uppercase">
                        {ARTICLE_TYPE_LABELS[lead.type]} · {formatDate(lead.publishedAt)}
                      </p>
                      <h2 className="display-md mt-4 text-navy group-hover:text-gold-deep">{lead.title}</h2>
                      <p className="mt-5 text-lg text-ink/65">{lead.excerpt}</p>
                      {lead.isDemo && <div className="mt-4"><DemoBadge /></div>}
                    </div>
                  </Link>
                )}
                <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                  {(page === 1 ? rest : articles).map((a) => (
                    <Link key={a.id} href={`/insights/${a.slug}`} className="group block">
                      <Photo src={mediaUrl(a.cover)} alt={a.cover?.alt || a.title} className="aspect-[16/10] bg-ivory-deep" tone="ivory" sizes="(min-width:1024px) 30vw, 100vw" fallbackLabel={ARTICLE_TYPE_LABELS[a.type]} />
                      <p className="mt-5 text-[11.5px] font-medium tracking-[0.14em] text-steel uppercase">
                        {ARTICLE_TYPE_LABELS[a.type]} · {formatDate(a.publishedAt, "short")}
                      </p>
                      <h3 className="mt-2 font-display text-xl font-semibold text-navy group-hover:text-gold-deep">{a.title}</h3>
                      <p className="mt-2 line-clamp-3 text-[15px] text-ink/60">{a.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/insights" params={{ type }} />
        </div>
      </section>
    </>
  );
}

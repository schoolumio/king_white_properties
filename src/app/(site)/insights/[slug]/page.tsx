import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSite } from "@/lib/content";
import { ARTICLE_TYPE_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, JsonLd, pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { Markdown } from "@/components/ui/markdown";
import { DemoBadge } from "@/components/ui/section";
import { ArrowLink } from "@/components/ui/button";

async function load(slug: string) {
  return db.article.findFirst({ where: { slug, publishStatus: "PUBLISHED", publishedAt: { lte: new Date() } }, include: { cover: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await load((await params).slug);
  if (!a) return {};
  return {
    ...pageMetadata({ title: a.metaTitle || a.title, description: a.metaDescription || a.excerpt, path: `/insights/${a.slug}`, image: mediaUrl(a.cover) }),
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug);
  if (!a) notFound();
  const [site, related] = await Promise.all([
    getSite(),
    db.article.findMany({ where: { publishStatus: "PUBLISHED", publishedAt: { lte: new Date() }, id: { not: a.id }, type: a.type }, take: 3, orderBy: { publishedAt: "desc" } }),
  ]);
  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.publishedAt?.toISOString(),
          dateModified: a.updatedAt.toISOString(),
          image: a.cover ? [absoluteUrl(mediaUrl(a.cover)!)] : undefined,
          author: { "@type": a.authorName ? "Person" : "Organization", name: a.authorName || site.companyName },
          publisher: { "@type": "Organization", name: site.companyName },
          mainEntityOfPage: absoluteUrl(`/insights/${a.slug}`),
        }}
      />
      <header className="bg-primary pt-32 pb-16 text-white sm:pt-40 sm:pb-20">
        <div className="shell max-w-4xl">
          <Breadcrumbs items={[{ label: "Insights", href: "/insights" }, { label: a.title }]} />
          <p className="eyebrow eyebrow-light mt-10">{ARTICLE_TYPE_LABELS[a.type]}</p>
          <h1 className="display-lg mt-5">{a.title}</h1>
          <p className="mt-6 text-lg text-white/65">{a.excerpt}</p>
          <p className="mt-8 text-sm text-white/45">
            {formatDate(a.publishedAt)}
            {a.authorName && ` · ${a.authorName}`}
          </p>
          {a.isDemo && <div className="mt-4"><DemoBadge /></div>}
        </div>
      </header>
      {a.cover && (
        <div className="shell -mt-0 max-w-5xl pt-12">
          <Photo src={mediaUrl(a.cover)} alt={a.cover.alt || a.title} className="aspect-[16/9]" sizes="(min-width:1024px) 960px, 100vw" priority />
        </div>
      )}
      <div className="shell max-w-3xl py-16 sm:py-20">
        <Markdown className="text-lg">{a.body}</Markdown>
        <div className="mt-16 border-t border-line pt-8">
          <ArrowLink href="/insights">Back to insights</ArrowLink>
        </div>
      </div>
      {related.length > 0 && (
        <section className="bg-surface py-16">
          <div className="shell">
            <h2 className="eyebrow">Related</h2>
            <ul className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/insights/${r.slug}`} className="group block border-t border-primary pt-5">
                    <p className="text-xs tracking-wide text-muted uppercase">{formatDate(r.publishedAt, "short")}</p>
                    <h3 className="mt-2 font-display text-lg font-semibold text-primary group-hover:text-accent-deep">{r.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}

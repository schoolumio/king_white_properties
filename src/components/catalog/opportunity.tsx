import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight, Download, FileText, Lock, MapPin } from "lucide-react";
import type { InvestmentOpportunity, Location, MediaAsset } from "@prisma/client";
import { db } from "@/lib/db";
import { getContent } from "@/lib/content";
import { formatMoney } from "@/lib/format";
import { OPPORTUNITY_SECTOR_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { downloadUrl, mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { PageHero, type Crumb } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";
import { DemoBadge } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";

export function opportunityHref(o: Pick<InvestmentOpportunity, "slug" | "sector">) {
  return o.sector === "REAL_ESTATE" || o.sector === "INFRASTRUCTURE" ? `/real-estate/investment-opportunities/${o.slug}` : `/investments/opportunities/${o.slug}`;
}

export function OpportunityRow({ o, index }: { o: InvestmentOpportunity & { location: Location | null }; index: number }) {
  return (
    <li className="group border-b border-line">
      <Link href={opportunityHref(o)} className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:gap-8">
        <span className="font-display text-sm text-accent-deep">{String(index + 1).padStart(2, "0")}</span>
        <div>
          <div className="flex flex-wrap items-center gap-3 text-[11.5px] font-medium tracking-[0.14em] text-muted uppercase">
            <span>{OPPORTUNITY_SECTOR_LABELS[o.sector]}</span>
            <span className="h-3 w-px bg-line" aria-hidden />
            <span className="text-primary">{OPPORTUNITY_STATUS_LABELS[o.status]}</span>
            {o.isDemo && <DemoBadge />}
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-primary transition-colors group-hover:text-accent-deep sm:text-2xl">{o.title}</h3>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/65">{o.summary}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink/55">
            {o.investmentStructure && <span>Structure: {o.investmentStructure}</span>}
            {o.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {o.location.name}
                {o.location.state ? `, ${o.location.state}` : ""}
              </span>
            )}
          </div>
        </div>
        <ArrowUpRight className="hidden h-6 w-6 text-primary/30 transition-all group-hover:text-accent-deep sm:block" aria-hidden />
      </Link>
    </li>
  );
}

const include = {
  location: true,
  cover: true,
  project: { select: { name: true, slug: true } },
  documents: { orderBy: { order: "asc" as const }, include: { media: true } },
};

export async function loadOpportunity(slug: string) {
  return db.investmentOpportunity.findFirst({ where: { slug, publishStatus: "PUBLISHED" }, include });
}

export async function opportunityMetadata(slug: string): Promise<Metadata> {
  const o = await loadOpportunity(slug);
  if (!o) return {};
  return pageMetadata({ title: o.title, description: o.summary, path: opportunityHref(o), image: mediaUrl(o.cover) });
}

export async function OpportunityDetail({ slug, crumbs }: { slug: string; crumbs: Crumb[] }) {
  const o = await loadOpportunity(slug);
  if (!o) notFound();
  const page = await getContent<{ disclaimer: string }>("investments.page");
  const showTerms = o.termsApproved;
  const docs = o.documents as (typeof o.documents[number] & { media: MediaAsset })[];

  return (
    <>
      <PageHero eyebrow={`${OPPORTUNITY_SECTOR_LABELS[o.sector]} · ${OPPORTUNITY_STATUS_LABELS[o.status]}`} title={o.title} statement={o.summary} image={mediaUrl(o.cover)} imageAlt={o.cover?.alt ?? o.title} crumbs={[...crumbs, { label: o.title }]} />
      <section className="bg-white py-20 sm:py-28">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {o.isDemo && (
              <div className="mb-8">
                <DemoBadge />
              </div>
            )}
            <h2 className="eyebrow">Opportunity overview</h2>
            <Markdown className="mt-6">{o.description}</Markdown>

            {showTerms && o.termsSummary && (
              <div className="mt-12 border border-line bg-surface p-8">
                <h3 className="font-display text-lg font-semibold text-primary">Approved terms summary</h3>
                <Markdown className="mt-4">{o.termsSummary}</Markdown>
              </div>
            )}

            <div className="mt-12">
              <h3 className="font-display text-xl font-semibold text-primary">Supporting documents</h3>
              {docs.length === 0 ? (
                <p className="mt-3 text-ink/60">Documentation is shared with qualified parties following an initial discussion.</p>
              ) : (
                <ul className="mt-5 divide-y divide-line border-y border-line">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-4 py-4">
                      {d.access === "PUBLIC" ? <FileText className="h-5 w-5 text-accent-deep" strokeWidth={1.5} aria-hidden /> : <Lock className="h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />}
                      <span className="flex-1 font-medium text-primary">{d.title}</span>
                      {d.access === "PUBLIC" && d.media.visibility === "PUBLIC" ? (
                        <a href={downloadUrl(d.media)} className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline decoration-accent underline-offset-4">
                          <Download className="h-4 w-4" aria-hidden /> Download
                        </a>
                      ) : (
                        <a href="#enquiry" className="text-sm text-muted underline underline-offset-4">
                          Available on request
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-12 border-l-2 border-accent pl-5 text-sm leading-relaxed text-ink/55">{o.disclaimer || page.disclaimer}</p>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <dl className="border-t-2 border-primary">
              {[
                ["Sector", OPPORTUNITY_SECTOR_LABELS[o.sector]],
                ["Status", OPPORTUNITY_STATUS_LABELS[o.status]],
                ["Investment structure", o.investmentStructure],
                ["Location", o.location ? [o.location.name, o.location.state, o.location.country].filter(Boolean).join(", ") : null],
                ["Minimum participation", showTerms && o.minimumParticipation ? formatMoney(o.minimumParticipation, o.currency) : null],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-b border-line py-4 text-[15px]">
                    <dt className="text-ink/55">{k}</dt>
                    <dd className="text-right font-medium text-primary">{v}</dd>
                  </div>
                ))}
            </dl>
            {o.project && (
              <Link href={`/real-estate/developments/${o.project.slug}`} className="mt-6 block bg-surface p-6 hover:bg-surface-deep">
                <span className="text-[11px] tracking-[0.2em] text-muted uppercase">Related development</span>
                <span className="mt-1 block font-display font-semibold text-primary">{o.project.name}</span>
              </Link>
            )}
            {o.cover && <Photo src={mediaUrl(o.cover)} alt={o.cover.alt ?? o.title} className="mt-6 aspect-[4/3]" sizes="30vw" />}
          </aside>
        </div>
      </section>
      <section id="enquiry" className="bg-primary py-20 text-white sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow eyebrow-light">Investor enquiry</p>
            <h2 className="display-md mt-6">Discuss this opportunity.</h2>
            <p className="mt-5 text-white/60">Submissions are confidential and reviewed by our investor relations team.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <EnquiryForm formType="investment" fields={PRESETS.investment} defaults={{ relatedId: o.id, interest: o.title }} dark submitLabel="Submit investor enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}

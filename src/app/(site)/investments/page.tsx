import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getContent, getSite, type Titled } from "@/lib/content";
import { openOpportunities } from "@/lib/queries";
import { downloadUrl } from "@/lib/media";
import { PUBLICATION_LABELS } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/section";
import { LinkButton } from "@/components/ui/button";
import { OpportunityRow } from "@/components/catalog/opportunity";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";

type InvPage = { heading: string; intro: string; approach: string; process: Titled[]; disclaimer: string; contactName: string; contactEmail: string; contactPhone: string; image: string; imageAlt: string };

export async function generateMetadata(): Promise<Metadata> {
  const p = await getContent<InvPage>("investments.page");
  return pageMetadata({ title: "Investments", description: p.intro, path: "/investments" });
}

export default async function InvestmentsPage() {
  const [site, page, home, opportunities, documents] = await Promise.all([
    getSite(),
    getContent<InvPage>("investments.page"),
    getContent<{ categories: Titled[] }>("home.investment"),
    openOpportunities(20),
    db.publication
      .findMany({ where: { publishStatus: "PUBLISHED", category: { in: ["CORPORATE_PROFILE", "ANNUAL_REPORT", "RESEARCH"] } }, include: { file: true }, orderBy: { publishedAt: "desc" }, take: 8 })
      .catch(() => []),
  ]);

  return (
    <>
      <PageHero eyebrow="Investor Relations" title={page.heading} statement={page.intro} image={page.image} imageAlt={page.imageAlt} crumbs={[{ label: "Investments" }]} size="lg">
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="#opportunities" variant="gold" arrow>
            View opportunities
          </LinkButton>
          <LinkButton href="#enquiry" variant="outline-light">
            Make an investment enquiry
          </LinkButton>
        </div>
      </PageHero>

      <section className="bg-white py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Our approach</p>
            <h2 className="display-md mt-6 text-navy">Investment overview</h2>
            <Markdown className="mt-8">{page.approach}</Markdown>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="font-display text-sm font-semibold tracking-[0.2em] text-steel uppercase">Areas of engagement</h3>
            <ul className="mt-6 grid gap-px bg-line sm:grid-cols-2">
              {home.categories.map((c) => (
                <li key={c.title} className="bg-white p-6">
                  <p className="font-display font-semibold text-navy">{c.title}</p>
                  <p className="mt-2 text-sm text-ink/60">{c.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-ivory py-24 sm:py-28">
        <div className="shell">
          <p className="eyebrow">Engagement process</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {page.process.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 100} className="relative border-t border-navy pt-6">
                <span className="font-display text-4xl font-semibold text-gold">{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-[15px] text-ink/60">{s.description}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="opportunities" className="bg-white py-24 sm:py-32">
        <div className="shell">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Current opportunities</p>
              <h2 className="display-md mt-6 text-navy">Company-approved opportunities</h2>
            </div>
            <Link href="/real-estate/investment-opportunities" className="text-sm font-semibold text-navy underline decoration-gold underline-offset-4">
              Real estate opportunities
            </Link>
          </div>
          <div className="mt-12">
            {opportunities.length === 0 ? (
              <EmptyState
                title="No opportunities are currently published."
                description="Opportunities are published only after formal approval. Register your interest below and our investor relations team will contact you when suitable opportunities become available."
                action={<LinkButton href="#enquiry" variant="outline" arrow>Register your interest</LinkButton>}
              />
            ) : (
              <ul className="border-t border-line">
                {opportunities.map((o, i) => (
                  <OpportunityRow key={o.id} o={o} index={i} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="bg-ivory py-24 sm:py-28">
        <div className="shell grid gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Documentation</p>
            <h2 className="display-md mt-6 text-navy">Investment documentation</h2>
            <p className="mt-4 text-ink/60">Publicly available corporate documentation. Opportunity-specific materials are provided to qualified parties on request.</p>
            {documents.length === 0 ? (
              <p className="mt-8 border-t border-line pt-6 text-ink/55">Corporate documentation will be available here once published.</p>
            ) : (
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {documents.map((d) => (
                  <li key={d.id}>
                    <a href={downloadUrl(d.file)} className="group flex items-center gap-4 py-5">
                      <FileText className="h-5 w-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                      <span className="flex-1">
                        <span className="block font-display font-semibold text-navy group-hover:text-gold-deep">{d.title}</span>
                        <span className="text-xs tracking-wide text-steel uppercase">{PUBLICATION_LABELS[d.category]}</span>
                      </span>
                      <Download className="h-4 w-4 text-navy/40" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="eyebrow">Investor contact</p>
            <h2 className="display-md mt-6 text-navy">Investor relations</h2>
            <div className="mt-8 bg-white p-8">
              {page.contactName && <p className="font-display text-lg font-semibold text-navy">{page.contactName}</p>}
              <ul className="mt-4 space-y-3 text-[15px]">
                {(page.contactEmail || site.email) && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gold-deep" aria-hidden />
                    <a className="text-navy hover:underline" href={`mailto:${page.contactEmail || site.email}`}>
                      {page.contactEmail || site.email}
                    </a>
                  </li>
                )}
                {(page.contactPhone || site.phone) && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gold-deep" aria-hidden />
                    <a className="text-navy hover:underline" href={`tel:${(page.contactPhone || site.phone).replace(/\s/g, "")}`}>
                      {page.contactPhone || site.phone}
                    </a>
                  </li>
                )}
                {!page.contactEmail && !site.email && !page.contactPhone && !site.phone && <li className="text-ink/55">Please use the enquiry form below.</li>}
              </ul>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-ink/50">{page.disclaimer}</p>
          </div>
        </div>
      </section>

      <section id="enquiry" className="bg-navy py-24 text-white sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow eyebrow-light">Corporate investment enquiry</p>
            <h2 className="display-md mt-6">Begin a confidential conversation.</h2>
            <p className="mt-5 text-white/60">Your submission is stored securely, is never published and is visible only to authorised investor relations staff.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <EnquiryForm formType="investment" fields={PRESETS.investment} dark submitLabel="Submit investor enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}

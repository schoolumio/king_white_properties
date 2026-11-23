import type { Metadata } from "next";
import { getContent, type Titled } from "@/lib/content";
import { catalogueCounts, featuredProjects, featuredProperties, openOpportunities } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/ui/markdown";
import { ArrowLink, LinkButton } from "@/components/ui/button";
import { EmptyState, SectionHeader } from "@/components/ui/section";
import { ProjectCard, PropertyCard } from "@/components/catalog/cards";
import { OpportunityRow } from "@/components/catalog/opportunity";

export const revalidate = 300;

type RE = {
  heading: string;
  statement: string;
  image: string;
  imageAlt: string;
  intro: string;
  capabilities: Titled[];
  managementHeading: string;
  managementBody: string;
  managementServices: string[];
  partnershipHeading: string;
  partnershipBody: string;
  image2: string;
  image2Alt: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent<RE>("realEstate.landing");
  return pageMetadata({ title: "Real Estate & Infrastructure", description: c.statement, path: "/real-estate" });
}

export default async function RealEstatePage() {
  const [c, projects, properties, opportunities, counts] = await Promise.all([
    getContent<RE>("realEstate.landing"),
    featuredProjects(3),
    featuredProperties(3),
    openOpportunities(3, { in: ["REAL_ESTATE", "INFRASTRUCTURE"] }),
    catalogueCounts(),
  ]);

  return (
    <>
      <PageHero eyebrow="Division 01" title={c.heading} statement={c.statement} image={c.image} imageAlt={c.imageAlt} crumbs={[{ label: "Real Estate" }]} size="lg">
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/real-estate/properties" variant="accent" arrow>
            Browse properties
          </LinkButton>
          <LinkButton href="/real-estate/developments" variant="outline-light">
            Our developments
          </LinkButton>
        </div>
      </PageHero>

      <nav aria-label="Real estate sections" className="sticky top-[72px] z-30 border-b border-line bg-white/95 backdrop-blur">
        <ul className="shell flex gap-8 overflow-x-auto text-sm font-medium whitespace-nowrap text-ink/60">
          {[
            ["Overview", "#overview"],
            [`Properties${counts.properties ? ` (${counts.properties})` : ""}`, "/real-estate/properties"],
            [`Developments${counts.projects ? ` (${counts.projects})` : ""}`, "/real-estate/developments"],
            ["Investment Opportunities", "/real-estate/investment-opportunities"],
            ["Property Management", "#management"],
            ["Partnerships", "#partnerships"],
          ].map(([l, h]) => (
            <li key={h}>
              <a href={h} className="block py-4 hover:text-primary">
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="overview" className="bg-white py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">The Division</p>
            <Markdown className="mt-8 text-lg">{c.intro}</Markdown>
          </Reveal>
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-7">
            {c.capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={(i % 2) * 100} className="border-t border-primary pt-5">
                <h3 className="font-display text-lg font-semibold text-primary">{cap.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{cap.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-24 sm:py-32">
        <div className="shell">
          <SectionHeader eyebrow="Developments" heading="Featured developments" align="split" action={<ArrowLink href="/real-estate/developments">Full development portfolio</ArrowLink>} />
          <div className="mt-14">
            {projects.length === 0 ? (
              <EmptyState title="Development portfolio coming soon." description="Verified project information will be published here. Contact our real estate team to discuss current developments." />
            ) : (
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="shell">
          <SectionHeader eyebrow="Available Properties" heading="Homes, workplaces and land." align="split" action={<ArrowLink href="/real-estate/properties">Search all properties</ArrowLink>} />
          <div className="mt-14">
            {properties.length === 0 ? (
              <EmptyState title="Available properties will be listed here." description="Listings are published once availability and documentation have been verified." action={<LinkButton href="/contact?topic=property" variant="outline" arrow>Tell us what you are looking for</LinkButton>} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-primary py-24 text-white sm:py-32">
        <div className="shell">
          <SectionHeader light eyebrow="Investment" heading="Real estate investment opportunities" intro="Company-approved opportunities for qualified investors and partners." align="split" action={<ArrowLink href="/real-estate/investment-opportunities" light>All opportunities</ArrowLink>} />
          <div className="mt-12">
            {opportunities.length === 0 ? (
              <EmptyState light title="No opportunities are currently published." description="Register your interest and our investor relations team will contact you as opportunities are approved." action={<LinkButton href="/investments#enquiry" variant="outline-light" arrow>Register interest</LinkButton>} />
            ) : (
              <ul className="border-t border-white/15 [&_a]:text-white [&_h3]:text-white [&_p]:text-white/60 [&_li]:border-white/15">
                {opportunities.map((o, i) => (
                  <OpportunityRow key={o.id} o={o} index={i} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section id="management" className="bg-surface py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <Photo src={c.image2} alt={c.image2Alt} className="aspect-[4/3] bg-primary" sizes="(min-width:1024px) 50vw, 100vw" />
          </Reveal>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow">Services</p>
            <h2 className="display-md mt-6 text-primary">{c.managementHeading}</h2>
            <p className="mt-5 text-lg text-ink/65">{c.managementBody}</p>
            <ul className="mt-8 space-y-3">
              {c.managementServices.map((s) => (
                <li key={s} className="flex items-center gap-3 text-ink/80">
                  <span className="h-px w-5 bg-accent" aria-hidden /> {s}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <LinkButton href="/contact?topic=property" variant="outline" arrow>
                Discuss property management
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section id="partnerships" className="bg-white py-24 sm:py-28">
        <div className="shell flex flex-col justify-between gap-10 border-y border-line py-14 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Development partnerships</p>
            <h2 className="display-md mt-5 text-primary">{c.partnershipHeading}</h2>
            <p className="mt-4 text-lg text-ink/65">{c.partnershipBody}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/partnerships#proposal" arrow>
              Submit a proposal
            </LinkButton>
            <LinkButton href="/contact?topic=property" variant="outline">
              Real estate enquiry
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowDownRight, Download, FileText } from "lucide-react";
import { getContent, getSite, type Cta, type Titled } from "@/lib/content";
import { featuredProjects, featuredVehicles, latestArticles, latestPublications, publishedLeadership } from "@/lib/queries";
import { ARTICLE_TYPE_LABELS, PUBLICATION_LABELS } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { downloadUrl, mediaUrl } from "@/lib/media";
import { absoluteUrl, JsonLd } from "@/lib/seo";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { ArrowLink, LinkButton } from "@/components/ui/button";
import { EmptyState, SectionHeader } from "@/components/ui/section";
import { Markdown } from "@/components/ui/markdown";
import { ProjectCard, VehicleCard } from "@/components/catalog/cards";

export const revalidate = 300;

type Hero = { eyebrow: string; headline: string[]; statement: string; primaryCta: Cta; secondaryCta: Cta; imagePrimary: string; imagePrimaryAlt: string; imageSecondary: string; imageSecondaryAlt: string };
type Intro = { eyebrow: string; heading: string; lead: string; body: string; image: string; imageAlt: string; linkLabel: string };
type DivisionBlock = { title: string; description: string; capabilities: string[]; image: string; imageAlt: string };
type Divisions = { eyebrow: string; heading: string; intro: string; realEstate: DivisionBlock; automotive: DivisionBlock };
type Featured = { developmentsHeading: string; developmentsIntro: string; vehiclesHeading: string; vehiclesIntro: string };
type Investment = { eyebrow: string; heading: string; intro: string; categories: Titled[]; image: string; imageAlt: string };
type Principles = { eyebrow: string; heading: string; intro: string; items: Titled[] };
type Governance = { eyebrow: string; heading: string; intro: string; pillars: Titled[] };
type Insights = { eyebrow: string; heading: string; intro: string };
type ClosingCta = { heading: string; statement: string; primaryCta: Cta; secondaryCta: Cta; image: string; imageAlt: string };

export default async function HomePage() {
  const [site, hero, intro, divisions, featured, investment, principles, governance, insights, cta, projects, vehicles, articles, publications, leaders] =
    await Promise.all([
      getSite(),
      getContent<Hero>("home.hero"),
      getContent<Intro>("home.intro"),
      getContent<Divisions>("home.divisions"),
      getContent<Featured>("home.featured"),
      getContent<Investment>("home.investment"),
      getContent<Principles>("home.principles"),
      getContent<Governance>("home.governance"),
      getContent<Insights>("home.insights"),
      getContent<ClosingCta>("home.cta"),
      featuredProjects(3),
      featuredVehicles(3),
      latestArticles(3),
      latestPublications(3),
      publishedLeadership(),
    ]);

  const executives = leaders.filter((l) => l.group !== "MANAGEMENT").slice(0, 4);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.companyName,
          url: absoluteUrl("/"),
          description: site.description,
          slogan: site.tagline,
          ...(site.email ? { email: site.email } : {}),
          ...(site.phone ? { telephone: site.phone } : {}),
          ...(site.address ? { address: site.address } : {}),
          sameAs: Object.values(site.socials ?? {}).filter(Boolean),
        }}
      />

      {/* ─────────────────────────── 1. Hero */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-navy text-white" aria-labelledby="hero-heading">
        <div className="absolute inset-0 lg:left-auto lg:w-[52%]">
          <Photo src={hero.imagePrimary} alt={hero.imagePrimaryAlt} className="h-full w-full" imgClassName="hero-zoom" priority sizes="(min-width:1024px) 52vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/40 lg:bg-gradient-to-r lg:from-navy lg:via-navy/25 lg:to-transparent" />
        </div>
        <div className="grain absolute inset-0 opacity-30" aria-hidden />

        <div className="shell relative flex min-h-[100svh] flex-col pt-32 pb-10 lg:pt-40">
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="eyebrow eyebrow-light rise">{hero.eyebrow}</p>
              <h1 id="hero-heading" className="display-xl mt-7">
                {hero.headline.map((line, i) => (
                  <span
                    key={i}
                    className={`rise block ${i === hero.headline.length - 1 ? "serif-accent text-gold-soft" : ""}`}
                    style={{ animationDelay: `${150 + i * 120}ms` }}
                  >
                    {line}
                  </span>
                ))}
              </h1>
              <p className="rise mt-8 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl" style={{ animationDelay: "560ms" }}>
                {hero.statement}
              </p>
              <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "680ms" }}>
                <LinkButton href={hero.primaryCta.href} variant="gold" size="lg" arrow>
                  {hero.primaryCta.label}
                </LinkButton>
                <LinkButton href={hero.secondaryCta.href} variant="outline-light" size="lg">
                  {hero.secondaryCta.label}
                </LinkButton>
              </div>
            </div>

            <div className="relative hidden lg:col-span-5 lg:block">
              <div className="rise absolute right-0 -bottom-44 w-[78%]" style={{ animationDelay: "800ms" }}>
                <div className="absolute -top-3 -left-3 h-full w-full border border-gold/60" aria-hidden />
                <Photo src={hero.imageSecondary} alt={hero.imageSecondaryAlt} className="aspect-[4/3] bg-graphite shadow-2xl shadow-black/40" sizes="30vw" priority />
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-px border-t border-white/15 sm:grid-cols-2 lg:mt-20 lg:w-[58%]">
            {[
              { n: "01", label: "Real Estate & Infrastructure", href: "/real-estate" },
              { n: "02", label: "Automotive & Mobility", href: "/automotive" },
            ].map((d) => (
              <Link key={d.href} href={d.href} className="group flex items-center justify-between gap-4 py-5 pr-6 transition-colors hover:text-gold-soft">
                <span className="flex items-baseline gap-4">
                  <span className="font-display text-xs text-gold-soft">{d.n}</span>
                  <span className="font-display text-[15px] font-semibold">{d.label}</span>
                </span>
                <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 2. Corporate introduction */}
      <section className="bg-ivory py-24 sm:py-32" aria-labelledby="intro-heading">
        <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <Photo src={intro.image} alt={intro.imageAlt} className="aspect-[4/5] bg-navy" sizes="(min-width:1024px) 40vw, 100vw" />
            <p className="mt-4 text-xs tracking-wide text-steel">{site.companyName} — {site.country}</p>
          </Reveal>
          <Reveal className="lg:col-span-6 lg:col-start-7 lg:pt-10" delay={120}>
            <p className="eyebrow">{intro.eyebrow}</p>
            <h2 id="intro-heading" className="display-lg mt-6 text-navy">
              {intro.heading}
            </h2>
            <p className="mt-8 font-serif text-2xl leading-snug text-navy/85 italic sm:text-[1.7rem]">{intro.lead}</p>
            <div className="mt-8">
              <Markdown>{intro.body}</Markdown>
            </div>
            <div className="mt-10 grid grid-cols-2 border-t border-line">
              <div className="border-r border-line py-6 pr-6">
                <p className="font-display text-xs text-gold-deep">01</p>
                <p className="mt-2 font-display font-semibold text-navy">Real Estate & Infrastructure</p>
              </div>
              <div className="py-6 pl-6">
                <p className="font-display text-xs text-gold-deep">02</p>
                <p className="mt-2 font-display font-semibold text-navy">Automotive & Mobility</p>
              </div>
            </div>
            <div className="mt-8">
              <ArrowLink href="/about">{intro.linkLabel}</ArrowLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────── 3. Business divisions */}
      <section id="divisions" className="bg-white py-24 sm:py-32" aria-labelledby="divisions-heading">
        <div className="shell">
          <Reveal>
            <SectionHeader eyebrow={divisions.eyebrow} heading={divisions.heading} intro={divisions.intro} align="split" />
          </Reveal>
          <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <DivisionPanel n="01" block={divisions.realEstate} href="/real-estate" cta="Explore Real Estate" tone="light" />
            <DivisionPanel n="02" block={divisions.automotive} href="/automotive" cta="Explore Automotive" tone="dark" />
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 4. Featured developments */}
      <section className="bg-ivory py-24 sm:py-32" aria-labelledby="developments-heading">
        <div className="shell">
          <Reveal>
            <SectionHeader
              eyebrow="Real Estate Portfolio"
              heading={featured.developmentsHeading}
              intro={featured.developmentsIntro}
              align="split"
              action={<ArrowLink href="/real-estate/developments">View all developments</ArrowLink>}
            />
          </Reveal>
          <div className="mt-16">
            {projects.length === 0 ? (
              <EmptyState
                title="Our development portfolio is being prepared for publication."
                description="Project information will appear here once it has been verified and approved for release. To discuss current or upcoming developments, please contact our real estate team."
                action={<LinkButton href="/contact" variant="outline" arrow>Contact the real estate team</LinkButton>}
              />
            ) : (
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                <Reveal className="lg:col-span-7">
                  <ProjectCard project={projects[0]} size="lg" />
                </Reveal>
                <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 lg:gap-8">
                  {projects.slice(1, 3).map((p, i) => (
                    <Reveal key={p.id} delay={120 * (i + 1)}>
                      <ProjectCard project={p} />
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 5. Featured vehicles */}
      <section className="relative overflow-hidden bg-graphite py-24 text-white sm:py-32" aria-labelledby="vehicles-heading">
        <div className="shell relative">
          <Reveal>
            <SectionHeader
              eyebrow="Automotive Inventory"
              heading={featured.vehiclesHeading}
              intro={featured.vehiclesIntro}
              align="split"
              light
              action={<ArrowLink href="/automotive/vehicles" light>View full inventory</ArrowLink>}
            />
          </Reveal>
          <div className="mt-16">
            {vehicles.length === 0 ? (
              <EmptyState
                light
                title="Current inventory will be published here."
                description="Vehicles appear once specifications and availability have been verified. Our sourcing team can locate a specific vehicle for you in the meantime."
                action={<LinkButton href="/automotive/sourcing" variant="outline-light" arrow>Request a vehicle</LinkButton>}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((v, i) => (
                  <Reveal key={v.id} delay={i * 100}>
                    <VehicleCard vehicle={v} dark />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 6. Investment & strategic opportunities */}
      <section className="relative overflow-hidden bg-navy py-24 text-white sm:py-32" aria-labelledby="investment-heading">
        <div className="grain absolute inset-0 opacity-40" aria-hidden />
        <div className="shell relative grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow eyebrow-light">{investment.eyebrow}</p>
            <h2 id="investment-heading" className="display-lg mt-6">
              {investment.heading}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/65">{investment.intro}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <LinkButton href="/investments" variant="gold" arrow>
                Explore Investment Opportunities
              </LinkButton>
              <LinkButton href="/partnerships#proposal" variant="outline-light">
                Submit a Partnership Proposal
              </LinkButton>
            </div>
            <Photo src={investment.image} alt={investment.imageAlt} className="mt-14 hidden aspect-[16/10] bg-navy-deep lg:block" sizes="35vw" />
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <ol className="border-t border-white/15">
              {investment.categories.map((c, i) => (
                <Reveal as="li" key={c.title} delay={i * 60} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-white/15 py-7 sm:grid-cols-[4rem_1fr]">
                  <span className="font-display text-sm text-gold-soft">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold sm:text-xl">{c.title}</h3>
                    {c.description && <p className="mt-2 text-[15px] leading-relaxed text-white/55">{c.description}</p>}
                  </div>
                </Reveal>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-relaxed text-white/40">
              Opportunities are subject to company approval, due diligence and formal documentation. No returns are guaranteed.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 7. Why the company */}
      <section className="bg-white py-24 sm:py-32" aria-labelledby="principles-heading">
        <div className="shell">
          <Reveal>
            <SectionHeader eyebrow={principles.eyebrow} heading={principles.heading} intro={principles.intro} align="split" />
          </Reveal>
          <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {principles.items.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 100}>
                <div className="border-t border-navy pt-6">
                  <span className="font-display text-xs font-semibold tracking-[0.2em] text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-navy sm:text-2xl">{p.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/65">{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 8. Governance & leadership */}
      <section className="bg-ivory py-24 sm:py-32" aria-labelledby="governance-heading">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{governance.eyebrow}</p>
            <h2 id="governance-heading" className="display-lg mt-6 text-navy">
              {governance.heading}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink/65">{governance.intro}</p>
            <ul className="mt-10 border-t border-line">
              {governance.pillars.map((p) => (
                <li key={p.title} className="border-b border-line py-5">
                  <h3 className="font-display font-semibold text-navy">{p.title}</h3>
                  <p className="mt-1 text-[14.5px] text-ink/60">{p.description}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ArrowLink href="/about/governance">Leadership & governance</ArrowLink>
            </div>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            {executives.length === 0 ? (
              <EmptyState
                title="Leadership profiles"
                description="Profiles of the group's executive leadership and board will be published here once approved for release."
                className="h-full"
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                {executives.map((l, i) => (
                  <Reveal key={l.id} delay={i * 100} className={i % 2 === 1 ? "sm:mt-16" : ""}>
                    <Link href="/about/governance#leadership" className="group block">
                      <Photo src={mediaUrl(l.photo)} alt={`Portrait of ${l.name}`} className="aspect-[4/5] bg-navy" tone="ivory" sizes="(min-width:1024px) 22vw, 50vw" imgClassName="grayscale transition duration-700 group-hover:grayscale-0" />
                      <h3 className="mt-4 font-display text-lg font-semibold text-navy">{l.name}</h3>
                      <p className="text-sm text-ink/60">{l.position}</p>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 9. Insights & publications */}
      <section className="bg-white py-24 sm:py-32" aria-labelledby="insights-heading">
        <div className="shell">
          <Reveal>
            <SectionHeader
              eyebrow={insights.eyebrow}
              heading={insights.heading}
              intro={insights.intro}
              align="split"
              action={<ArrowLink href="/insights">All insights</ArrowLink>}
            />
          </Reveal>
          <div className="mt-16 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {articles.length === 0 ? (
                <EmptyState title="Insights are on their way." description="Corporate announcements, market perspectives and project updates will be published here." />
              ) : (
                <div className="grid gap-10 md:grid-cols-2">
                  {articles.slice(0, 2).map((a, i) => (
                    <Reveal key={a.id} delay={i * 100}>
                      <Link href={`/insights/${a.slug}`} className="group block">
                        <Photo src={mediaUrl(a.cover)} alt={a.cover?.alt || a.title} className="aspect-[16/10] bg-ivory-deep" tone="ivory" sizes="(min-width:1024px) 30vw, 100vw" fallbackLabel={ARTICLE_TYPE_LABELS[a.type]} imgClassName="transition-transform duration-[1.4s] group-hover:scale-[1.03]" />
                        <p className="mt-5 text-[11.5px] font-medium tracking-[0.14em] text-steel uppercase">
                          {ARTICLE_TYPE_LABELS[a.type]} · {formatDate(a.publishedAt, "short")}
                        </p>
                        <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-navy group-hover:text-gold-deep">{a.title}</h3>
                        <p className="mt-3 line-clamp-2 text-[15px] text-ink/60">{a.excerpt}</p>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
            <aside className="lg:col-span-4" aria-label="Corporate publications">
              <div className="h-full bg-ivory p-8">
                <h3 className="font-display text-[11px] font-semibold tracking-[0.28em] text-gold-deep uppercase">Corporate Publications</h3>
                {publications.length === 0 ? (
                  <p className="mt-6 text-[15px] leading-relaxed text-ink/60">Corporate profiles, brochures and policies will be available for download here.</p>
                ) : (
                  <ul className="mt-6 divide-y divide-line">
                    {publications.map((p) => (
                      <li key={p.id}>
                        <a href={downloadUrl(p.file)} className="group flex items-start gap-4 py-5">
                          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                          <span className="flex-1">
                            <span className="block font-display font-semibold text-navy group-hover:text-gold-deep">{p.title}</span>
                            <span className="mt-1 block text-xs tracking-wide text-steel uppercase">{PUBLICATION_LABELS[p.category]} · PDF</span>
                          </span>
                          <Download className="h-4 w-4 text-navy/40 group-hover:text-navy" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6">
                  <ArrowLink href="/insights/publications">All publications</ArrowLink>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── 10. Corporate call to action */}
      <section className="relative isolate overflow-hidden bg-navy text-white" aria-labelledby="cta-heading">
        <Photo src={cta.image} alt={cta.imageAlt} className="absolute inset-0 -z-10" sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-navy/85" />
        <div className="shell py-28 sm:py-40">
          <Reveal className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-10 h-14 w-px bg-gold" aria-hidden />
            <h2 id="cta-heading" className="display-lg">
              {cta.heading}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/70">{cta.statement}</p>
            <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkButton href={cta.primaryCta.href} variant="gold" size="lg" arrow>
                {cta.primaryCta.label}
              </LinkButton>
              <LinkButton href={cta.secondaryCta.href} variant="outline-light" size="lg">
                {cta.secondaryCta.label}
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function DivisionPanel({ n, block, href, cta, tone }: { n: string; block: DivisionBlock; href: string; cta: string; tone: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Reveal delay={dark ? 150 : 0} className={dark ? "bg-graphite text-white" : "bg-ivory text-navy"}>
      <Link href={href} className="group relative block overflow-hidden" aria-label={cta}>
        <Photo src={block.image} alt={block.imageAlt} className="aspect-[16/11] bg-navy" sizes="(min-width:1024px) 48vw, 100vw" imgClassName="transition-transform duration-[1.8s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute bottom-6 left-6 font-display text-6xl font-semibold text-white/90 sm:text-7xl">{n}</span>
      </Link>
      <div className="p-7 sm:p-10">
        <h3 className="font-display text-2xl font-semibold sm:text-3xl">{block.title}</h3>
        <p className={`mt-4 text-[15.5px] leading-relaxed ${dark ? "text-white/65" : "text-ink/65"}`}>{block.description}</p>
        <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {block.capabilities.map((c) => (
            <li key={c} className={`flex items-center gap-3 text-[14.5px] ${dark ? "text-white/80" : "text-ink/80"}`}>
              <span className={`h-px w-4 shrink-0 ${dark ? "bg-gold-soft" : "bg-gold"}`} aria-hidden />
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <LinkButton href={href} variant={dark ? "outline-light" : "outline"} arrow>
            {cta}
          </LinkButton>
        </div>
      </div>
    </Reveal>
  );
}


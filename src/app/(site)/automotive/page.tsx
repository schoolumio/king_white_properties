import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getContent, type Titled } from "@/lib/content";
import { vehicleCardInclude } from "@/lib/queries";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/ui/markdown";
import { ArrowLink, LinkButton } from "@/components/ui/button";
import { EmptyState, SectionHeader } from "@/components/ui/section";
import { VehicleCard } from "@/components/catalog/cards";

export const revalidate = 300;

type Auto = {
  heading: string;
  statement: string;
  image: string;
  imageAlt: string;
  intro: string;
  capabilities: Titled[];
  sourcingHeading: string;
  sourcingBody: string;
  leasingHeading: string;
  leasingBody: string;
  image2: string;
  image2Alt: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent<Auto>("automotive.landing");
  return pageMetadata({ title: "Automotive & Mobility", description: c.statement, path: "/automotive" });
}

const live = { publishStatus: "PUBLISHED" as const, availability: { not: "SOLD" as const } };

export default async function AutomotivePage() {
  const [c, featured, arrivals, premium, commercial, categories] = await Promise.all([
    getContent<Auto>("automotive.landing"),
    db.vehicle.findMany({ where: { ...live, featured: true }, take: 3, orderBy: { publishedAt: "desc" }, include: vehicleCardInclude }).catch(() => []),
    db.vehicle.findMany({ where: live, take: 4, orderBy: { publishedAt: "desc" }, include: vehicleCardInclude }).catch(() => []),
    db.vehicle.findMany({ where: { ...live, categories: { some: { slug: { in: ["luxury-vehicles", "sports-cars"] } } } }, take: 3, orderBy: { price: "desc" }, include: vehicleCardInclude }).catch(() => []),
    db.vehicle
      .findMany({ where: { ...live, OR: [{ bodyType: { in: ["PICKUP", "VAN", "TRUCK", "BUS"] } }, { categories: { some: { slug: { in: ["commercial-vehicles", "trucks", "buses"] } } } }] }, take: 3, orderBy: { publishedAt: "desc" }, include: vehicleCardInclude })
      .catch(() => []),
    db.vehicleCategory.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { vehicles: { where: live } } } } }).catch(() => []),
  ]);
  const hero = featured.length ? featured : arrivals.slice(0, 3);

  return (
    <>
      <PageHero eyebrow="Division 02" title={c.heading} statement={c.statement} image={c.image} imageAlt={c.imageAlt} crumbs={[{ label: "Automotive" }]} size="lg" tone="graphite">
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/automotive/vehicles" variant="gold" arrow>
            View inventory
          </LinkButton>
          <LinkButton href="/automotive/fleet-solutions" variant="outline-light">
            Corporate fleet solutions
          </LinkButton>
        </div>
      </PageHero>

      <section className="bg-graphite pb-6 text-white">
        <ul className="shell flex gap-2 overflow-x-auto border-t border-white/10 pt-6 pb-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link href={`/automotive/vehicles?category=${cat.slug}`} className="flex items-center gap-2 border border-white/15 px-4 py-2.5 text-sm whitespace-nowrap text-white/75 transition-colors hover:border-gold-soft hover:text-white">
                {cat.name}
                {cat._count.vehicles > 0 && <span className="text-xs text-gold-soft">{cat._count.vehicles}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">The Division</p>
            <Markdown className="mt-8 text-lg">{c.intro}</Markdown>
          </Reveal>
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:col-span-7">
            {c.capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={(i % 2) * 100} className="border-t border-graphite pt-5">
                <h3 className="font-display text-lg font-semibold text-navy">{cap.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{cap.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite py-24 text-white sm:py-32">
        <div className="shell">
          <SectionHeader light eyebrow="Featured" heading="Featured vehicles" align="split" action={<ArrowLink href="/automotive/vehicles" light>Full inventory</ArrowLink>} />
          <div className="mt-14">
            {hero.length === 0 ? (
              <EmptyState light title="Inventory will be published here." description="Vehicles appear once specifications and availability are verified. Our sourcing team can locate a vehicle for you." action={<LinkButton href="/automotive/sourcing" variant="outline-light" arrow>Request a vehicle</LinkButton>} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {hero.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} dark />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="bg-white py-24 sm:py-28">
          <div className="shell">
            <SectionHeader eyebrow="New arrivals" heading="Recently added" align="split" action={<ArrowLink href="/automotive/vehicles?sort=newest">See latest</ArrowLink>} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {arrivals.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(premium.length > 0 || commercial.length > 0) && (
        <section className="bg-ivory py-24 sm:py-28">
          <div className="shell space-y-20">
            {premium.length > 0 && (
              <div>
                <SectionHeader eyebrow="Premium" heading="Premium & luxury vehicles" align="split" action={<ArrowLink href="/automotive/vehicles?category=luxury-vehicles">All premium vehicles</ArrowLink>} />
                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {premium.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </div>
            )}
            {commercial.length > 0 && (
              <div>
                <SectionHeader eyebrow="Commercial" heading="Commercial vehicles" align="split" action={<ArrowLink href="/automotive/vehicles?category=commercial-vehicles">All commercial vehicles</ArrowLink>} />
                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {commercial.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden bg-navy text-white">
        <div className="shell grid gap-0 lg:grid-cols-2">
          <div className="py-24 lg:py-32 lg:pr-16">
            <p className="eyebrow eyebrow-light">B2B Mobility</p>
            <h2 className="display-md mt-6">Corporate fleet solutions</h2>
            <p className="mt-5 text-lg text-white/65">Structured vehicle procurement for organisations — executive cars, commercial vehicles and full fleet programmes, quoted and delivered by one accountable team.</p>
            <div className="mt-10">
              <LinkButton href="/automotive/fleet-solutions" variant="gold" arrow>
                Explore fleet solutions
              </LinkButton>
            </div>
          </div>
          <Photo src={c.image2} alt={c.image2Alt} className="-mx-5 aspect-[4/3] sm:-mx-8 lg:mx-0 lg:aspect-auto lg:min-h-full" sizes="50vw" />
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28">
        <div className="shell grid gap-px bg-line lg:grid-cols-2">
          <div className="bg-white p-8 sm:p-12">
            <p className="eyebrow">Vehicle sourcing</p>
            <h2 className="mt-5 font-display text-2xl font-semibold text-navy sm:text-3xl">{c.sourcingHeading}</h2>
            <p className="mt-4 text-ink/65">{c.sourcingBody}</p>
            <div className="mt-8">
              <LinkButton href="/automotive/sourcing" arrow>
                Submit a sourcing request
              </LinkButton>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-12">
            <p className="eyebrow">Leasing</p>
            <h2 className="mt-5 font-display text-2xl font-semibold text-navy sm:text-3xl">{c.leasingHeading}</h2>
            <p className="mt-4 text-ink/65">{c.leasingBody}</p>
            <div className="mt-8">
              <LinkButton href="/contact?topic=automotive" variant="outline" arrow>
                Automotive enquiry
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

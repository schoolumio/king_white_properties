import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { formatNumber, formatPrice } from "@/lib/format";
import { AVAILABILITY_LABELS, BODY_LABELS, CONDITION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, JsonLd, pageMetadata } from "@/lib/seo";
import { vehicleCardInclude } from "@/lib/queries";
import { Breadcrumbs } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";
import { DemoBadge } from "@/components/ui/section";
import { Gallery } from "@/components/catalog/gallery";
import { EnquiryTabs } from "@/components/catalog/enquiry-tabs";
import { VehicleCard } from "@/components/catalog/cards";
import { PRESETS } from "@/components/forms/presets";

async function load(slug: string) {
  return db.vehicle.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: { images: { orderBy: { order: "asc" }, include: { media: true } }, categories: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await load((await params).slug);
  if (!v) return {};
  const name = `${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}`;
  return pageMetadata({ title: v.metaTitle || name, description: v.metaDescription || v.summary || `${name} — ${CONDITION_LABELS[v.condition]}`, path: `/automotive/vehicles/${v.slug}`, image: mediaUrl(v.images[0]?.media) });
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const v = await load((await params).slug);
  if (!v) notFound();
  const name = `${v.make} ${v.model}`;
  const specs = (Array.isArray(v.specifications) ? v.specifications : []) as { label: string; value: string }[];
  const keyFacts = [
    ["Year", String(v.year)],
    ["Condition", CONDITION_LABELS[v.condition]],
    ["Mileage", v.mileage !== null ? `${formatNumber(v.mileage)} ${v.mileageUnit}` : "—"],
    ["Transmission", TRANSMISSION_LABELS[v.transmission]],
    ["Fuel", FUEL_LABELS[v.fuelType]],
    ["Body", BODY_LABELS[v.bodyType]],
  ];
  const detailed = [
    ["Engine", v.engine],
    ["Power", v.horsepower ? `${v.horsepower} hp` : null],
    ["Drivetrain", v.drivetrain],
    ["Seats", v.seats?.toString()],
    ["Exterior colour", v.exteriorColour],
    ["Interior colour", v.interiorColour],
    ["Location", v.location],
    ...specs.map((s) => [s.label, s.value]),
  ].filter(([, val]) => val) as [string, string][];
  const enquirable = v.availability !== "SOLD";

  const similar = await db.vehicle.findMany({
    where: { publishStatus: "PUBLISHED", id: { not: v.id }, availability: { not: "SOLD" }, OR: [{ make: v.make }, { bodyType: v.bodyType }] },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: vehicleCardInclude,
  });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Car",
          name: `${v.year} ${name}`,
          brand: { "@type": "Brand", name: v.make },
          model: v.model,
          vehicleModelDate: String(v.year),
          fuelType: FUEL_LABELS[v.fuelType],
          vehicleTransmission: TRANSMISSION_LABELS[v.transmission],
          ...(v.mileage !== null ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: v.mileageUnit === "mi" ? "SMI" : "KMT" } } : {}),
          image: v.images.map((i) => absoluteUrl(mediaUrl(i.media)!)),
          url: absoluteUrl(`/automotive/vehicles/${v.slug}`),
          ...(v.price && !v.priceOnRequest ? { offers: { "@type": "Offer", price: v.price.toString(), priceCurrency: v.currency, availability: v.availability === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability" } } : {}),
        }}
      />
      <section className="bg-graphite pt-28 pb-16 text-white sm:pt-32">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Automotive", href: "/automotive" }, { label: "Vehicles", href: "/automotive/vehicles" }, { label: `${v.year} ${name}` }]} />
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Gallery dark images={v.images.map((i) => ({ src: mediaUrl(i.media), alt: i.alt || i.media.alt || `${v.year} ${name}` }))} fallbackLabel={v.make} />
            </div>
            <div className="lg:col-span-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] uppercase">
                  <span className={`h-1.5 w-1.5 rounded-full ${v.availability === "AVAILABLE" ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
                  {AVAILABILITY_LABELS[v.availability]}
                </span>
                {v.isDemo && <DemoBadge />}
              </div>
              <p className="mt-6 font-display text-xs font-semibold tracking-[0.28em] text-gold-soft uppercase">
                {v.make} · {v.year}
              </p>
              <h1 className="display-md mt-3">
                {v.model}
                {v.variant && <span className="block text-xl font-medium text-white/55 sm:text-2xl">{v.variant}</span>}
              </h1>
              <p className="mt-6 font-display text-3xl font-semibold">{formatPrice(v)}</p>
              <dl className="mt-8 grid grid-cols-2 gap-px bg-white/10">
                {keyFacts.map(([k, val]) => (
                  <div key={k} className="bg-graphite p-4">
                    <dt className="text-[11px] tracking-[0.16em] text-white/45 uppercase">{k}</dt>
                    <dd className="mt-1 font-display font-semibold">{val}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-col gap-3">
                <a href="#enquire" className="flex h-13 items-center justify-center bg-gold py-4 font-display text-sm font-semibold text-navy hover:bg-gold-soft">
                  {enquirable ? "Enquire about this vehicle" : "Find a similar vehicle"}
                </a>
                {enquirable && (
                  <a href="#enquire" className="flex items-center justify-center border border-white/25 py-4 font-display text-sm font-semibold hover:bg-white hover:text-navy">
                    Book a test drive or inspection
                  </a>
                )}
              </div>
              {v.categories.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-2">
                  {v.categories.map((c) => (
                    <li key={c.id}>
                      <Link href={`/automotive/vehicles?category=${c.slug}`} className="border border-white/15 px-3 py-1 text-xs text-white/65 hover:text-white">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {(v.summary || v.description) && (
              <div>
                <h2 className="eyebrow">Overview</h2>
                {v.summary && <p className="mt-6 font-serif text-xl text-navy/85 italic">{v.summary}</p>}
                <Markdown className="mt-6">{v.description}</Markdown>
              </div>
            )}
            {v.features.length > 0 && (
              <div className="mt-14">
                <h2 className="eyebrow">Features</h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {v.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-ink/80">
                      <span className="h-px w-4 bg-gold" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {v.interiorDetails && (
              <div className="mt-14">
                <h2 className="eyebrow">Interior</h2>
                <Markdown className="mt-6">{v.interiorDetails}</Markdown>
              </div>
            )}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <h2 className="eyebrow">Specifications</h2>
            <dl className="mt-6 border-t-2 border-navy">
              {detailed.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-6 border-b border-line py-3.5 text-[15px]">
                  <dt className="text-ink/55">{k}</dt>
                  <dd className="text-right font-medium text-navy">{val}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-10 bg-ivory p-6">
              <h3 className="flex items-center gap-2 font-display font-semibold text-navy">
                <ShieldCheck className="h-5 w-5 text-gold-deep" aria-hidden /> Inspection information
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">{v.inspectionInfo || "Physical inspection can be arranged at our premises. Request an inspection below and our team will confirm a time."}</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="enquire" className="bg-ivory py-20 sm:py-28">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Next steps</p>
            <h2 className="display-md mt-6 text-navy">
              {v.year} {name}
            </h2>
            <p className="mt-5 text-ink/60">Ask a question or schedule a test drive or inspection. Our automotive team will confirm availability.</p>
          </div>
          <div className="bg-white p-6 sm:p-10 lg:col-span-8">
            {enquirable ? (
              <EnquiryTabs
                relatedId={v.id}
                tabs={[
                  { key: "enquire", label: "Vehicle enquiry", formType: "vehicle", fields: PRESETS.vehicle, submitLabel: "Send enquiry" },
                  { key: "drive", label: "Test drive / inspection", formType: "testDrive", fields: PRESETS.testDrive, submitLabel: "Request appointment", defaults: { requestType: "TEST_DRIVE" } },
                ]}
              />
            ) : (
              <p className="text-ink/70">
                This vehicle has been sold. <Link href="/automotive/sourcing" className="text-navy underline">Request a similar vehicle</Link>.
              </p>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="bg-white py-20">
          <div className="shell">
            <h2 className="display-md text-navy">You may also consider</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <VehicleCard key={s.id} vehicle={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

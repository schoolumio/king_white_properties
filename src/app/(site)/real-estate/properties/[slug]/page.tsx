import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Download, FileText, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { LISTING_LABELS, PROPERTY_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { downloadUrl, mediaUrl } from "@/lib/media";
import { absoluteUrl, JsonLd, pageMetadata } from "@/lib/seo";
import { propertyCardInclude } from "@/lib/queries";
import { Breadcrumbs } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";
import { DemoBadge } from "@/components/ui/section";
import { Gallery } from "@/components/catalog/gallery";
import { MapEmbed } from "@/components/catalog/map-embed";
import { EnquiryTabs } from "@/components/catalog/enquiry-tabs";
import { PropertyCard } from "@/components/catalog/cards";
import { PRESETS } from "@/components/forms/presets";

async function load(slug: string) {
  return db.property.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: {
      images: { orderBy: [{ kind: "asc" }, { order: "asc" }], include: { media: true } },
      documents: { where: { isPublic: true }, orderBy: { order: "asc" }, include: { media: true } },
      location: true,
      propertyType: true,
      development: { select: { name: true, slug: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return {};
  return pageMetadata({
    title: p.metaTitle || p.title,
    description: p.metaDescription || p.summary,
    path: `/real-estate/properties/${p.slug}`,
    image: mediaUrl(p.images.find((i) => i.kind === "PHOTO")?.media),
  });
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();

  const photos = p.images.filter((i) => i.kind === "PHOTO");
  const plans = p.images.filter((i) => i.kind === "FLOOR_PLAN");
  const specs = (Array.isArray(p.specifications) ? p.specifications : []) as { label: string; value: string }[];
  const loc = [p.address, p.location?.name, p.location?.city, p.location?.state].filter(Boolean).join(", ");
  const facts = [
    ["Category", SECTOR_LABELS[p.sector]],
    ["Type", p.propertyType?.name],
    ["Listing", LISTING_LABELS[p.listingType]],
    ["Status", PROPERTY_STATUS_LABELS[p.status]],
    ["Bedrooms", p.bedrooms?.toString()],
    ["Bathrooms", p.bathrooms?.toString()],
    ["Parking", p.parkingSpaces?.toString()],
    ["Floor area", p.floorAreaSqm ? `${formatNumber(p.floorAreaSqm)} m²` : null],
    ["Land area", p.landAreaSqm ? `${formatNumber(p.landAreaSqm)} m²` : null],
    ["Title", p.titleDocument],
    ["Year built", p.yearBuilt?.toString()],
  ].filter(([, v]) => v) as [string, string][];

  const similar = await db.property.findMany({
    where: { publishStatus: "PUBLISHED", sector: p.sector, id: { not: p.id }, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
    take: 3,
    orderBy: { publishedAt: "desc" },
    include: propertyCardInclude,
  });

  const enquirable = p.status === "AVAILABLE" || p.status === "UNDER_OFFER";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: p.title,
          description: p.summary,
          url: absoluteUrl(`/real-estate/properties/${p.slug}`),
          image: photos.map((i) => absoluteUrl(mediaUrl(i.media)!)),
          ...(p.price && !p.priceOnRequest ? { offers: { "@type": "Offer", price: p.price.toString(), priceCurrency: p.currency } } : {}),
        }}
      />
      <div className="bg-navy pt-28 pb-6 sm:pt-32">
        <div className="shell">
          <Breadcrumbs items={[{ label: "Real Estate", href: "/real-estate" }, { label: "Properties", href: "/real-estate/properties" }, { label: p.title }]} />
        </div>
      </div>

      <section className="bg-white pt-10 pb-20 sm:pb-28">
        <div className="shell">
          <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-navy px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] text-white uppercase">{LISTING_LABELS[p.listingType]}</span>
                <span className="bg-ivory px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] text-navy uppercase">{PROPERTY_STATUS_LABELS[p.status]}</span>
                {p.isDemo && <DemoBadge />}
              </div>
              <h1 className="display-md mt-5 text-navy">{p.title}</h1>
              {loc && (
                <p className="mt-3 flex items-center gap-2 text-ink/60">
                  <MapPin className="h-4 w-4 text-gold-deep" aria-hidden /> {loc}
                </p>
              )}
            </div>
            <div className="lg:text-right">
              <p className="text-[11px] tracking-[0.2em] text-steel uppercase">{p.listingType === "LEASE" ? "Rent" : "Price"}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-navy">{formatPrice(p)}</p>
              {p.availabilityVerifiedAt && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> Availability verified {formatDate(p.availabilityVerifiedAt, "short")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Gallery images={photos.map((i) => ({ src: mediaUrl(i.media), alt: i.alt || i.media.alt || p.title }))} fallbackLabel={SECTOR_LABELS[p.sector]} />

              <div className="mt-14">
                <h2 className="eyebrow">Description</h2>
                <p className="mt-6 font-serif text-xl leading-relaxed text-navy/85 italic">{p.summary}</p>
                <Markdown className="mt-6">{p.description}</Markdown>
              </div>

              <div className="mt-14">
                <h2 className="eyebrow">Specifications</h2>
                <dl className="mt-6 grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
                  {[...facts, ...specs.map((s) => [s.label, s.value] as [string, string])].map(([k, val]) => (
                    <div key={k} className="flex justify-between gap-6 border-b border-line py-3.5 text-[15px]">
                      <dt className="text-ink/55">{k}</dt>
                      <dd className="text-right font-medium text-navy">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {(p.features.length > 0 || p.amenities.length > 0) && (
                <div className="mt-14 grid gap-12 sm:grid-cols-2">
                  {[
                    ["Property features", p.features],
                    ["Amenities", p.amenities],
                  ].map(([title, list]) =>
                    (list as string[]).length ? (
                      <div key={title as string}>
                        <h2 className="eyebrow">{title as string}</h2>
                        <ul className="mt-6 space-y-3">
                          {(list as string[]).map((f) => (
                            <li key={f} className="flex items-center gap-3 text-ink/80">
                              <span className="h-px w-4 bg-gold" aria-hidden /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              )}

              {plans.length > 0 && (
                <div className="mt-14">
                  <h2 className="eyebrow">Floor plans</h2>
                  <div className="mt-6">
                    <Gallery images={plans.map((i) => ({ src: mediaUrl(i.media), alt: i.alt || `${p.title} floor plan` }))} />
                  </div>
                </div>
              )}

              {p.latitude !== null && p.longitude !== null && (
                <div className="mt-14">
                  <h2 className="eyebrow">Location</h2>
                  <MapEmbed lat={p.latitude} lng={p.longitude} title={`Map showing ${p.title}`} className="mt-6 h-[380px]" />
                </div>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-28">
                {p.documents.length > 0 && (
                  <div className="bg-ivory p-6">
                    <h2 className="font-display text-sm font-semibold tracking-[0.16em] text-navy uppercase">Brochures & documents</h2>
                    <ul className="mt-4 divide-y divide-line">
                      {p.documents.map((d) => (
                        <li key={d.id}>
                          <a href={downloadUrl(d.media)} className="group flex items-center gap-3 py-3">
                            <FileText className="h-4 w-4 text-gold-deep" aria-hidden />
                            <span className="flex-1 text-[15px] text-navy group-hover:underline">{d.title}</span>
                            <Download className="h-4 w-4 text-navy/40" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.development && (
                  <Link href={`/real-estate/developments/${p.development.slug}`} className="block border border-line p-6 hover:border-navy">
                    <span className="text-[11px] tracking-[0.2em] text-steel uppercase">Part of the development</span>
                    <span className="mt-1 block font-display text-lg font-semibold text-navy">{p.development.name}</span>
                  </Link>
                )}
                <div className="border-t-2 border-navy pt-6">
                  <p className="text-sm text-ink/60">Reference listing</p>
                  <p className="font-display font-semibold text-navy">{p.title}</p>
                  <a href="#enquire" className="mt-5 flex h-12 items-center justify-center bg-navy font-display text-sm font-semibold text-white hover:bg-navy-deep">
                    {enquirable ? "Enquire or book an inspection" : "Contact our team"}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="enquire" className="bg-ivory py-20 sm:py-28">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Next steps</p>
            <h2 className="display-md mt-6 text-navy">Enquire about this property.</h2>
            <p className="mt-5 text-ink/60">Send a question or request a viewing. A relationship officer will confirm availability and arrangements.</p>
          </div>
          <div className="bg-white p-6 sm:p-10 lg:col-span-8">
            {enquirable ? (
              <EnquiryTabs
                relatedId={p.id}
                tabs={[
                  { key: "inspect", label: "Request an inspection", formType: "inspection", fields: PRESETS.inspection, submitLabel: "Request inspection" },
                  { key: "enquire", label: "General enquiry", formType: "property", fields: PRESETS.property, submitLabel: "Send enquiry" },
                ]}
              />
            ) : (
              <p className="text-ink/70">
                This property is no longer available. <Link href="/contact?topic=property" className="text-navy underline">Contact our team</Link> for similar options.
              </p>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="shell">
            <h2 className="display-md text-navy">Similar properties</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <PropertyCard key={s.id} property={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

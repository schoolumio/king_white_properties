import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { PROJECT_STATUS_LABELS, SECTOR_LABELS, UNIT_STATUS_LABELS } from "@/lib/labels";
import { downloadUrl, mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { propertyCardInclude } from "@/lib/queries";
import { PageHero } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";
import { Photo } from "@/components/ui/photo";
import { DemoBadge } from "@/components/ui/section";
import { Gallery } from "@/components/catalog/gallery";
import { MapEmbed } from "@/components/catalog/map-embed";
import { PropertyCard } from "@/components/catalog/cards";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";
import { opportunityHref } from "@/components/catalog/opportunity";

async function load(slug: string) {
  return db.developmentProject.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: {
      location: true,
      media: { orderBy: { order: "asc" }, include: { media: true } },
      documents: { where: { isPublic: true }, orderBy: { order: "asc" }, include: { media: true } },
      updates: { where: { published: true }, orderBy: { publishedAt: "desc" }, include: { media: true } },
      units: { orderBy: { order: "asc" } },
      properties: { where: { publishStatus: "PUBLISHED" }, include: propertyCardInclude, take: 6 },
      opportunities: { where: { publishStatus: "PUBLISHED" }, select: { slug: true, title: true, sector: true, status: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return {};
  return pageMetadata({ title: p.metaTitle || p.name, description: p.metaDescription || p.summary, path: `/real-estate/developments/${p.slug}`, image: mediaUrl(p.media[0]?.media) });
}

export default async function DevelopmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const gallery = p.media.filter((m) => m.kind === "GALLERY");
  const masterplans = p.media.filter((m) => m.kind === "MASTERPLAN");
  const loc = [p.address, p.location?.name, p.location?.state].filter(Boolean).join(", ");
  const facts = [
    ["Status", PROJECT_STATUS_LABELS[p.status]],
    ["Current stage", p.currentStage],
    ["Project type", p.projectType ?? SECTOR_LABELS[p.sector]],
    ["Location", loc],
    ["Site area", p.siteAreaSqm ? `${formatNumber(p.siteAreaSqm)} m²` : null],
    ["Total units", p.totalUnits?.toString()],
    ["Commenced", p.startDate ? formatDate(p.startDate, "short") : null],
    [p.status === "COMPLETED" ? "Completed" : "Expected completion", p.completionDate ? formatDate(p.completionDate, "short") : null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <PageHero
        eyebrow={`${PROJECT_STATUS_LABELS[p.status]} · ${SECTOR_LABELS[p.sector]}`}
        title={p.name}
        statement={p.summary}
        image={mediaUrl(gallery[0]?.media)}
        imageAlt={gallery[0]?.caption ?? p.name}
        crumbs={[{ label: "Real Estate", href: "/real-estate" }, { label: "Developments", href: "/real-estate/developments" }, { label: p.name }]}
        size="lg"
      >
        {loc && (
          <p className="flex items-center gap-2 text-white/70">
            <MapPin className="h-4 w-4 text-gold-soft" aria-hidden /> {loc}
          </p>
        )}
      </PageHero>

      <section className="bg-white py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {p.isDemo && (
              <div className="mb-6">
                <DemoBadge />
              </div>
            )}
            <h2 className="eyebrow">Project overview</h2>
            <Markdown className="mt-6">{p.overview}</Markdown>
            {p.developerInfo && (
              <div className="mt-10 border-l-2 border-gold pl-6">
                <h3 className="font-display font-semibold text-navy">Developer information</h3>
                <p className="mt-2 text-ink/70">{p.developerInfo}</p>
              </div>
            )}
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <dl className="border-t-2 border-navy">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 border-b border-line py-4 text-[15px]">
                  <dt className="text-ink/55">{k}</dt>
                  <dd className="text-right font-medium text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            {p.progressPercent !== null && (
              <div className="mt-8">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Construction progress</span>
                  <span className="font-display font-semibold text-navy">{p.progressPercent}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-ivory-deep" role="progressbar" aria-valuenow={p.progressPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-gold" style={{ width: `${Math.min(100, Math.max(0, p.progressPercent))}%` }} />
                </div>
              </div>
            )}
            <a href="#enquire" className="mt-8 flex h-12 items-center justify-center bg-navy font-display text-sm font-semibold text-white hover:bg-navy-deep">
              Enquire about this development
            </a>
          </aside>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="bg-ivory py-20">
          <div className="shell">
            <h2 className="eyebrow">Gallery</h2>
            <div className="mt-8">
              <Gallery images={gallery.map((m) => ({ src: mediaUrl(m.media), alt: m.caption || m.media.alt || p.name }))} />
            </div>
          </div>
        </section>
      )}

      {p.units.length > 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="shell">
            <h2 className="display-md text-navy">Unit availability</h2>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[15px]">
                <thead>
                  <tr className="border-b-2 border-navy text-[11px] tracking-[0.16em] text-steel uppercase">
                    <th className="py-3 font-semibold">Unit type</th>
                    <th className="py-3 font-semibold">Bedrooms</th>
                    <th className="py-3 font-semibold">Size</th>
                    <th className="py-3 font-semibold">Price</th>
                    <th className="py-3 font-semibold">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {p.units.map((u) => (
                    <tr key={u.id} className="border-b border-line">
                      <td className="py-4 font-display font-semibold text-navy">{u.name}</td>
                      <td className="py-4">{u.bedrooms ?? "—"}</td>
                      <td className="py-4">{u.floorAreaSqm ? `${formatNumber(u.floorAreaSqm)} m²` : "—"}</td>
                      <td className="py-4">{formatPrice(u)}</td>
                      <td className="py-4">
                        <span className={u.status === "SOLD_OUT" ? "text-ink/45" : "text-emerald-700"}>{UNIT_STATUS_LABELS[u.status]}</span>
                        {u.availableUnits !== null && u.totalUnits !== null && u.status !== "SOLD_OUT" && (
                          <span className="ml-2 text-ink/50">
                            ({u.availableUnits} of {u.totalUnits})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {masterplans.length > 0 && (
        <section className="bg-white py-20">
          <div className="shell">
            <h2 className="display-md text-navy">Masterplan</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {masterplans.map((m) => (
                <figure key={m.id}>
                  <Photo src={mediaUrl(m.media)} alt={m.caption || `${p.name} masterplan`} className="aspect-[4/3] bg-ivory" imgClassName="!object-contain" tone="ivory" sizes="50vw" />
                  {m.caption && <figcaption className="mt-3 text-sm text-ink/60">{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {p.updates.length > 0 && (
        <section className="bg-navy py-20 text-white sm:py-28">
          <div className="shell grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow eyebrow-light">Progress</p>
              <h2 className="display-md mt-6">Construction updates</h2>
            </div>
            <ol className="relative border-l border-white/15 lg:col-span-7 lg:col-start-6">
              {p.updates.map((u) => (
                <li key={u.id} className="relative pb-12 pl-8 last:pb-0">
                  <span className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 bg-gold" aria-hidden />
                  <time className="text-xs tracking-[0.16em] text-gold-soft uppercase">{formatDate(u.publishedAt)}</time>
                  <h3 className="mt-2 font-display text-xl font-semibold">{u.title}</h3>
                  <Markdown invert className="mt-3 text-[15px]">
                    {u.body}
                  </Markdown>
                  {u.media && <Photo src={mediaUrl(u.media)} alt={u.title} className="mt-4 aspect-[16/9] max-w-xl" sizes="40vw" />}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {(p.documents.length > 0 || p.opportunities.length > 0 || (p.latitude !== null && p.longitude !== null)) && (
        <section className="bg-ivory py-20">
          <div className="shell grid gap-12 lg:grid-cols-2">
            <div className="space-y-10">
              {p.documents.length > 0 && (
                <div>
                  <h2 className="eyebrow">Supporting documentation</h2>
                  <ul className="mt-6 divide-y divide-line border-y border-line">
                    {p.documents.map((d) => (
                      <li key={d.id}>
                        <a href={downloadUrl(d.media)} className="group flex items-center gap-4 py-4">
                          <FileText className="h-5 w-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                          <span className="flex-1 font-medium text-navy group-hover:underline">{d.title}</span>
                          <Download className="h-4 w-4 text-navy/40" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.opportunities.length > 0 && (
                <div>
                  <h2 className="eyebrow">Related investment opportunities</h2>
                  <ul className="mt-6 space-y-3">
                    {p.opportunities.map((o) => (
                      <li key={o.slug}>
                        <Link href={opportunityHref(o)} className="font-display font-semibold text-navy underline decoration-gold underline-offset-4">
                          {o.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {p.latitude !== null && p.longitude !== null && <MapEmbed lat={p.latitude} lng={p.longitude} title={`Map showing ${p.name}`} className="h-[360px]" />}
          </div>
        </section>
      )}

      {p.properties.length > 0 && (
        <section className="bg-white py-20">
          <div className="shell">
            <h2 className="display-md text-navy">Available within {p.name}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {p.properties.map((pr) => (
                <PropertyCard key={pr.id} property={pr} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="enquire" className="bg-white py-20 sm:py-28">
        <div className="shell grid gap-12 border-t border-line pt-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Enquiries</p>
            <h2 className="display-md mt-6 text-navy">Acquisition, investment or partnership.</h2>
            <p className="mt-5 text-ink/60">Tell us your interest in {p.name}. Investment and partnership enquiries are routed to the appropriate team.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <EnquiryForm formType="development" fields={PRESETS.development} defaults={{ relatedId: p.id, interest: "UNITS" }} submitLabel="Send enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}

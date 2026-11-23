import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getContent, getSite } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";
import { MapEmbed } from "@/components/catalog/map-embed";

type ContactPage = { heading: string; intro: string; latitude: string; longitude: string };

export const metadata: Metadata = pageMetadata({ title: "Contact Us", description: "Contact our corporate, real estate, automotive and investor relations teams.", path: "/contact" });

const TOPICS = ["GENERAL", "PROPERTY", "AUTOMOTIVE", "INVESTMENT"];

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [site, page] = await Promise.all([getSite(), getContent<ContactPage>("contact.page")]);
  const topic = firstParam(sp.topic)?.toUpperCase();
  const lat = parseFloat(page.latitude);
  const lng = parseFloat(page.longitude);

  return (
    <>
      <PageHero eyebrow="Contact" title={page.heading} statement={page.intro} crumbs={[{ label: "Contact" }]} />
      <section className="bg-white py-20 sm:py-28">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <h2 className="eyebrow">Head Office</h2>
            <ul className="mt-8 space-y-7">
              <li className="flex gap-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                <span className="whitespace-pre-line text-ink/75">{site.address || "Office address to be published."}</span>
              </li>
              {site.phone && (
                <li className="flex gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  <span>
                    <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-navy hover:underline">
                      {site.phone}
                    </a>
                    {site.phoneSecondary && (
                      <>
                        <br />
                        <a href={`tel:${site.phoneSecondary.replace(/\s/g, "")}`} className="text-navy hover:underline">
                          {site.phoneSecondary}
                        </a>
                      </>
                    )}
                  </span>
                </li>
              )}
              {site.email && (
                <li className="flex gap-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.5} aria-hidden />
                  <a href={`mailto:${site.email}`} className="text-navy hover:underline">
                    {site.email}
                  </a>
                </li>
              )}
            </ul>
            {site.officeHours && <p className="mt-8 text-sm text-ink/55">{site.officeHours}</p>}

            <div className="mt-12 border-t border-line pt-8">
              <h2 className="eyebrow">Specialist enquiries</h2>
              <ul className="mt-6 space-y-3 text-[15px]">
                {[
                  ["Investment enquiries", "/investments#enquiry"],
                  ["Partnership proposals", "/partnerships#proposal"],
                  ["Corporate fleet requests", "/automotive/fleet-solutions#request"],
                  ["Vehicle sourcing", "/automotive/sourcing"],
                ].map(([l, h]) => (
                  <li key={h}>
                    <Link href={h} className="text-navy underline decoration-gold underline-offset-4 hover:text-gold-deep">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="display-md text-navy">Send us a message</h2>
            <div className="mt-10">
              <EnquiryForm formType="general" fields={PRESETS.general} defaults={{ topic: topic && TOPICS.includes(topic) ? topic : "GENERAL" }} submitLabel="Send message" />
            </div>
          </div>
        </div>
      </section>
      {Number.isFinite(lat) && Number.isFinite(lng) && (
        <section className="bg-ivory">
          <MapEmbed lat={lat} lng={lng} title="Head office location" className="h-[420px]" />
        </section>
      )}
    </>
  );
}

import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";

export const metadata: Metadata = pageMetadata({
  title: "Vehicle Sourcing",
  description: "Request a specific vehicle that is not currently in our inventory. Our sourcing team will search trusted channels on your behalf.",
  path: "/automotive/sourcing",
});

export default async function SourcingPage() {
  const c = await getContent<{ sourcingHeading: string; sourcingBody: string }>("automotive.landing");
  return (
    <>
      <PageHero eyebrow="Vehicle Sourcing" title={c.sourcingHeading} statement={c.sourcingBody} crumbs={[{ label: "Automotive", href: "/automotive" }, { label: "Vehicle Sourcing" }]} tone="graphite" />
      <section className="bg-ivory py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">How it works</p>
            <ol className="mt-8 space-y-8">
              {[
                ["Share your specification", "Make, model, year range, budget and any must-have features."],
                ["We search and verify", "Our team searches trusted channels and verifies history and condition."],
                ["Options and quotation", "We present suitable vehicles with transparent pricing."],
                ["Acquisition support", "Inspection, documentation and delivery coordination."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5">
                  <span className="font-display text-2xl font-semibold text-gold">{i + 1}</span>
                  <span>
                    <span className="block font-display font-semibold text-navy">{t}</span>
                    <span className="mt-1 block text-[15px] text-ink/60">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-white p-6 sm:p-12 lg:col-span-8">
            <EnquiryForm formType="sourcing" fields={PRESETS.sourcing} submitLabel="Submit sourcing request" successTitle="Your sourcing request has been received." />
          </div>
        </div>
      </section>
    </>
  );
}

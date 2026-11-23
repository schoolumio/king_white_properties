import type { Metadata } from "next";
import { getContent, type Titled } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { LinkButton } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS } from "@/components/forms/presets";

type Fleet = { heading: string; intro: string; offerings: Titled[]; process: Titled[]; image: string; imageAlt: string };

export async function generateMetadata(): Promise<Metadata> {
  const f = await getContent<Fleet>("fleet.page");
  return pageMetadata({ title: "Corporate Fleet Solutions", description: f.intro, path: "/automotive/fleet-solutions" });
}

export default async function FleetPage() {
  const f = await getContent<Fleet>("fleet.page");
  return (
    <>
      <PageHero eyebrow="Automotive · B2B" title={f.heading} statement={f.intro} image={f.image} imageAlt={f.imageAlt} crumbs={[{ label: "Automotive", href: "/automotive" }, { label: "Fleet Solutions" }]} size="lg" tone="graphite">
        <LinkButton href="#request" variant="gold" arrow>
          Request a fleet quotation
        </LinkButton>
      </PageHero>

      <section className="bg-white py-24 sm:py-32">
        <div className="shell">
          <p className="eyebrow">What we provide</p>
          <ul className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {f.offerings.map((o, i) => (
              <Reveal as="li" key={o.title} delay={(i % 4) * 70} className="bg-white p-8">
                <span className="font-display text-xs font-semibold text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy">{o.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink/60">{o.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-graphite py-24 text-white sm:py-28">
        <div className="shell">
          <p className="eyebrow eyebrow-light">Procurement process</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {f.process.map((s, i) => (
              <li key={s.title} className="border-t border-white/20 pt-6">
                <span className="font-display text-4xl font-semibold text-gold">{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[15px] text-white/60">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="request" className="bg-ivory py-24 sm:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Corporate fleet enquiry</p>
            <h2 className="display-md mt-6 text-navy">Tell us about your requirement.</h2>
            <p className="mt-5 text-ink/60">A fleet specialist will review your brief and respond with recommendations and a formal quotation.</p>
          </div>
          <div className="bg-white p-6 sm:p-12 lg:col-span-8">
            <EnquiryForm formType="fleet" fields={PRESETS.fleet} submitLabel="Submit fleet request" successTitle="Your fleet request has been received." />
          </div>
        </div>
      </section>
    </>
  );
}

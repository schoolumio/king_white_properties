import type { Metadata } from "next";
import { getContent, type Titled } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { LinkButton } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { PRESETS, withOptions } from "@/components/forms/presets";

type PPage = { heading: string; intro: string; categories: Titled[]; image: string; imageAlt: string };

export async function generateMetadata(): Promise<Metadata> {
  const p = await getContent<PPage>("partnerships.page");
  return pageMetadata({ title: "Partnerships", description: p.intro, path: "/partnerships" });
}

export default async function PartnershipsPage() {
  const page = await getContent<PPage>("partnerships.page");
  const fields = withOptions(PRESETS.partnership, "category", [...page.categories.map((c) => c.title), "Other"]);
  return (
    <>
      <PageHero eyebrow="Institutional Engagement" title={page.heading} statement={page.intro} image={page.image} imageAlt={page.imageAlt} crumbs={[{ label: "Partnerships" }]} size="lg">
        <LinkButton href="#proposal" variant="gold" arrow>
          Submit a partnership proposal
        </LinkButton>
      </PageHero>

      <section className="bg-white py-24 sm:py-32">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="eyebrow">Partnership categories</p>
              <h2 className="display-md mt-6 text-navy">Who we work with.</h2>
            </div>
            <p className="text-lg text-ink/60 lg:col-span-6 lg:col-start-7">
              Each partnership category has a dedicated review path. Tell us about your organisation and your proposal, and the relevant team will respond.
            </p>
          </div>
          <ul className="mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {page.categories.map((c, i) => (
              <Reveal as="li" key={c.title} delay={(i % 3) * 80} className="bg-white p-8 sm:p-10">
                <span className="font-display text-xs font-semibold text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 font-display text-xl font-semibold text-navy">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/60">{c.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="proposal" className="bg-ivory py-24 sm:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Proposal submission</p>
            <h2 className="display-md mt-6 text-navy">Submit a partnership proposal.</h2>
            <ol className="mt-10 space-y-5 text-[15px] text-ink/65">
              {["Complete the form with your organisation's details and proposal summary.", "Attach supporting documentation if available (confidential).", "Receive a reference number immediately.", "Our partnerships team reviews and responds."].map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="font-display font-semibold text-gold-deep">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-10 text-sm text-ink/50">Submissions and documents are stored securely and are never published.</p>
          </div>
          <div className="bg-white p-6 sm:p-12 lg:col-span-8">
            <EnquiryForm formType="partnership" fields={fields} submitLabel="Submit proposal" successTitle="Your proposal has been received." />
          </div>
        </div>
      </section>
    </>
  );
}

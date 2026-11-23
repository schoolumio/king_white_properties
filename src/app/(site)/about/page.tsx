import type { Metadata } from "next";
import { getContent, getSite, type Titled } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/ui/markdown";
import { ArrowLink, LinkButton } from "@/components/ui/button";

type About = { heading: string; lead: string; profile: string; vision: string; mission: string; values: Titled[]; image: string; imageAlt: string; image2: string; image2Alt: string };

export async function generateMetadata(): Promise<Metadata> {
  const about = await getContent<About>("about");
  return pageMetadata({ title: "About Us", description: about.lead, path: "/about" });
}

export default async function AboutPage() {
  const [site, about] = await Promise.all([getSite(), getContent<About>("about")]);
  return (
    <>
      <PageHero eyebrow="About Us" title={about.heading} statement={about.lead} image={about.image} imageAlt={about.imageAlt} crumbs={[{ label: "About Us" }]} size="lg" />

      <section className="bg-white py-24 sm:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">Company Profile</p>
            <h2 className="display-md mt-6 text-navy">{site.companyName}</h2>
            <p className="mt-6 font-serif text-xl text-gold-deep italic">{site.tagline}</p>
          </Reveal>
          <Reveal className="lg:col-span-7 lg:col-start-6" delay={100}>
            <Markdown className="text-lg">{about.profile}</Markdown>
          </Reveal>
        </div>
      </section>

      <section className="bg-navy py-24 text-white sm:py-32">
        <div className="shell grid gap-px bg-white/10 lg:grid-cols-2">
          {[
            { label: "Vision", text: about.vision },
            { label: "Mission", text: about.mission },
          ].map((b, i) => (
            <Reveal key={b.label} delay={i * 120} className="bg-navy p-8 sm:p-14">
              <p className="eyebrow eyebrow-light">{b.label}</p>
              <p className="mt-8 font-serif text-2xl leading-snug sm:text-[2rem]">{b.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ivory py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Photo src={about.image2} alt={about.image2Alt} className="aspect-[4/5] bg-navy" sizes="(min-width:1024px) 40vw, 100vw" />
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="eyebrow">Our Values</p>
            <h2 className="display-md mt-6 text-navy">The standards we hold ourselves to.</h2>
            <dl className="mt-12 border-t border-line">
              {about.values.map((v, i) => (
                <Reveal key={v.title} delay={i * 80} className="grid gap-2 border-b border-line py-7 sm:grid-cols-[12rem_1fr] sm:gap-8">
                  <dt className="font-display text-lg font-semibold text-navy">{v.title}</dt>
                  <dd className="text-[15.5px] leading-relaxed text-ink/65">{v.description}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28">
        <div className="shell grid gap-10 md:grid-cols-3">
          {[
            { t: "Real Estate & Infrastructure", d: "Property, development, leasing and management.", h: "/real-estate", l: "Explore the division" },
            { t: "Automotive & Mobility", d: "Vehicle sales, fleet, sourcing and leasing.", h: "/automotive", l: "Explore the division" },
            { t: "Leadership & Governance", d: "Leadership, structure, compliance and policies.", h: "/about/governance", l: "View governance" },
          ].map((c) => (
            <div key={c.t} className="border-t-2 border-navy pt-6">
              <h3 className="font-display text-xl font-semibold text-navy">{c.t}</h3>
              <p className="mt-2 text-ink/60">{c.d}</p>
              <div className="mt-6">
                <ArrowLink href={c.h}>{c.l}</ArrowLink>
              </div>
            </div>
          ))}
        </div>
        <div className="shell mt-20">
          <LinkButton href="/contact" arrow>
            Contact our team
          </LinkButton>
        </div>
      </section>
    </>
  );
}

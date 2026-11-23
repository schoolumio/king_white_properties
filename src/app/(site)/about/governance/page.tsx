import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { getContent, type Titled } from "@/lib/content";
import { publishedLeadership } from "@/lib/queries";
import { downloadUrl, mediaUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { Markdown } from "@/components/ui/markdown";
import { EmptyState } from "@/components/ui/section";

type Gov = { intro: string; framework: string; structure: string; compliance: string };
type HomeGov = { heading: string; intro: string; pillars: Titled[] };

export const metadata: Metadata = pageMetadata({
  title: "Leadership & Governance",
  description: "Executive leadership, corporate governance, organisational structure, compliance information and corporate policies.",
  path: "/about/governance",
});

const GROUP_TITLES = { BOARD: "Board of Directors", EXECUTIVE: "Executive Leadership", MANAGEMENT: "Management Team" } as const;

export default async function GovernancePage() {
  const [gov, homeGov, about, leaders, policies] = await Promise.all([
    getContent<Gov>("governance"),
    getContent<HomeGov>("home.governance"),
    getContent<{ values: Titled[] }>("about"),
    publishedLeadership(),
    db.publication.findMany({ where: { publishStatus: "PUBLISHED", category: "POLICY" }, include: { file: true }, orderBy: { title: "asc" } }).catch(() => []),
  ]);
  const groups = (["BOARD", "EXECUTIVE", "MANAGEMENT"] as const).map((g) => ({ g, people: leaders.filter((l) => l.group === g) })).filter((x) => x.people.length);

  return (
    <>
      <PageHero eyebrow="Governance" title={homeGov.heading} statement={gov.intro} crumbs={[{ label: "About Us", href: "/about" }, { label: "Leadership & Governance" }]} />

      <section id="leadership" className="bg-white py-24 sm:py-32">
        <div className="shell">
          {groups.length === 0 ? (
            <EmptyState title="Leadership profiles" description="Profiles of the group's board, executive leadership and management team will be published here once approved for release." />
          ) : (
            groups.map(({ g, people }) => (
              <div key={g} className="mb-20 last:mb-0">
                <h2 className="eyebrow">{GROUP_TITLES[g]}</h2>
                <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
                  {people.map((p, i) => (
                    <Reveal key={p.id} delay={(i % 4) * 80}>
                      <article>
                        <Photo src={mediaUrl(p.photo)} alt={`Portrait of ${p.name}`} className="aspect-[4/5] bg-ivory-deep" tone="ivory" sizes="(min-width:1024px) 22vw, 50vw" />
                        <h3 className="mt-5 font-display text-xl font-semibold text-navy">{p.name}</h3>
                        <p className="mt-1 text-sm font-medium tracking-wide text-gold-deep">{p.position}</p>
                        {p.bio && <p className="mt-4 text-[14.5px] leading-relaxed text-ink/65">{p.bio}</p>}
                        {p.linkedin && (
                          <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-navy underline decoration-gold underline-offset-4">
                            LinkedIn
                          </a>
                        )}
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-ivory py-24 sm:py-32">
        <div className="shell grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Framework</p>
            <h2 className="display-md mt-6 text-navy">How the group is governed.</h2>
            <ul className="mt-10 border-t border-line">
              {homeGov.pillars.map((p) => (
                <li key={p.title} className="border-b border-line py-5">
                  <h3 className="font-display font-semibold text-navy">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink/60">{p.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-16 lg:col-span-7 lg:col-start-6">
            {gov.framework && (
              <div>
                <h3 className="font-display text-2xl font-semibold text-navy">Corporate governance</h3>
                <Markdown className="mt-6">{gov.framework}</Markdown>
              </div>
            )}
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy">Organisational structure</h3>
              <div className="mt-8 grid gap-px bg-line sm:grid-cols-[1fr]">
                <div className="bg-navy p-6 text-center text-white">
                  <p className="text-[11px] tracking-[0.24em] text-gold-soft uppercase">Parent company</p>
                  <p className="mt-1 font-display font-semibold">Corporate Group</p>
                  <p className="mt-1 text-xs text-white/50">Governance · Investor relations · Client relations · Finance · Administration</p>
                </div>
                <div className="grid gap-px sm:grid-cols-2">
                  <div className="bg-white p-6 text-center">
                    <p className="text-[11px] tracking-[0.24em] text-gold-deep uppercase">Division A</p>
                    <p className="mt-1 font-display font-semibold text-navy">Real Estate & Infrastructure</p>
                  </div>
                  <div className="bg-white p-6 text-center">
                    <p className="text-[11px] tracking-[0.24em] text-gold-deep uppercase">Division B</p>
                    <p className="mt-1 font-display font-semibold text-navy">Automotive & Mobility</p>
                  </div>
                </div>
              </div>
              <Markdown className="mt-8">{gov.structure}</Markdown>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy">Company values</h3>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {about.values.map((v) => (
                  <li key={v.title} className="border-l-2 border-gold pl-5">
                    <p className="font-display font-semibold text-navy">{v.title}</p>
                    <p className="mt-1 text-sm text-ink/60">{v.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            {gov.compliance && (
              <div>
                <h3 className="font-display text-2xl font-semibold text-navy">Compliance information</h3>
                <Markdown className="mt-6">{gov.compliance}</Markdown>
              </div>
            )}
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy">Corporate policies</h3>
              {policies.length === 0 ? (
                <p className="mt-4 text-ink/60">Corporate policies will be available for download here once published.</p>
              ) : (
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {policies.map((p) => (
                    <li key={p.id}>
                      <a href={downloadUrl(p.file)} className="group flex items-center gap-4 py-5">
                        <FileText className="h-5 w-5 text-gold-deep" strokeWidth={1.5} aria-hidden />
                        <span className="flex-1 font-display font-semibold text-navy group-hover:text-gold-deep">{p.title}</span>
                        <Download className="h-4 w-4 text-navy/40" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

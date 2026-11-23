import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SiteContent } from "@/lib/content";
import { Logo } from "./logo";

const SOCIAL_LABELS: Record<string, string> = { linkedin: "LinkedIn", x: "X", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube" };

export function SiteFooter({ site, legalPages }: { site: SiteContent; legalPages: { slug: string; title: string }[] }) {
  const socials = Object.entries(site.socials ?? {}).filter(([, url]) => url);
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-navy-deep text-white">
      <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="shell relative">
        <div className="grid gap-14 border-b border-white/10 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-4">
            <Logo companyName={site.companyName} logo={site.logoInverse || site.logo} light />
            <p className="mt-8 max-w-sm text-[15px] leading-relaxed text-white/55">{site.description}</p>
            <p className="mt-8 font-serif text-lg text-gold-soft italic">{site.tagline}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
            <FooterColumn
              title="Divisions"
              links={[
                { label: "Real Estate & Infrastructure", href: "/real-estate" },
                { label: "Properties", href: "/real-estate/properties" },
                { label: "Developments", href: "/real-estate/developments" },
                { label: "Automotive & Mobility", href: "/automotive" },
                { label: "Vehicle Inventory", href: "/automotive/vehicles" },
                { label: "Fleet Solutions", href: "/automotive/fleet-solutions" },
              ]}
            />
            <FooterColumn
              title="Corporate"
              links={[
                { label: "About Us", href: "/about" },
                { label: "Leadership & Governance", href: "/about/governance" },
                { label: "Investments", href: "/investments" },
                { label: "Partnerships", href: "/partnerships" },
                { label: "Insights", href: "/insights" },
                { label: "Publications", href: "/insights/publications" },
              ]}
            />
            <FooterColumn
              title="Engage"
              links={[
                { label: "Contact Us", href: "/contact" },
                { label: "Submit a Proposal", href: "/partnerships#proposal" },
                { label: "Investor Enquiries", href: "/investments#enquiry" },
                { label: "Vehicle Sourcing", href: "/automotive/sourcing" },
              ]}
            />
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-display text-[11px] font-semibold tracking-[0.28em] text-gold-soft uppercase">Head Office</h2>
            <address className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/70 not-italic">
              {site.address ? <p className="whitespace-pre-line">{site.address}</p> : <p className="text-white/40">Office address to be published.</p>}
              {site.phone && (
                <p>
                  <a className="hover:text-white" href={`tel:${site.phone.replace(/\s/g, "")}`}>
                    {site.phone}
                  </a>
                  {site.phoneSecondary && (
                    <>
                      <br />
                      <a className="hover:text-white" href={`tel:${site.phoneSecondary.replace(/\s/g, "")}`}>
                        {site.phoneSecondary}
                      </a>
                    </>
                  )}
                </p>
              )}
              {site.email && (
                <p>
                  <a className="hover:text-white" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                </p>
              )}
              {site.officeHours && <p className="text-sm text-white/45">{site.officeHours}</p>}
            </address>
            {socials.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-gold-soft">
                      {SOCIAL_LABELS[key] ?? key}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 py-8 text-[13px] text-white/40 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.legalName || site.companyName}. All rights reserved.
            {site.registration && <span className="ml-2">{site.registration}</span>}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalPages.map((p) => (
              <li key={p.slug}>
                <Link href={`/legal/${p.slug}`} className="hover:text-white">
                  {p.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/sitemap.xml" className="hover:text-white">
                Sitemap
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-[11px] font-semibold tracking-[0.28em] text-gold-soft uppercase">{title}</h2>
      <ul className="mt-6 space-y-3">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-[14.5px] text-white/65 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

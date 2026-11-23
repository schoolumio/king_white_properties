import { db } from "@/lib/db";
import { getSite } from "@/lib/content";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

async function legalPages() {
  try {
    return await db.page.findMany({ where: { published: true }, select: { slug: true, title: true }, orderBy: { title: "asc" } });
  } catch {
    return [];
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, pages] = await Promise.all([getSite(), legalPages()]);
  return (
    <>
      <a href="#main" className="sr-only z-[100] bg-gold px-4 py-2 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <SiteHeader companyName={site.companyName} logo={site.logo} logoInverse={site.logoInverse} phone={site.phone} email={site.email} />
      <main id="main">{children}</main>
      <SiteFooter site={site} legalPages={pages} />
    </>
  );
}

import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { PUBLICATION_LABELS } from "@/lib/labels";
import { formatBytes, formatDate } from "@/lib/format";
import { downloadUrl } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { EmptyState } from "@/components/ui/section";

export const metadata: Metadata = pageMetadata({ title: "Corporate Publications", description: "Download corporate profiles, brochures, reports and policies.", path: "/insights/publications" });

export default async function PublicationsPage() {
  const pubs = await db.publication.findMany({ where: { publishStatus: "PUBLISHED" }, orderBy: [{ category: "asc" }, { publishedAt: "desc" }], include: { file: true } }).catch(() => []);
  const groups = Object.entries(PUBLICATION_LABELS)
    .map(([k, label]) => ({ label, items: pubs.filter((p) => p.category === k) }))
    .filter((g) => g.items.length);
  return (
    <>
      <PageHero eyebrow="Insights" title="Corporate Publications" statement="Corporate profiles, brochures, reports and policies available for download." crumbs={[{ label: "Insights", href: "/insights" }, { label: "Publications" }]} size="sm" />
      <section className="bg-white py-16 sm:py-24">
        <div className="shell max-w-5xl">
          {groups.length === 0 ? (
            <EmptyState title="No publications available yet." description="Corporate publications will be available for download here once released." />
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-16 last:mb-0">
                <h2 className="eyebrow">{g.label}</h2>
                <ul className="mt-6 divide-y divide-line border-y border-line">
                  {g.items.map((p) => (
                    <li key={p.id}>
                      <a href={downloadUrl(p.file)} className="group grid gap-3 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6">
                        <FileText className="h-6 w-6 text-gold-deep" strokeWidth={1.4} aria-hidden />
                        <span>
                          <span className="block font-display text-lg font-semibold text-navy group-hover:text-gold-deep">{p.title}</span>
                          {p.description && <span className="mt-1 block text-[15px] text-ink/60">{p.description}</span>}
                          <span className="mt-1 block text-xs tracking-wide text-steel uppercase">
                            {formatDate(p.publishedAt, "short")} · {formatBytes(p.file.size)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
                          <Download className="h-4 w-4" aria-hidden /> Download
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/page-hero";
import { Markdown } from "@/components/ui/markdown";

async function getPage(slug: string) {
  return db.page.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await getPage((await params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.metaDescription, path: `/legal/${page.slug}` });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return (
    <>
      <PageHero title={page.title} crumbs={[{ label: page.title }]} size="sm" statement={`Last updated ${formatDate(page.updatedAt)}`} />
      <section className="bg-white py-20">
        <div className="shell max-w-3xl">
          <Markdown>{page.body}</Markdown>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { ARTICLE_TYPE_LABELS } from "@/lib/labels";
import { AdminButtonLink, EmptyRow, PageHeader, PublishPill, Table, Td, Th } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/section";

export const metadata = { title: "Insights" };

export default async function AdminInsights() {
  await requireUser("insights.manage");
  const rows = await db.article.findMany({ orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { updatedAt: "desc" }] });
  return (
    <>
      <PageHeader title="Insights & news" description="Corporate announcements, market insights, company news and project updates." actions={<AdminButtonLink href="/admin/insights/new"><Plus className="h-4 w-4" /> New article</AdminButtonLink>} />
      <Table>
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Publish date</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={5}>No articles yet.</EmptyRow>}
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-[#fafaf8]">
              <Td>
                <Link href={`/admin/insights/${a.id}`} className="font-medium text-navy hover:underline">
                  {a.title}
                </Link>
                {a.featured && <span className="ml-2 text-xs text-gold-deep">Featured</span>}
                {a.isDemo && <DemoBadge />}
              </Td>
              <Td>{ARTICLE_TYPE_LABELS[a.type]}</Td>
              <Td>
                <PublishPill status={a.publishStatus} />
                {a.publishStatus === "PUBLISHED" && a.publishedAt && a.publishedAt > new Date() && <span className="ml-2 text-xs text-ink/50">Scheduled</span>}
              </Td>
              <Td>{formatDate(a.publishedAt, "short") || "—"}</Td>
              <Td className="text-ink/55">{formatDate(a.updatedAt, "short")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

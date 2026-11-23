import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { firstParam } from "@/lib/utils";
import { AdminButtonLink, EmptyRow, FilterForm, FilterSelect, PageHeader, PublishPill, Table, Td, Th } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/section";

export const metadata = { title: "Developments" };

export default async function AdminDevelopments({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser("development.manage");
  const sp = await searchParams;
  const v = { status: firstParam(sp.status), publish: firstParam(sp.publish) };
  const rows = await db.developmentProject.findMany({
    where: { ...(v.status ? { status: v.status as never } : {}), publishStatus: v.publish ? (v.publish as never) : { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: { location: true, _count: { select: { units: true, updates: true, media: true, enquiries: true } } },
  });
  return (
    <>
      <PageHeader title="Developments" description="Project portfolio, stages, galleries, unit availability and progress updates." actions={<AdminButtonLink href="/admin/developments/new"><Plus className="h-4 w-4" /> New development</AdminButtonLink>} />
      <FilterForm action="/admin/developments">
        <FilterSelect name="status" label="Stage" value={v.status} options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
        <FilterSelect name="publish" label="Publication" value={v.publish} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} />
      </FilterForm>
      <Table>
        <thead>
          <tr>
            <Th>Development</Th>
            <Th>Status</Th>
            <Th>Progress</Th>
            <Th>Units</Th>
            <Th>Media</Th>
            <Th>Publication</Th>
            <Th>Enquiries</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8}>No developments yet.</EmptyRow>}
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-[#fafaf8]">
              <Td>
                <Link href={`/admin/developments/${p.id}`} className="font-medium text-navy hover:underline">
                  {p.name}
                </Link>
                <span className="block text-xs text-ink/50">
                  {SECTOR_LABELS[p.sector]} · {p.location?.name ?? "No location"}
                </span>
                {p.isDemo && <DemoBadge />}
              </Td>
              <Td>{PROJECT_STATUS_LABELS[p.status]}</Td>
              <Td>{p.progressPercent !== null ? `${p.progressPercent}%` : "—"}</Td>
              <Td>{p._count.units}</Td>
              <Td className={p._count.media === 0 ? "text-amber-700" : ""}>{p._count.media}</Td>
              <Td>
                <PublishPill status={p.publishStatus} />
              </Td>
              <Td>{p._count.enquiries}</Td>
              <Td className="text-ink/55">{formatDate(p.updatedAt, "short")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { firstParam, toInt } from "@/lib/utils";
import { AdminPager, EmptyRow, FilterForm, FilterInput, FilterSelect, PageHeader, Table, Td, Th } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };
const PAGE_SIZE = 50;

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser("audit.view");
  const sp = await searchParams;
  const v = { q: firstParam(sp.q), user: firstParam(sp.user) };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where = {
    ...(v.user ? { userId: v.user } : {}),
    ...(v.q ? { OR: [{ action: { contains: v.q, mode: "insensitive" as const } }, { summary: { contains: v.q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, rows, users] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { user: { select: { name: true } } } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Audit log" description="Administrative activity, sign-ins and data changes. Entries cannot be edited or deleted from the portal." />
      <FilterForm action="/admin/audit">
        <FilterInput name="q" label="Search" value={v.q} placeholder="Action or summary" />
        <FilterSelect name="user" label="User" value={v.user} options={users.map((u) => ({ value: u.id, label: u.name }))} />
      </FilterForm>
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>User</Th>
            <Th>Action</Th>
            <Th>Summary</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={4}>No entries.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="whitespace-nowrap text-ink/60">{formatDate(r.createdAt, "datetime")}</Td>
              <Td>{r.user?.name ?? <span className="text-ink/45">System / anonymous</span>}</Td>
              <Td className="font-mono text-[12px] text-ink/70">{r.action}</Td>
              <Td>{r.summary}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <AdminPager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/admin/audit" params={v} />
    </>
  );
}

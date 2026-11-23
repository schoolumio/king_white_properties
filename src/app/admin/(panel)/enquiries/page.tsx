import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/auth";
import { visibleCategories } from "@/lib/enquiry-access";
import { buildEnquiryWhere } from "@/lib/enquiry-filters";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES, PRIORITIES, statusMeta } from "@/lib/enquiry-meta";
import { formatDate } from "@/lib/format";
import { firstParam, toInt } from "@/lib/utils";
import { AdminPager, EmptyRow, FilterForm, FilterInput, FilterSelect, PageHeader, Pill, Table, Td, Th } from "@/components/admin/ui";

export const metadata = { title: "Enquiries" };
const PAGE_SIZE = 25;

const PRIORITY_TONES = { LOW: "text-ink/50", NORMAL: "text-ink/70", HIGH: "text-amber-700 font-semibold", URGENT: "text-rose-700 font-semibold" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(["enquiry.view_all", "enquiry.view_assigned", "enquiry.view_real_estate", "enquiry.view_automotive", "enquiry.view_corporate"]);
  const sp = await searchParams;
  const v = {
    q: firstParam(sp.q),
    category: firstParam(sp.category),
    status: firstParam(sp.status),
    priority: firstParam(sp.priority),
    assigned: firstParam(sp.assigned),
    from: firstParam(sp.from),
    to: firstParam(sp.to),
  };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where = buildEnquiryWhere(user, v);
  const [total, rows, staff] = await Promise.all([
    db.enquiry.count({ where }),
    db.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignedTo: { select: { name: true } }, property: { select: { title: true } }, vehicle: { select: { make: true, model: true, year: true } }, project: { select: { name: true } } },
    }),
    db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const qs = new URLSearchParams(Object.entries(v).filter(([, x]) => x) as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Central enquiry management across both divisions and corporate channels."
        actions={
          can(user, "enquiry.export") && (
            <a href={`/api/admin/enquiries/export${qs ? `?${qs}` : ""}`} className="inline-flex h-10 items-center gap-2 border border-line bg-white px-4 text-[13.5px] font-semibold text-primary hover:border-primary">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          )
        }
      />
      <FilterForm action="/admin/enquiries">
        <FilterInput name="q" label="Search" value={v.q} placeholder="Reference, name, email, organisation" />
        <FilterSelect name="category" label="Category" value={v.category} options={visibleCategories(user).map((c) => ({ value: c, label: ENQUIRY_CATEGORIES[c].label }))} />
        <FilterSelect name="status" label="Status" value={v.status} options={[{ value: "OPEN", label: "All open" }, ...ENQUIRY_STATUSES.map((s) => ({ value: s.value, label: s.label }))]} />
        <FilterSelect name="priority" label="Priority" value={v.priority} options={PRIORITIES} />
        <FilterSelect name="assigned" label="Assigned to" value={v.assigned} options={[{ value: "me", label: "Me" }, { value: "none", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} />
        <label className="text-[12px] text-ink/55">
          <span className="mb-1 block">From</span>
          <input type="date" name="from" defaultValue={v.from} className="h-9 border border-line bg-white px-2 text-[13px]" />
        </label>
        <label className="text-[12px] text-ink/55">
          <span className="mb-1 block">To</span>
          <input type="date" name="to" defaultValue={v.to} className="h-9 border border-line bg-white px-2 text-[13px]" />
        </label>
      </FilterForm>
      <p className="mb-3 text-[13px] text-ink/55">{total} enquir{total === 1 ? "y" : "ies"}</p>
      <Table>
        <thead>
          <tr>
            <Th>Reference</Th>
            <Th>Contact</Th>
            <Th>Category</Th>
            <Th>Related to</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Assigned</Th>
            <Th>Received</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8}>No enquiries match these filters.</EmptyRow>}
          {rows.map((e) => {
            const st = statusMeta(e.status);
            const related = e.property?.title ?? (e.vehicle ? `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` : e.project?.name) ?? "—";
            return (
              <tr key={e.id} className="hover:bg-[#f8faf9]">
                <Td>
                  <Link href={`/admin/enquiries/${e.id}`} className="font-mono text-[12.5px] font-semibold text-primary underline-offset-2 hover:underline">
                    {e.reference}
                  </Link>
                </Td>
                <Td>
                  <span className="block font-medium text-primary">{e.name}</span>
                  <span className="block text-xs text-ink/50">{e.organisation || e.email}</span>
                </Td>
                <Td className="text-ink/70">{ENQUIRY_CATEGORIES[e.category].label}</Td>
                <Td className="max-w-48 truncate text-ink/60">{related}</Td>
                <Td>
                  <Pill className={st.tone}>{st.label}</Pill>
                </Td>
                <Td className={PRIORITY_TONES[e.priority]}>{e.priority.charAt(0) + e.priority.slice(1).toLowerCase()}</Td>
                <Td className="text-ink/70">{e.assignedTo?.name ?? <span className="text-ink/35">Unassigned</span>}</Td>
                <Td className="whitespace-nowrap text-ink/60">{formatDate(e.createdAt, "datetime")}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <AdminPager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/admin/enquiries" params={v} />
    </>
  );
}

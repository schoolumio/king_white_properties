import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { enquiryScope } from "@/lib/enquiry-access";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES } from "@/lib/enquiry-meta";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Reports" };

function Bars({ rows, total }: { rows: { label: string; value: number }[]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(8rem,12rem)_1fr_3.5rem] items-center gap-3 text-[13px]">
          <span className="truncate text-ink/70">{r.label}</span>
          <span className="h-2.5 bg-[#efeee9]">
            <span className="block h-full bg-navy" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right font-medium text-navy tabular-nums">
            {r.value}
            <span className="ml-1 text-[11px] font-normal text-ink/40">{total ? Math.round((r.value / total) * 100) : 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function Reports() {
  const user = await requireUser("reports.view");
  const scope = enquiryScope(user);
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [byCategory, byStatus, recent, total, converted, closedOrRejected] = await Promise.all([
    db.enquiry.groupBy({ by: ["category"], where: scope, _count: { _all: true } }),
    db.enquiry.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    db.enquiry.findMany({ where: { AND: [scope, { createdAt: { gte: since } }] }, select: { createdAt: true } }),
    db.enquiry.count({ where: scope }),
    db.enquiry.count({ where: { AND: [scope, { status: "CONVERTED" }] } }),
    db.enquiry.count({ where: { AND: [scope, { status: { in: ["CONVERTED", "CLOSED", "REJECTED"] } }] } }),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), value: 0 };
  });
  for (const r of recent) {
    const m = months.find((x) => x.key === `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`);
    if (m) m.value++;
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.value));

  return (
    <>
      <PageHeader title="Reports" description="Enquiry analytics calculated from live CRM records within your access scope." />
      <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {[
          ["Total enquiries", total],
          ["Converted", converted],
          ["Conversion rate (resolved)", closedOrRejected ? `${Math.round((converted / closedOrRejected) * 100)}%` : "—"],
          ["Last 12 months", recent.length],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-white p-5">
            <p className="text-[12px] text-ink/55">{l}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-navy">{v}</p>
          </div>
        ))}
      </div>
      <Panel title="Enquiries per month" className="mb-6">
        <div className="flex h-48 items-end gap-2" role="img" aria-label="Bar chart of enquiries per month for the last twelve months">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] text-ink/60 tabular-nums">{m.value || ""}</span>
              <span className="w-full bg-navy" style={{ height: `${(m.value / maxMonth) * 140}px`, minHeight: m.value ? 2 : 0 }} />
              <span className="text-[10.5px] text-ink/50">{m.label}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="By category">
          <Bars total={total} rows={byCategory.map((r) => ({ label: ENQUIRY_CATEGORIES[r.category].label, value: r._count._all })).sort((a, b) => b.value - a.value)} />
          {byCategory.length === 0 && <p className="text-sm text-ink/50">No data yet.</p>}
        </Panel>
        <Panel title="By status (pipeline)">
          <Bars total={total} rows={ENQUIRY_STATUSES.map((s) => ({ label: s.label, value: byStatus.find((b) => b.status === s.value)?._count._all ?? 0 }))} />
        </Panel>
      </div>
    </>
  );
}

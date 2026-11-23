import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/auth";
import { enquiryScope } from "@/lib/enquiry-access";
import { ENQUIRY_CATEGORIES, OPEN_STATUSES, statusMeta } from "@/lib/enquiry-meta";
import { relativeTime } from "@/lib/format";
import { PageHeader, Panel, Pill, Notice } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser("dashboard.view");
  const sp = await searchParams;
  const scope = enquiryScope(user);
  const w = (extra: object) => ({ AND: [scope, extra] });

  const [total, fresh, pending, qualified, fleet, partnerships, properties, developments, vehicles, recent, activity, demoCount] = await Promise.all([
    db.enquiry.count({ where: scope }),
    db.enquiry.count({ where: w({ status: "NEW" }) }),
    db.enquiry.count({ where: w({ status: { in: OPEN_STATUSES.filter((s) => s !== "NEW") } }) }),
    db.enquiry.count({ where: w({ status: "QUALIFIED" }) }),
    db.enquiry.count({ where: w({ category: "FLEET" }) }),
    db.enquiry.count({ where: w({ category: "PARTNERSHIP" }) }),
    db.property.count({ where: { publishStatus: "PUBLISHED" } }),
    db.developmentProject.count({ where: { publishStatus: "PUBLISHED", status: { in: ["UNDER_DEVELOPMENT", "UPCOMING"] } } }),
    db.vehicle.count({ where: { publishStatus: "PUBLISHED", availability: "AVAILABLE" } }),
    db.enquiry.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 8, include: { assignedTo: { select: { name: true } } } }),
    can(user, "audit.view")
      ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } })
      : db.enquiryActivity.findMany({ where: { enquiry: scope }, orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } }, enquiry: { select: { reference: true } } } }),
    db.property.count({ where: { isDemo: true } }),
  ]);

  const stats = [
    { label: "Total enquiries", value: total, href: "/admin/enquiries" },
    { label: "New enquiries", value: fresh, href: "/admin/enquiries?status=NEW", accent: fresh > 0 },
    { label: "Pending follow-up", value: pending, href: "/admin/enquiries?status=OPEN" },
    { label: "Qualified leads", value: qualified, href: "/admin/enquiries?status=QUALIFIED" },
    { label: "Fleet requests", value: fleet, href: "/admin/enquiries?category=FLEET" },
    { label: "Partnership submissions", value: partnerships, href: "/admin/enquiries?category=PARTNERSHIP" },
    { label: "Published properties", value: properties, href: "/admin/properties" },
    { label: "Active developments", value: developments, href: "/admin/developments" },
    { label: "Available vehicles", value: vehicles, href: "/admin/vehicles" },
  ];

  return (
    <>
      {sp.denied && <Notice tone="warning">You do not have permission to access that area.</Notice>}
      {demoCount > 0 && can(user, "settings.manage") && (
        <Notice tone="warning">
          Demonstration records are present in the database. Remove them before launch in <Link href="/admin/settings" className="underline">Settings → Demo data</Link>.
        </Notice>
      )}
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description={`${user.role.name} · All figures are live database counts.`} />

      <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 xl:grid-cols-9">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group bg-white p-4 hover:bg-[#fafaf8]">
            <p className="text-[11px] leading-tight font-medium text-ink/55">{s.label}</p>
            <p className={`mt-3 font-display text-3xl font-semibold ${s.accent ? "text-gold-deep" : "text-navy"}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Panel title="Latest enquiries" className="xl:col-span-2" actions={<Link href="/admin/enquiries" className="text-[13px] text-navy underline">View all</Link>}>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/50">No enquiries yet. Submissions from the website will appear here.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((e) => {
                const st = statusMeta(e.status);
                return (
                  <li key={e.id}>
                    <Link href={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-[#fafaf8]">
                      <span className="w-28 font-mono text-[12px] text-ink/60">{e.reference}</span>
                      <span className="min-w-40 flex-1">
                        <span className="block text-[14px] font-medium text-navy">{e.organisation || e.name}</span>
                        <span className="block text-xs text-ink/50">{ENQUIRY_CATEGORIES[e.category].label}</span>
                      </span>
                      <Pill className={st.tone}>{st.label}</Pill>
                      <span className="w-24 text-right text-xs text-ink/50">{relativeTime(e.createdAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/50">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="text-[13px]">
                  <p className="text-ink/80">{"summary" in a ? a.summary : `${a.enquiry.reference}: ${a.message ?? a.type.toLowerCase().replace("_", " ")}`}</p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {a.user?.name ?? "System"} · {relativeTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {can(user, "audit.view") && (
            <Link href="/admin/audit" className="mt-5 inline-flex items-center gap-1 text-[13px] text-navy underline">
              Full audit log <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </Panel>
      </div>
    </>
  );
}

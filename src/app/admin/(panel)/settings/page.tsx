import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { integrationStatus } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { humanize } from "@/lib/utils";
import { PageHeader, Panel, Table, Td, Th, EmptyRow } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/form";
import { purgeDemoData } from "@/app/admin/actions/system";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireUser("settings.manage");
  const [logs, demo] = await Promise.all([
    db.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { enquiry: { select: { id: true, reference: true } } } }),
    Promise.all([
      db.property.count({ where: { isDemo: true } }),
      db.developmentProject.count({ where: { isDemo: true } }),
      db.vehicle.count({ where: { isDemo: true } }),
      db.investmentOpportunity.count({ where: { isDemo: true } }),
      db.article.count({ where: { isDemo: true } }),
    ]),
  ]);
  const demoTotal = demo.reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHeader title="Settings" description="Notifications, integrations and platform maintenance." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Configuration">
          <ul className="divide-y divide-line">
            {[
              ["Notification recipients", "Who is emailed when enquiries arrive, per category.", "/admin/content/notifications"],
              ["Company information", "Name, contact details, address and social links.", "/admin/content/site"],
              ["Search & social metadata", "Default SEO title, description and sharing image.", "/admin/content/seo"],
              ["Brand colours", "Corporate palette applied across the website.", "/admin/content/theme"],
              ["Legal pages", "Privacy policy, terms and other pages.", "/admin/pages"],
            ].map(([t, d, h]) => (
              <li key={h}>
                <Link href={h} className="block py-3 hover:bg-[#f8faf9]">
                  <span className="font-medium text-primary">{t}</span>
                  <span className="block text-[13px] text-ink/55">{d}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="System status" description="Integrations are configured through environment variables — see the README.">
          <ul className="space-y-3">
            {integrationStatus().map((i) => (
              <li key={i.name} className="flex items-start gap-3 text-[13.5px]">
                {i.configured ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                <span>
                  <span className="font-medium text-primary">{i.name}</span>
                  <span className="block text-ink/55">{i.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-primary">Notification log</h2>
        <Table>
          <thead>
            <tr>
              <Th>Sent</Th>
              <Th>Recipient</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Enquiry</Th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <EmptyRow colSpan={5}>No notifications yet.</EmptyRow>}
            {logs.map((l) => (
              <tr key={l.id}>
                <Td className="whitespace-nowrap text-ink/60">{formatDate(l.createdAt, "datetime")}</Td>
                <Td>{l.recipient}</Td>
                <Td className="max-w-80 truncate">{l.subject}</Td>
                <Td>
                  <span className={l.status === "SENT" ? "text-emerald-700" : l.status === "FAILED" ? "text-rose-700" : "text-ink/55"}>{humanize(l.status)}</span>
                  {l.error && <span className="block max-w-72 truncate text-xs text-ink/45" title={l.error}>{l.error}</span>}
                </Td>
                <Td>{l.enquiry ? <Link className="text-primary underline" href={`/admin/enquiries/${l.enquiry.id}`}>{l.enquiry.reference}</Link> : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-ink/50">“Logged” means the email provider is set to log-only; configure Resend to deliver emails.</p>
      </div>

      <Panel title="Demo data" className="mt-6 max-w-3xl" description="Records created by the demonstration seed are flagged and labelled “Demo data” on the website.">
        {demoTotal === 0 ? (
          <p className="text-sm text-ink/60">No demonstration records are present.</p>
        ) : (
          <ActionForm action={purgeDemoData} className="space-y-3">
            <p className="text-sm text-ink/70">
              {demo[0]} properties, {demo[1]} developments, {demo[2]} vehicles, {demo[3]} opportunities and {demo[4]} articles are demonstration records. Remove them before launch.
            </p>
            <input name="confirm" placeholder="Type DELETE DEMO DATA" className="h-10 w-72 border border-line px-3 text-sm" />
            <SubmitButton variant="danger">Remove all demo data</SubmitButton>
          </ActionForm>
        )}
      </Panel>
    </>
  );
}

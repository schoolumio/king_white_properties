import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/auth";
import { canViewEnquiry } from "@/lib/enquiry-access";
import { ENQUIRY_CATEGORIES, ENQUIRY_STATUSES, PRIORITIES, statusMeta } from "@/lib/enquiry-meta";
import { formatBytes, formatDate } from "@/lib/format";
import { humanize } from "@/lib/utils";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/form";
import { updateEnquiry } from "@/app/admin/actions/enquiries";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const e = await db.enquiry.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      division: true,
      property: { select: { id: true, title: true, slug: true } },
      project: { select: { id: true, name: true, slug: true } },
      vehicle: { select: { id: true, make: true, model: true, year: true, slug: true } },
      opportunity: { select: { id: true, title: true } },
      inspection: true,
      fleetRequest: true,
      sourcing: true,
      partnership: true,
      attachments: { include: { media: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      assignments: { orderBy: { assignedAt: "desc" }, include: { user: { select: { name: true } } } },
      notifications: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!e || !canViewEnquiry(user, e)) notFound();
  const staff = can(user, "enquiry.assign") ? await db.user.findMany({ where: { active: true }, select: { id: true, name: true, role: { select: { name: true } } }, orderBy: { name: "asc" } }) : [];
  const st = statusMeta(e.status);
  const canUpdate = can(user, "enquiry.update");
  const meta = (e.metadata ?? {}) as Record<string, string | null>;

  const details: [string, string | null | undefined][] = [];
  if (e.inspection)
    details.push(
      ["Request type", humanize(e.inspection.type)],
      ["Preferred date", e.inspection.preferredDate ? formatDate(e.inspection.preferredDate) : null],
      ["Preferred time", e.inspection.preferredTime],
      ["Attendees", e.inspection.attendees?.toString()],
    );
  if (e.fleetRequest)
    details.push(
      ["Organisation", e.fleetRequest.organisationName],
      ["Vehicle category", e.fleetRequest.vehicleCategory],
      ["Quantity", String(e.fleetRequest.quantity)],
      ["Budget range", e.fleetRequest.budgetRange],
      ["Procurement timeline", e.fleetRequest.procurementTimeline],
      ["Acquisition", e.fleetRequest.acquisitionMode],
    );
  if (e.sourcing)
    details.push(
      ["Make / model", `${e.sourcing.make} ${e.sourcing.model}`],
      ["Year range", [e.sourcing.yearFrom, e.sourcing.yearTo].filter(Boolean).join(" – ") || null],
      ["Budget", e.sourcing.budget],
      ["Condition", e.sourcing.conditionPreference],
      ["Country preference", e.sourcing.countryPreference],
    );
  if (e.partnership)
    details.push(
      ["Organisation", e.partnership.organisationName],
      ["Organisation type", e.partnership.organisationType],
      ["Partnership category", e.partnership.category],
      ["Estimated value", e.partnership.estimatedValue],
    );
  for (const [k, val] of Object.entries(meta)) if (val) details.push([humanize(k.replace(/([A-Z])/g, "_$1").toUpperCase()), String(val)]);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/enquiries", label: "All enquiries" }}
        title={e.reference}
        description={`${ENQUIRY_CATEGORIES[e.category].label} · received ${formatDate(e.createdAt, "datetime")}${e.division ? ` · ${e.division.name}` : ""}`}
        actions={<Pill className={`${st.tone} px-3 py-1.5 text-[12px]`}>{st.label}</Pill>}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="font-display text-lg font-semibold text-primary">{e.name}</p>
                {(e.position || e.organisation) && <p className="text-sm text-ink/60">{[e.position, e.organisation].filter(Boolean).join(", ")}</p>}
                {e.country && <p className="text-sm text-ink/50">{e.country}</p>}
              </div>
              <div className="space-y-2 text-sm">
                <a href={`mailto:${e.email}?subject=${encodeURIComponent(`Re: ${e.reference}`)}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4 text-accent-deep" /> {e.email}
                </a>
                {e.phone && (
                  <a href={`tel:${e.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="h-4 w-4 text-accent-deep" /> {e.phone}
                  </a>
                )}
                <p className="text-xs text-ink/45">Privacy consent: {e.consent ? "given" : "not recorded"}</p>
              </div>
            </div>
          </Panel>

          <Panel title={e.subject ?? "Message"}>
            {e.message ? <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink/85">{e.message}</p> : <p className="text-sm text-ink/45">No message provided.</p>}
            {details.filter(([, v]) => v).length > 0 && (
              <dl className="mt-6 grid gap-x-8 border-t border-line pt-4 sm:grid-cols-2">
                {details
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line py-2 text-[13.5px]">
                      <dt className="text-ink/55">{k}</dt>
                      <dd className="text-right font-medium text-primary">{v}</dd>
                    </div>
                  ))}
              </dl>
            )}
            {(e.property || e.vehicle || e.project || e.opportunity) && (
              <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
                {e.property && <RelatedLink admin={`/admin/properties/${e.property.id}`} site={`/real-estate/properties/${e.property.slug}`} label={`Property: ${e.property.title}`} />}
                {e.project && <RelatedLink admin={`/admin/developments/${e.project.id}`} site={`/real-estate/developments/${e.project.slug}`} label={`Development: ${e.project.name}`} />}
                {e.vehicle && <RelatedLink admin={`/admin/vehicles/${e.vehicle.id}`} site={`/automotive/vehicles/${e.vehicle.slug}`} label={`Vehicle: ${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}`} />}
                {e.opportunity && <RelatedLink admin={`/admin/investments/${e.opportunity.id}`} label={`Opportunity: ${e.opportunity.title}`} />}
              </div>
            )}
            {e.attachments.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink/55 uppercase">Confidential attachments</p>
                {e.attachments.map((a) => (
                  <a key={a.id} href={`/api/files/${a.mediaId}?download=1`} className="flex items-center gap-2 py-1 text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4 text-accent-deep" /> {a.media.originalName} <span className="text-ink/45">({formatBytes(a.media.size)})</span>
                  </a>
                ))}
              </div>
            )}
            {e.sourcePath && <p className="mt-6 text-xs text-ink/40">Submitted from {e.sourcePath}</p>}
          </Panel>

          <Panel title="Activity history">
            {canUpdate && (
              <ActionForm action={updateEnquiry} className="mb-6" resetOnSuccess>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="op" value="note" />
                <textarea name="note" rows={3} placeholder="Add an internal note (not visible to the client)…" className="w-full border border-line px-3 py-2 text-[14px] outline-none focus:border-primary" />
                <div className="mt-2 flex justify-end">
                  <SubmitButton>Add note</SubmitButton>
                </div>
              </ActionForm>
            )}
            <ol className="relative space-y-5 border-l border-line pl-5">
              {e.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className={`absolute top-1.5 -left-[23.5px] h-2 w-2 ${a.type === "NOTE" ? "bg-accent" : "bg-primary/40"}`} />
                  <p className="text-[13.5px] text-ink/85">
                    {a.type === "NOTE" ? (
                      <span className="whitespace-pre-wrap">{a.message}</span>
                    ) : a.type === "STATUS_CHANGED" ? (
                      <>Status changed from <b>{statusMeta(a.fromValue as never).label}</b> to <b>{statusMeta(a.toValue as never).label}</b></>
                    ) : a.type === "PRIORITY_CHANGED" ? (
                      <>Priority changed to <b>{humanize(a.toValue)}</b></>
                    ) : a.type === "ASSIGNED" ? (
                      <>Assigned to <b>{a.toValue}</b></>
                    ) : a.type === "UNASSIGNED" ? (
                      <>Unassigned from {a.fromValue}</>
                    ) : (
                      a.message
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {a.type === "NOTE" ? "Note · " : ""}
                    {a.user?.name ?? "System"} · {formatDate(a.createdAt, "datetime")}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          {canUpdate && (
            <Panel title="Manage">
              <div className="space-y-5">
                <ActionForm action={updateEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="op" value="status" />
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">Status</label>
                  <div className="flex gap-2">
                    <select name="status" defaultValue={e.status} className="h-10 flex-1 border border-line px-2 text-[14px]">
                      {ENQUIRY_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <SubmitButton variant="secondary">Update</SubmitButton>
                  </div>
                </ActionForm>
                <ActionForm action={updateEnquiry}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="op" value="priority" />
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">Priority</label>
                  <div className="flex gap-2">
                    <select name="priority" defaultValue={e.priority} className="h-10 flex-1 border border-line px-2 text-[14px]">
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <SubmitButton variant="secondary">Update</SubmitButton>
                  </div>
                </ActionForm>
                {can(user, "enquiry.assign") && (
                  <ActionForm action={updateEnquiry}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="op" value="assign" />
                    <label className="mb-1.5 block text-[12.5px] font-semibold text-ink/75">Assigned staff member</label>
                    <div className="flex gap-2">
                      <select name="assigneeId" defaultValue={e.assignedToId ?? ""} className="h-10 min-w-0 flex-1 border border-line px-2 text-[14px]">
                        <option value="">Unassigned</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.role.name}
                          </option>
                        ))}
                      </select>
                      <SubmitButton variant="secondary">Assign</SubmitButton>
                    </div>
                  </ActionForm>
                )}
              </div>
            </Panel>
          )}
          <Panel title="Summary">
            <dl className="space-y-2 text-[13.5px]">
              {[
                ["Reference", e.reference],
                ["Category", ENQUIRY_CATEGORIES[e.category].label],
                ["Priority", humanize(e.priority)],
                ["Assigned to", e.assignedTo?.name ?? "Unassigned"],
                ["Submitted", formatDate(e.createdAt, "datetime")],
                ["Last activity", formatDate(e.lastActivityAt, "datetime")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink/55">{k}</dt>
                  <dd className="text-right font-medium text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          {e.assignments.length > 0 && (
            <Panel title="Assignment history">
              <ul className="space-y-2 text-[13px]">
                {e.assignments.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className="text-primary">{a.user.name}</span>
                    <span className="text-ink/50">
                      {formatDate(a.assignedAt, "short")}
                      {a.endedAt ? ` – ${formatDate(a.endedAt, "short")}` : " – current"}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel title="Notifications">
            {e.notifications.length === 0 ? (
              <p className="text-[13px] text-ink/50">No notifications were sent. Configure recipients in Settings.</p>
            ) : (
              <ul className="space-y-2 text-[12.5px]">
                {e.notifications.map((n) => (
                  <li key={n.id}>
                    <span className="text-primary">{n.recipient}</span>
                    <span className={`ml-2 ${n.status === "SENT" ? "text-emerald-700" : n.status === "FAILED" ? "text-rose-700" : "text-ink/50"}`}>{humanize(n.status)}</span>
                    {n.error && <span className="block text-ink/45">{n.error}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function RelatedLink({ admin, site, label }: { admin: string; site?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-line bg-[#f8faf9] px-3 py-1.5">
      <Link href={admin} className="text-primary hover:underline">
        {label}
      </Link>
      {site && (
        <Link href={site} target="_blank" aria-label="View on website" className="text-ink/40 hover:text-primary">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </span>
  );
}

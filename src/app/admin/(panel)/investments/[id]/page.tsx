import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Notice, PageHeader, PublishPill } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/form";
import { RecordCommands } from "@/components/admin/record-commands";
import { opportunityCommand } from "@/app/admin/actions/investments";
import { OpportunityForm } from "../opportunity-form";

export const metadata = { title: "Edit opportunity" };

export default async function EditOpportunity({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser(["investment.manage", "investment.approve"]);
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const o = await db.investmentOpportunity.findUnique({ where: { id }, include: { cover: true, documents: { orderBy: { order: "asc" }, include: { media: true } }, approvedBy: { select: { name: true } } } });
  if (!o) notFound();
  const hasTerms = Boolean(o.termsSummary || o.minimumParticipation);
  return (
    <>
      <PageHeader title={o.title} back={{ href: "/admin/investments", label: "Investments" }} actions={<PublishPill status={o.publishStatus} />} />
      {sp.created && <Notice tone="success">Opportunity created.</Notice>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-line bg-white p-4">
        <div className="text-sm">
          {!hasTerms ? (
            <span className="text-ink/55">No commercial terms entered.</span>
          ) : o.termsApproved ? (
            <span className="text-emerald-800">
              Terms approved by {o.approvedBy?.name ?? "—"} on {formatDate(o.approvedAt)}.
            </span>
          ) : (
            <span className="text-amber-800">Terms are awaiting approval and are hidden from the public page.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasTerms && can(user, "investment.approve") && (
            <ActionForm action={opportunityCommand}>
              <input type="hidden" name="id" value={o.id} />
              {o.termsApproved ? (
                <SubmitButton name="op" value="revoke" variant="secondary">
                  Revoke approval
                </SubmitButton>
              ) : (
                <SubmitButton name="op" value="approve">
                  Approve terms
                </SubmitButton>
              )}
            </ActionForm>
          )}
          {can(user, "investment.manage") && <RecordCommands id={o.id} status={o.publishStatus} action={opportunityCommand} label="opportunity" />}
        </div>
      </div>
      {can(user, "investment.manage") ? <OpportunityForm opportunity={o} /> : <p className="text-sm text-ink/60">You can approve terms but not edit this opportunity.</p>}
    </>
  );
}

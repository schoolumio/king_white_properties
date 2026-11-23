import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { OPPORTUNITY_SECTOR_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { AdminButtonLink, EmptyRow, PageHeader, Pill, PublishPill, Table, Td, Th } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/section";

export const metadata = { title: "Investments" };

export default async function AdminInvestments() {
  await requireUser(["investment.manage", "investment.approve"]);
  const rows = await db.investmentOpportunity.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { enquiries: true, documents: true } } } });
  return (
    <>
      <PageHeader
        title="Investment opportunities"
        description="Only company-approved opportunities should be published. Commercial terms are hidden publicly until approved by an authorised approver."
        actions={<AdminButtonLink href="/admin/investments/new"><Plus className="h-4 w-4" /> New opportunity</AdminButtonLink>}
      />
      <Table>
        <thead>
          <tr>
            <Th>Opportunity</Th>
            <Th>Sector</Th>
            <Th>Status</Th>
            <Th>Terms</Th>
            <Th>Publication</Th>
            <Th>Documents</Th>
            <Th>Enquiries</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8}>No opportunities yet.</EmptyRow>}
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-[#fafaf8]">
              <Td>
                <Link href={`/admin/investments/${o.id}`} className="font-medium text-navy hover:underline">
                  {o.title}
                </Link>
                {o.isDemo && <DemoBadge />}
              </Td>
              <Td>{OPPORTUNITY_SECTOR_LABELS[o.sector]}</Td>
              <Td>{OPPORTUNITY_STATUS_LABELS[o.status]}</Td>
              <Td>
                {!o.termsSummary && !o.minimumParticipation ? (
                  <span className="text-ink/40">None</span>
                ) : o.termsApproved ? (
                  <Pill className="bg-emerald-100 text-emerald-800">Approved</Pill>
                ) : (
                  <Pill className="bg-amber-100 text-amber-800">Awaiting approval</Pill>
                )}
              </Td>
              <Td>
                <PublishPill status={o.publishStatus} />
              </Td>
              <Td>{o._count.documents}</Td>
              <Td>{o._count.enquiries}</Td>
              <Td className="text-ink/55">{formatDate(o.updatedAt, "short")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeader, PublishPill } from "@/components/admin/ui";
import { RecordCommands } from "@/components/admin/record-commands";
import { DemoBadge } from "@/components/ui/section";
import { propertyCommand } from "@/app/admin/actions/properties";
import { PropertyForm } from "../property-form";

export const metadata = { title: "Edit property" };

export default async function EditProperty({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireUser("property.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await db.property.findUnique({
    where: { id },
    include: { images: { orderBy: [{ kind: "asc" }, { order: "asc" }], include: { media: true } }, documents: { orderBy: { order: "asc" }, include: { media: true } }, _count: { select: { enquiries: true } } },
  });
  if (!p) notFound();
  return (
    <>
      <PageHeader
        title={p.title}
        back={{ href: "/admin/properties", label: "Properties" }}
        actions={
          <>
            <PublishPill status={p.publishStatus} />
            {p.isDemo && <DemoBadge />}
            {p.publishStatus === "PUBLISHED" && (
              <Link href={`/real-estate/properties/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-navy underline">
                View on website <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        }
      />
      {sp.created && <Notice tone="success">Property created.</Notice>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-line bg-white p-4">
        <p className="text-sm text-ink/60">
          {p._count.enquiries} linked enquir{p._count.enquiries === 1 ? "y" : "ies"} ·{" "}
          <Link href={`/admin/enquiries?q=${encodeURIComponent(p.title)}`} className="text-navy underline">
            view in CRM
          </Link>
        </p>
        <RecordCommands id={p.id} status={p.publishStatus} action={propertyCommand} label="property" />
      </div>
      <PropertyForm property={p} />
    </>
  );
}

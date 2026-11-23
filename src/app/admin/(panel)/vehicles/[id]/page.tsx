import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeader, PublishPill } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit } from "@/components/admin/form";
import { RecordCommands } from "@/components/admin/record-commands";
import { DemoBadge } from "@/components/ui/section";
import { vehicleCommand } from "@/app/admin/actions/vehicles";
import { VehicleForm } from "../vehicle-form";

export const metadata = { title: "Edit vehicle" };

export default async function EditVehicle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireUser("vehicle.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const v = await db.vehicle.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" }, include: { media: true } }, categories: true } });
  if (!v) notFound();
  return (
    <>
      <PageHeader
        title={`${v.year} ${v.make} ${v.model}`}
        back={{ href: "/admin/vehicles", label: "Vehicles" }}
        actions={
          <>
            <PublishPill status={v.publishStatus} />
            {v.isDemo && <DemoBadge />}
            {v.publishStatus === "PUBLISHED" && (
              <Link href={`/automotive/vehicles/${v.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-navy underline">
                View on website <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        }
      />
      {sp.created && <Notice tone="success">Vehicle added.</Notice>}
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2 border border-line bg-white p-4">
        {v.availability !== "SOLD" && (
          <ActionForm action={vehicleCommand}>
            <input type="hidden" name="id" value={v.id} />
            <ConfirmSubmit name="op" value="sold" variant="primary" message="Mark this vehicle as sold? It will be removed from the public inventory.">
              Mark as sold
            </ConfirmSubmit>
          </ActionForm>
        )}
        <RecordCommands id={v.id} status={v.publishStatus} action={vehicleCommand} label="vehicle" />
      </div>
      <VehicleForm vehicle={v} />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CURRENCIES, formatDate, formatPrice } from "@/lib/format";
import { UNIT_STATUS_LABELS } from "@/lib/labels";
import { Notice, PageHeader, Panel, PublishPill } from "@/components/admin/ui";
import { ActionForm, Checkbox, ConfirmSubmit, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { RecordCommands } from "@/components/admin/record-commands";
import { DemoBadge } from "@/components/ui/section";
import { developmentCommand, saveProjectUpdate, saveUnit } from "@/app/admin/actions/developments";
import { DevelopmentForm } from "../development-form";

export const metadata = { title: "Edit development" };

export default async function EditDevelopment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireUser("development.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await db.developmentProject.findUnique({
    where: { id },
    include: {
      media: { orderBy: { order: "asc" }, include: { media: true } },
      documents: { orderBy: { order: "asc" }, include: { media: true } },
      units: { orderBy: { order: "asc" } },
      updates: { orderBy: { publishedAt: "desc" } },
    },
  });
  if (!p) notFound();
  const unitStatus = Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <>
      <PageHeader
        title={p.name}
        back={{ href: "/admin/developments", label: "Developments" }}
        actions={
          <>
            <PublishPill status={p.publishStatus} />
            {p.isDemo && <DemoBadge />}
            {p.publishStatus === "PUBLISHED" && (
              <Link href={`/real-estate/developments/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-[13px] text-primary underline">
                View on website <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        }
      />
      {sp.created && <Notice tone="success">Development created. You can now add unit availability and progress updates below.</Notice>}
      <div className="mb-6 flex justify-end border border-line bg-white p-4">
        <RecordCommands id={p.id} status={p.publishStatus} action={developmentCommand} label="development" />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_440px]">
        <DevelopmentForm project={p} />
        <div className="space-y-6">
          <Panel title="Unit availability" description="Unit types and current availability.">
            <ul className="mb-5 divide-y divide-line">
              {p.units.length === 0 && <li className="py-3 text-sm text-ink/50">No unit types yet.</li>}
              {p.units.map((u) => (
                <li key={u.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                      <span>
                        <span className="font-medium text-primary">{u.name}</span>
                        <span className="block text-xs text-ink/50">
                          {formatPrice(u)} · {UNIT_STATUS_LABELS[u.status]}
                          {u.availableUnits !== null && ` · ${u.availableUnits}/${u.totalUnits ?? "?"} available`}
                        </span>
                      </span>
                      <span className="text-xs text-primary underline">Edit</span>
                    </summary>
                    <UnitForm projectId={p.id} unit={u} unitStatus={unitStatus} />
                  </details>
                </li>
              ))}
            </ul>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-primary">+ Add unit type</summary>
              <UnitForm projectId={p.id} unitStatus={unitStatus} />
            </details>
          </Panel>

          <Panel title="Construction progress updates">
            <ActionForm action={saveProjectUpdate} className="space-y-3" resetOnSuccess>
              <input type="hidden" name="projectId" value={p.id} />
              <TextInput label="Title" name="title" />
              <TextArea label="Update" name="body" rows={4} help="Markdown supported." />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Date" name="publishedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                <div className="flex items-end pb-2">
                  <Checkbox label="Publish" name="published" defaultChecked />
                </div>
              </div>
              <MediaInput name="image" label="Photo (optional)" accept="image" folder="progress" max={1} />
              <SubmitButton>Post update</SubmitButton>
            </ActionForm>
            <ul className="mt-6 divide-y divide-line border-t border-line">
              {p.updates.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                  <span className="text-sm">
                    <span className="font-medium text-primary">{u.title}</span>
                    <span className="block text-xs text-ink/50">
                      {formatDate(u.publishedAt)} · {u.published ? "Published" : "Hidden"}
                    </span>
                  </span>
                  <ActionForm action={saveProjectUpdate}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <input type="hidden" name="updateId" value={u.id} />
                    <ConfirmSubmit name="op" value="delete" message="Delete this progress update?">
                      Delete
                    </ConfirmSubmit>
                  </ActionForm>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function UnitForm({
  projectId,
  unit,
  unitStatus,
}: {
  projectId: string;
  unit?: { id: string; name: string; bedrooms: number | null; floorAreaSqm: number | null; price: { toString(): string } | null; currency: string; priceOnRequest: boolean; totalUnits: number | null; availableUnits: number | null; status: string; order: number };
  unitStatus: { value: string; label: string }[];
}) {
  return (
    <ActionForm action={saveUnit} className="mt-3 grid grid-cols-2 gap-3 bg-[#f8faf9] p-3" resetOnSuccess={!unit}>
      <input type="hidden" name="projectId" value={projectId} />
      {unit && <input type="hidden" name="unitId" value={unit.id} />}
      <TextInput label="Unit type" name="name" defaultValue={unit?.name} className="col-span-2" />
      <TextInput label="Bedrooms" name="bedrooms" type="number" defaultValue={unit?.bedrooms ?? ""} />
      <TextInput label="Size (m²)" name="floorAreaSqm" defaultValue={unit?.floorAreaSqm ?? ""} />
      <TextInput label="Price" name="price" defaultValue={unit?.price?.toString() ?? ""} />
      <SelectInput label="Currency" name="currency" defaultValue={unit?.currency ?? "NGN"} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
      <TextInput label="Total units" name="totalUnits" type="number" defaultValue={unit?.totalUnits ?? ""} />
      <TextInput label="Available units" name="availableUnits" type="number" defaultValue={unit?.availableUnits ?? ""} />
      <SelectInput label="Status" name="status" defaultValue={unit?.status ?? "AVAILABLE"} options={unitStatus} />
      <TextInput label="Display order" name="order" type="number" defaultValue={unit?.order ?? 0} />
      <div className="col-span-2">
        <Checkbox label="Price on request" name="priceOnRequest" defaultChecked={unit?.priceOnRequest} />
      </div>
      <div className="col-span-2 flex gap-2">
        <SubmitButton>{unit ? "Save unit" : "Add unit"}</SubmitButton>
        {unit && (
          <ConfirmSubmit name="op" value="delete" message="Remove this unit type?">
            Remove
          </ConfirmSubmit>
        )}
      </div>
    </ActionForm>
  );
}

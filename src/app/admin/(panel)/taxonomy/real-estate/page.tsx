import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SECTOR_LABELS } from "@/lib/labels";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SelectInput, SubmitButton, TextInput } from "@/components/admin/form";
import { saveLocation, savePropertyType } from "@/app/admin/actions/taxonomy";

export const metadata = { title: "Locations & property types" };
const sectors = Object.entries(SECTOR_LABELS).map(([value, label]) => ({ value, label }));

export default async function RealEstateTaxonomy() {
  await requireUser("taxonomy.real_estate");
  const [locations, types] = await Promise.all([
    db.location.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { properties: true, projects: true } } } }),
    db.propertyType.findMany({ orderBy: [{ sector: "asc" }, { order: "asc" }], include: { _count: { select: { properties: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Locations & property types" description="Taxonomies used by property listings, developments and search filters." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Locations">
          <ActionForm action={saveLocation} className="mb-6 grid gap-3 sm:grid-cols-4" resetOnSuccess>
            <TextInput label="Area / name" name="name" placeholder="e.g. Ikoyi" className="sm:col-span-2" />
            <TextInput label="City" name="city" placeholder="e.g. Lagos" />
            <TextInput label="State" name="state" placeholder="e.g. Lagos" />
            <div className="sm:col-span-4">
              <SubmitButton>Add location</SubmitButton>
            </div>
          </ActionForm>
          <ul className="divide-y divide-line border-t border-line">
            {locations.length === 0 && <li className="py-4 text-sm text-ink/50">No locations yet.</li>}
            {locations.map((l) => (
              <li key={l.id} className="py-2">
                <ActionForm action={saveLocation} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <input name="name" defaultValue={l.name} className="h-9 min-w-32 flex-1 border border-line px-2 text-sm" aria-label="Name" />
                  <input name="city" defaultValue={l.city ?? ""} placeholder="City" className="h-9 w-28 border border-line px-2 text-sm" aria-label="City" />
                  <input name="state" defaultValue={l.state ?? ""} placeholder="State" className="h-9 w-28 border border-line px-2 text-sm" aria-label="State" />
                  <span className="w-20 text-xs text-ink/45">{l._count.properties + l._count.projects} in use</span>
                  <SubmitButton variant="secondary">Save</SubmitButton>
                  <ConfirmSubmit name="op" value="delete" message="Delete this location?">
                    ×
                  </ConfirmSubmit>
                </ActionForm>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Property types">
          <ActionForm action={savePropertyType} className="mb-6 grid gap-3 sm:grid-cols-3" resetOnSuccess>
            <TextInput label="Type name" name="name" placeholder="e.g. Maisonette" />
            <SelectInput label="Category" name="sector" options={sectors} />
            <TextInput label="Order" name="order" type="number" defaultValue={0} />
            <div className="sm:col-span-3">
              <SubmitButton>Add type</SubmitButton>
            </div>
          </ActionForm>
          <ul className="divide-y divide-line border-t border-line">
            {types.map((t) => (
              <li key={t.id} className="py-2">
                <ActionForm action={savePropertyType} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <input name="name" defaultValue={t.name} className="h-9 min-w-32 flex-1 border border-line px-2 text-sm" aria-label="Name" />
                  <select name="sector" defaultValue={t.sector} className="h-9 border border-line px-2 text-sm" aria-label="Category">
                    {sectors.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <input name="order" type="number" defaultValue={t.order} className="h-9 w-16 border border-line px-2 text-sm" aria-label="Order" />
                  <span className="w-16 text-xs text-ink/45">{t._count.properties} used</span>
                  <SubmitButton variant="secondary">Save</SubmitButton>
                  <ConfirmSubmit name="op" value="delete" message="Delete this property type?">
                    ×
                  </ConfirmSubmit>
                </ActionForm>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

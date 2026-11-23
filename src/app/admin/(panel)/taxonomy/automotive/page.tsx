import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SubmitButton, TextInput } from "@/components/admin/form";
import { saveVehicleCategory } from "@/app/admin/actions/taxonomy";

export const metadata = { title: "Vehicle categories" };

export default async function AutomotiveTaxonomy() {
  await requireUser("taxonomy.automotive");
  const cats = await db.vehicleCategory.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { vehicles: true } } } });
  return (
    <>
      <PageHeader title="Vehicle categories" description="Categories used for browsing and filtering the vehicle inventory. A vehicle may belong to several categories." />
      <Panel className="max-w-3xl">
        <ActionForm action={saveVehicleCategory} className="mb-6 flex flex-wrap items-end gap-3" resetOnSuccess>
          <TextInput label="Category name" name="name" placeholder="e.g. Executive Saloons" className="flex-1" />
          <TextInput label="Order" name="order" type="number" defaultValue={cats.length} className="w-24" />
          <SubmitButton>Add category</SubmitButton>
        </ActionForm>
        <ul className="divide-y divide-line border-t border-line">
          {cats.map((c) => (
            <li key={c.id} className="py-2">
              <ActionForm action={saveVehicleCategory} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className="h-9 flex-1 border border-line px-2 text-sm" aria-label="Name" />
                <input name="order" type="number" defaultValue={c.order} className="h-9 w-16 border border-line px-2 text-sm" aria-label="Order" />
                <span className="w-24 text-xs text-ink/45">{c._count.vehicles} vehicles</span>
                <SubmitButton variant="secondary">Save</SubmitButton>
                <ConfirmSubmit name="op" value="delete" message="Delete this category? Vehicles will simply be removed from it.">
                  ×
                </ConfirmSubmit>
              </ActionForm>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

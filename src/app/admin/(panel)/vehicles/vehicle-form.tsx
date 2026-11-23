import type { MediaAsset, Vehicle, VehicleCategory, VehicleImage } from "@prisma/client";
import { db } from "@/lib/db";
import { CURRENCIES } from "@/lib/format";
import { AVAILABILITY_LABELS, BODY_LABELS, CONDITION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { specsToText } from "@/lib/admin-form";
import { ActionForm, Checkbox, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveVehicle } from "@/app/admin/actions/vehicles";

const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
type Full = Vehicle & { images: (VehicleImage & { media: MediaAsset })[]; categories: VehicleCategory[] };

export async function VehicleForm({ vehicle }: { vehicle?: Full }) {
  const categories = await db.vehicleCategory.findMany({ orderBy: { order: "asc" } });
  const v = vehicle;
  const selected = new Set(v?.categories.map((c) => c.id));
  return (
    <ActionForm action={saveVehicle} className="space-y-6">
      {v && <input type="hidden" name="id" value={v.id} />}
      <FormSection title="Vehicle">
        <TextInput label="Make" name="make" defaultValue={v?.make} placeholder="e.g. Toyota" />
        <TextInput label="Model" name="model" defaultValue={v?.model} placeholder="e.g. Land Cruiser" />
        <TextInput label="Variant / trim" name="variant" defaultValue={v?.variant ?? ""} placeholder="e.g. VX-R" />
        <TextInput label="Year" name="year" type="number" defaultValue={v?.year ?? ""} />
        <SelectInput label="Condition" name="condition" defaultValue={v?.condition ?? "NEW"} options={o(CONDITION_LABELS)} />
        <SelectInput label="Body type" name="bodyType" defaultValue={v?.bodyType ?? "SUV"} options={o(BODY_LABELS)} />
        <SelectInput label="Transmission" name="transmission" defaultValue={v?.transmission ?? "AUTOMATIC"} options={o(TRANSMISSION_LABELS)} />
        <SelectInput label="Fuel type" name="fuelType" defaultValue={v?.fuelType ?? "PETROL"} options={o(FUEL_LABELS)} />
        <TextInput label="URL slug" name="slug" defaultValue={v?.slug} help="Leave blank to generate." />
        <TextInput label="VIN / chassis number (internal)" name="vin" defaultValue={v?.vin ?? ""} help="Never displayed on the website." />
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[12.5px] font-semibold text-ink/75">Categories</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {categories.map((c) => (
              <Checkbox key={c.id} label={c.name} name="categoryIds" value={c.id} defaultChecked={selected.has(c.id)} />
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Pricing & availability">
        <TextInput label="Price" name="price" inputMode="decimal" defaultValue={v?.price?.toString() ?? ""} />
        <SelectInput label="Currency" name="currency" defaultValue={v?.currency ?? "NGN"} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        <div className="flex items-end">
          <Checkbox label="Price on request" name="priceOnRequest" defaultChecked={v?.priceOnRequest} />
        </div>
        <SelectInput label="Availability" name="availability" defaultValue={v?.availability ?? "AVAILABLE"} options={o(AVAILABILITY_LABELS)} />
        <TextInput label="Vehicle location" name="location" defaultValue={v?.location ?? ""} placeholder="e.g. Lagos showroom" />
      </FormSection>

      <FormSection title="Specifications">
        <TextInput label="Mileage" name="mileage" type="number" min={0} defaultValue={v?.mileage ?? ""} />
        <SelectInput label="Mileage unit" name="mileageUnit" defaultValue={v?.mileageUnit ?? "km"} options={[{ value: "km", label: "Kilometres" }, { value: "mi", label: "Miles" }]} />
        <TextInput label="Engine" name="engine" defaultValue={v?.engine ?? ""} placeholder="e.g. 3.5L twin-turbo V6" />
        <TextInput label="Power (hp)" name="horsepower" type="number" defaultValue={v?.horsepower ?? ""} />
        <TextInput label="Drivetrain" name="drivetrain" defaultValue={v?.drivetrain ?? ""} placeholder="e.g. 4WD" />
        <TextInput label="Seats" name="seats" type="number" defaultValue={v?.seats ?? ""} />
        <TextInput label="Exterior colour" name="exteriorColour" defaultValue={v?.exteriorColour ?? ""} />
        <TextInput label="Interior colour" name="interiorColour" defaultValue={v?.interiorColour ?? ""} />
        <TextArea label="Interior specifications" name="interiorDetails" defaultValue={v?.interiorDetails ?? ""} rows={3} className="sm:col-span-2" />
        <TextArea label="Features" name="features" defaultValue={v?.features.join("\n")} rows={6} help="One per line." />
        <TextArea label="Additional specifications" name="specifications" defaultValue={specsToText(v?.specifications)} rows={6} help="“Label: value” per line." />
        <TextArea label="Inspection information" name="inspectionInfo" defaultValue={v?.inspectionInfo ?? ""} rows={3} className="sm:col-span-2" help="e.g. inspection status, service history, documentation available." />
      </FormSection>

      <FormSection title="Presentation">
        <TextArea label="Summary" name="summary" defaultValue={v?.summary ?? ""} rows={2} className="sm:col-span-2" />
        <TextArea label="Description" name="description" defaultValue={v?.description ?? ""} rows={6} className="sm:col-span-2" help="Markdown supported." />
        <MediaInput name="images" label="Gallery" accept="image" folder="vehicles" initial={v?.images.map((i) => ({ mediaId: i.mediaId, url: mediaUrl(i.media), name: i.media.originalName, mimeType: i.media.mimeType, alt: i.alt ?? "" }))} help="First image is the cover." />
      </FormSection>

      <FormSection title="Publishing & SEO">
        <SelectInput label="Publication status" name="publishStatus" defaultValue={v?.publishStatus ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft — not visible" }, { value: "PUBLISHED", label: "Published" }, { value: "ARCHIVED", label: "Archived" }]} />
        <div className="flex items-end">
          <Checkbox label="Featured vehicle" name="featured" defaultChecked={v?.featured} />
        </div>
        <TextInput label="SEO title" name="metaTitle" defaultValue={v?.metaTitle ?? ""} />
        <TextInput label="SEO description" name="metaDescription" defaultValue={v?.metaDescription ?? ""} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>{v ? "Save changes" : "Add vehicle"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

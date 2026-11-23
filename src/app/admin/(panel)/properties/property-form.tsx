import type { Property, PropertyDocument, PropertyImage, MediaAsset } from "@prisma/client";
import { db } from "@/lib/db";
import { CURRENCIES, formatDate } from "@/lib/format";
import { LISTING_LABELS, PROPERTY_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { specsToText } from "@/lib/admin-form";
import { ActionForm, Checkbox, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveProperty } from "@/app/admin/actions/properties";

const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));

type Full = Property & { images: (PropertyImage & { media: MediaAsset })[]; documents: (PropertyDocument & { media: MediaAsset })[] };

export async function PropertyForm({ property }: { property?: Full }) {
  const [types, locations, projects] = await Promise.all([
    db.propertyType.findMany({ orderBy: [{ sector: "asc" }, { order: "asc" }] }),
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.developmentProject.findMany({ where: { publishStatus: { not: "ARCHIVED" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const p = property;
  return (
    <ActionForm action={saveProperty} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}
      <FormSection title="Listing" description="Core information shown on the property card and detail page.">
        <TextInput label="Title" name="title" defaultValue={p?.title} required className="sm:col-span-2" />
        <TextInput label="URL slug" name="slug" defaultValue={p?.slug} help="Leave blank to generate from the title." />
        <SelectInput label="Property category" name="sector" defaultValue={p?.sector ?? "RESIDENTIAL"} options={o(SECTOR_LABELS)} />
        <SelectInput label="Property type" name="propertyTypeId" defaultValue={p?.propertyTypeId ?? ""} placeholder="—" options={types.map((t) => ({ value: t.id, label: `${t.name} (${SECTOR_LABELS[t.sector]})` }))} />
        <SelectInput label="Sale or lease" name="listingType" defaultValue={p?.listingType ?? "SALE"} options={o(LISTING_LABELS)} />
        <TextArea label="Summary" name="summary" defaultValue={p?.summary} rows={2} className="sm:col-span-2" help="One or two sentences shown in listings (max 400 characters)." />
        <TextArea label="Description" name="description" defaultValue={p?.description} rows={8} className="sm:col-span-2" help="Markdown supported: **bold**, lists with “- ”, headings with “## ”." />
      </FormSection>

      <FormSection title="Pricing & availability">
        <TextInput label="Price" name="price" inputMode="decimal" defaultValue={p?.price?.toString() ?? ""} />
        <SelectInput label="Currency" name="currency" defaultValue={p?.currency ?? "NGN"} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        <SelectInput
          label="Price basis"
          name="pricePeriod"
          defaultValue={p?.pricePeriod ?? "TOTAL"}
          options={[
            { value: "TOTAL", label: "Total / outright" },
            { value: "PER_ANNUM", label: "Per annum" },
            { value: "PER_MONTH", label: "Per month" },
            { value: "PER_SQM", label: "Per m²" },
          ]}
        />
        <div className="flex items-end">
          <Checkbox label="Price on request" name="priceOnRequest" defaultChecked={p?.priceOnRequest} />
        </div>
        <SelectInput label="Availability status" name="status" defaultValue={p?.status ?? "AVAILABLE"} options={o(PROPERTY_STATUS_LABELS)} />
        <div className="space-y-2">
          <TextInput label="Availability verified on" name="availabilityVerifiedAt" type="date" defaultValue={p?.availabilityVerifiedAt?.toISOString().slice(0, 10) ?? ""} />
          <Checkbox label="Mark as verified today" name="verifyNow" help={p?.availabilityVerifiedAt ? `Last verified ${formatDate(p.availabilityVerifiedAt)}` : "Shows a “verified” indicator on the listing."} />
        </div>
      </FormSection>

      <FormSection title="Location">
        <SelectInput label="Location" name="locationId" defaultValue={p?.locationId ?? ""} placeholder="—" options={locations.map((l) => ({ value: l.id, label: [l.name, l.state].filter(Boolean).join(", ") }))} help="Manage locations under Locations & Types." />
        <SelectInput label="Part of development" name="developmentId" defaultValue={p?.developmentId ?? ""} placeholder="—" options={projects.map((x) => ({ value: x.id, label: x.name }))} />
        <TextInput label="Address" name="address" defaultValue={p?.address ?? ""} className="sm:col-span-2" />
        <TextInput label="Latitude" name="latitude" inputMode="decimal" defaultValue={p?.latitude ?? ""} help="Optional — enables the location map." />
        <TextInput label="Longitude" name="longitude" inputMode="decimal" defaultValue={p?.longitude ?? ""} />
      </FormSection>

      <FormSection title="Specifications">
        <TextInput label="Bedrooms" name="bedrooms" type="number" min={0} defaultValue={p?.bedrooms ?? ""} />
        <TextInput label="Bathrooms" name="bathrooms" type="number" min={0} defaultValue={p?.bathrooms ?? ""} />
        <TextInput label="Parking spaces" name="parkingSpaces" type="number" min={0} defaultValue={p?.parkingSpaces ?? ""} />
        <TextInput label="Year built" name="yearBuilt" type="number" defaultValue={p?.yearBuilt ?? ""} />
        <TextInput label="Floor area (m²)" name="floorAreaSqm" inputMode="decimal" defaultValue={p?.floorAreaSqm ?? ""} />
        <TextInput label="Land area (m²)" name="landAreaSqm" inputMode="decimal" defaultValue={p?.landAreaSqm ?? ""} />
        <TextInput label="Title document" name="titleDocument" defaultValue={p?.titleDocument ?? ""} help="e.g. Certificate of Occupancy, Governor's Consent" className="sm:col-span-2" />
        <TextArea label="Property features" name="features" defaultValue={p?.features.join("\n")} rows={5} help="One per line." />
        <TextArea label="Amenities" name="amenities" defaultValue={p?.amenities.join("\n")} rows={5} help="One per line." />
        <TextArea label="Additional specifications" name="specifications" defaultValue={specsToText(p?.specifications)} rows={4} className="sm:col-span-2" help="One per line as “Label: value”, e.g. “Service charge: Included”." />
      </FormSection>

      <FormSection title="Photography, floor plans & documents">
        <MediaInput
          name="images"
          label="Images"
          accept="image"
          folder="properties"
          kindOptions={[
            { value: "PHOTO", label: "Photo" },
            { value: "FLOOR_PLAN", label: "Floor plan" },
          ]}
          initial={p?.images.map((i) => ({ mediaId: i.mediaId, url: mediaUrl(i.media), name: i.media.originalName, mimeType: i.media.mimeType, alt: i.alt ?? "", kind: i.kind }))}
          help="The first photo is used as the cover image. Add meaningful alt text for accessibility."
        />
        <MediaInput
          name="documents"
          label="Brochures & documents"
          accept="document"
          folder="property-documents"
          flagLabel="Public download"
          initial={p?.documents.map((d) => ({ mediaId: d.mediaId, url: null, name: d.media.originalName, mimeType: d.media.mimeType, title: d.title, flag: d.isPublic }))}
          help="Untick “Public download” to keep a document internal."
        />
      </FormSection>

      <FormSection title="Publishing & SEO">
        <SelectInput
          label="Publication status"
          name="publishStatus"
          defaultValue={p?.publishStatus ?? "DRAFT"}
          options={[
            { value: "DRAFT", label: "Draft — not visible" },
            { value: "PUBLISHED", label: "Published" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
        <div className="flex items-end">
          <Checkbox label="Featured property" name="featured" defaultChecked={p?.featured} help="Prioritised on landing pages." />
        </div>
        <TextInput label="SEO title" name="metaTitle" defaultValue={p?.metaTitle ?? ""} />
        <TextInput label="SEO description" name="metaDescription" defaultValue={p?.metaDescription ?? ""} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>{p ? "Save changes" : "Create property"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

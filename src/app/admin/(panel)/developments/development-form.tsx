import type { DevelopmentProject, MediaAsset, ProjectDocument, ProjectMedia } from "@prisma/client";
import { db } from "@/lib/db";
import { PROJECT_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { ActionForm, Checkbox, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveDevelopment } from "@/app/admin/actions/developments";

const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
const d = (x: Date | null | undefined) => x?.toISOString().slice(0, 10) ?? "";

type Full = DevelopmentProject & { media: (ProjectMedia & { media: MediaAsset })[]; documents: (ProjectDocument & { media: MediaAsset })[] };

export async function DevelopmentForm({ project }: { project?: Full }) {
  const locations = await db.location.findMany({ orderBy: { name: "asc" } });
  const p = project;
  const toItem = (m: ProjectMedia & { media: MediaAsset }) => ({ mediaId: m.mediaId, url: mediaUrl(m.media), name: m.media.originalName, mimeType: m.media.mimeType, alt: m.caption ?? "" });
  return (
    <ActionForm action={saveDevelopment} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}
      <FormSection title="Project">
        <TextInput label="Project name" name="name" defaultValue={p?.name} className="sm:col-span-2" />
        <TextInput label="URL slug" name="slug" defaultValue={p?.slug} help="Leave blank to generate from the name." />
        <SelectInput label="Sector" name="sector" defaultValue={p?.sector ?? "RESIDENTIAL"} options={o(SECTOR_LABELS)} />
        <TextInput label="Project type" name="projectType" defaultValue={p?.projectType ?? ""} help="e.g. Gated residential estate, Grade A office tower" />
        <SelectInput label="Development status" name="status" defaultValue={p?.status ?? "UPCOMING"} options={o(PROJECT_STATUS_LABELS)} />
        <TextArea label="Summary" name="summary" defaultValue={p?.summary} rows={2} className="sm:col-span-2" />
        <TextArea label="Project overview" name="overview" defaultValue={p?.overview} rows={8} className="sm:col-span-2" help="Markdown supported." />
        <TextArea label="Developer information" name="developerInfo" defaultValue={p?.developerInfo ?? ""} rows={3} className="sm:col-span-2" help="Where applicable — e.g. joint development partners." />
      </FormSection>

      <FormSection title="Stage & progress" description="Only publish progress information that has been verified.">
        <TextInput label="Current stage" name="currentStage" defaultValue={p?.currentStage ?? ""} help="e.g. Superstructure — Phase 1" />
        <TextInput label="Construction progress (%)" name="progressPercent" type="number" min={0} max={100} defaultValue={p?.progressPercent ?? ""} />
        <TextInput label="Start date" name="startDate" type="date" defaultValue={d(p?.startDate)} />
        <TextInput label="Completion date (expected or actual)" name="completionDate" type="date" defaultValue={d(p?.completionDate)} />
        <TextInput label="Site area (m²)" name="siteAreaSqm" inputMode="decimal" defaultValue={p?.siteAreaSqm ?? ""} />
        <TextInput label="Total units" name="totalUnits" type="number" defaultValue={p?.totalUnits ?? ""} />
      </FormSection>

      <FormSection title="Location">
        <SelectInput label="Location" name="locationId" defaultValue={p?.locationId ?? ""} placeholder="—" options={locations.map((l) => ({ value: l.id, label: [l.name, l.state].filter(Boolean).join(", ") }))} />
        <TextInput label="Address" name="address" defaultValue={p?.address ?? ""} />
        <TextInput label="Latitude" name="latitude" inputMode="decimal" defaultValue={p?.latitude ?? ""} />
        <TextInput label="Longitude" name="longitude" inputMode="decimal" defaultValue={p?.longitude ?? ""} />
      </FormSection>

      <FormSection title="Gallery, masterplans & documentation">
        <MediaInput name="gallery" label="Project gallery" accept="image" folder="developments" initial={p?.media.filter((m) => m.kind === "GALLERY").map(toItem)} help="The first image is the cover. Alt text is used as the caption." />
        <MediaInput name="masterplans" label="Masterplans" accept="image" folder="masterplans" initial={p?.media.filter((m) => m.kind === "MASTERPLAN").map(toItem)} />
        <MediaInput
          name="documents"
          label="Supporting documents"
          accept="document"
          folder="development-documents"
          flagLabel="Public download"
          initial={p?.documents.map((x) => ({ mediaId: x.mediaId, url: null, name: x.media.originalName, mimeType: x.media.mimeType, title: x.title, flag: x.isPublic }))}
        />
      </FormSection>

      <FormSection title="Publishing & SEO">
        <SelectInput label="Publication status" name="publishStatus" defaultValue={p?.publishStatus ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft — not visible" }, { value: "PUBLISHED", label: "Published" }, { value: "ARCHIVED", label: "Archived" }]} />
        <div className="flex items-end">
          <Checkbox label="Featured on homepage" name="featured" defaultChecked={p?.featured} />
        </div>
        <TextInput label="SEO title" name="metaTitle" defaultValue={p?.metaTitle ?? ""} />
        <TextInput label="SEO description" name="metaDescription" defaultValue={p?.metaDescription ?? ""} />
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>{p ? "Save changes" : "Create development"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

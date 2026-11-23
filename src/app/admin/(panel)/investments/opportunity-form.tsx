import type { InvestmentDocument, InvestmentOpportunity, MediaAsset } from "@prisma/client";
import { db } from "@/lib/db";
import { CURRENCIES } from "@/lib/format";
import { OPPORTUNITY_SECTOR_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { ActionForm, Checkbox, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveOpportunity } from "@/app/admin/actions/investments";

const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));
type Full = InvestmentOpportunity & { cover: MediaAsset | null; documents: (InvestmentDocument & { media: MediaAsset })[] };

export async function OpportunityForm({ opportunity }: { opportunity?: Full }) {
  const [locations, projects] = await Promise.all([
    db.location.findMany({ orderBy: { name: "asc" } }),
    db.developmentProject.findMany({ where: { publishStatus: { not: "ARCHIVED" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const x = opportunity;
  return (
    <ActionForm action={saveOpportunity} className="space-y-6">
      {x && <input type="hidden" name="id" value={x.id} />}
      <FormSection title="Opportunity">
        <TextInput label="Title" name="title" defaultValue={x?.title} className="sm:col-span-2" />
        <TextInput label="URL slug" name="slug" defaultValue={x?.slug} />
        <SelectInput label="Sector" name="sector" defaultValue={x?.sector ?? "REAL_ESTATE"} options={o(OPPORTUNITY_SECTOR_LABELS)} />
        <SelectInput label="Opportunity status" name="status" defaultValue={x?.status ?? "COMING_SOON"} options={o(OPPORTUNITY_STATUS_LABELS)} />
        <TextInput label="Investment structure" name="investmentStructure" defaultValue={x?.investmentStructure ?? ""} placeholder="e.g. Joint venture, Co-development" />
        <SelectInput label="Location" name="locationId" defaultValue={x?.locationId ?? ""} placeholder="—" options={locations.map((l) => ({ value: l.id, label: l.name }))} />
        <SelectInput label="Related development" name="projectId" defaultValue={x?.projectId ?? ""} placeholder="—" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        <TextArea label="Summary" name="summary" defaultValue={x?.summary} rows={2} className="sm:col-span-2" />
        <TextArea label="Project description" name="description" defaultValue={x?.description} rows={8} className="sm:col-span-2" help="Markdown supported. Do not state or imply guaranteed returns." />
        <MediaInput name="cover" label="Cover image" accept="image" folder="investments" max={1} initial={x?.cover ? [{ mediaId: x.cover.id, url: mediaUrl(x.cover), name: x.cover.originalName, mimeType: x.cover.mimeType, alt: x.cover.alt ?? "" }] : []} />
      </FormSection>

      <FormSection title="Commercial terms" description="Terms are shown publicly only after approval by a user with the “Approve investment terms” permission. Editing terms revokes approval.">
        <TextInput label="Minimum participation" name="minimumParticipation" inputMode="decimal" defaultValue={x?.minimumParticipation?.toString() ?? ""} />
        <SelectInput label="Currency" name="currency" defaultValue={x?.currency ?? "NGN"} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        <TextArea label="Terms summary" name="termsSummary" defaultValue={x?.termsSummary ?? ""} rows={5} className="sm:col-span-2" />
        <TextArea label="Opportunity-specific disclaimer" name="disclaimer" defaultValue={x?.disclaimer ?? ""} rows={3} className="sm:col-span-2" help="Leave blank to use the standard investment disclaimer." />
      </FormSection>

      <FormSection title="Supporting documents">
        <MediaInput
          name="documents"
          label="Documents"
          accept="document"
          folder="investment-documents"
          visibility="PRIVATE"
          flagLabel="Public download"
          initial={x?.documents.map((d) => ({ mediaId: d.mediaId, url: null, name: d.media.originalName, mimeType: d.media.mimeType, title: d.title, flag: d.access === "PUBLIC" }))}
          help="Documents are stored privately by default and listed publicly as “available on request”. Tick “Public download” only for documents approved for unrestricted release."
        />
      </FormSection>

      <FormSection title="Publishing">
        <SelectInput label="Publication status" name="publishStatus" defaultValue={x?.publishStatus ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft — not visible" }, { value: "PUBLISHED", label: "Published" }, { value: "ARCHIVED", label: "Archived" }]} />
        <div className="flex items-end">
          <Checkbox label="Featured" name="featured" defaultChecked={x?.featured} />
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>{x ? "Save changes" : "Create opportunity"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

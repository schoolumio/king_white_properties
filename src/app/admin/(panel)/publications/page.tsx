import type { MediaAsset, Publication } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBytes, formatDate } from "@/lib/format";
import { PUBLICATION_LABELS } from "@/lib/labels";
import { PageHeader, Panel, PublishPill } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { savePublication } from "@/app/admin/actions/editorial";

export const metadata = { title: "Publications" };
const cats = Object.entries(PUBLICATION_LABELS).map(([value, label]) => ({ value, label }));
const statuses = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function PublicationForm({ p }: { p?: Publication & { file: MediaAsset } }) {
  return (
    <ActionForm action={savePublication} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!p}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <TextInput label="Title" name="title" defaultValue={p?.title} />
      <SelectInput label="Category" name="category" defaultValue={p?.category ?? "CORPORATE_PROFILE"} options={cats} />
      <TextArea label="Description" name="description" defaultValue={p?.description ?? ""} rows={2} className="sm:col-span-2" />
      <SelectInput label="Status" name="publishStatus" defaultValue={p?.publishStatus ?? "DRAFT"} options={statuses} />
      <TextInput label="Publication date" name="publishedAt" type="date" defaultValue={p?.publishedAt?.toISOString().slice(0, 10) ?? ""} />
      <MediaInput name="file" label="File (PDF)" accept="document" folder="publications" max={1} initial={p ? [{ mediaId: p.fileId, url: null, name: p.file.originalName, mimeType: p.file.mimeType, title: p.title }] : []} />
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton>{p ? "Save" : "Add publication"}</SubmitButton>
        {p && (
          <ConfirmSubmit name="op" value="delete" message="Delete this publication?">
            Delete
          </ConfirmSubmit>
        )}
      </div>
    </ActionForm>
  );
}

export default async function AdminPublications() {
  await requireUser("publication.manage");
  const rows = await db.publication.findMany({ orderBy: { createdAt: "desc" }, include: { file: true } });
  return (
    <>
      <PageHeader title="Corporate publications" description="Downloadable PDFs: corporate profiles, brochures, reports and policies. Policies also appear on the governance page." />
      <Panel title="Add a publication" className="mb-6 max-w-4xl">
        <PublicationForm />
      </Panel>
      <div className="max-w-4xl divide-y divide-line border border-line bg-white">
        {rows.length === 0 && <p className="p-6 text-sm text-ink/50">No publications yet.</p>}
        {rows.map((p) => (
          <details key={p.id} className="group">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
              <span className="flex-1">
                <span className="font-medium text-navy">{p.title}</span>
                <span className="block text-xs text-ink/50">
                  {PUBLICATION_LABELS[p.category]} · {formatBytes(p.file.size)} · {formatDate(p.publishedAt, "short") || "unscheduled"}
                </span>
              </span>
              <PublishPill status={p.publishStatus} />
              <span className="text-xs text-navy underline">Edit</span>
            </summary>
            <div className="border-t border-line bg-[#fafaf8] p-4">
              <PublicationForm p={p} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

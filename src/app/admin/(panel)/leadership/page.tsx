import type { LeadershipProfile, MediaAsset } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { Notice, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { ActionForm, Checkbox, ConfirmSubmit, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveLeader } from "@/app/admin/actions/editorial";

export const metadata = { title: "Leadership" };
const groups = [
  { value: "BOARD", label: "Board of Directors" },
  { value: "EXECUTIVE", label: "Executive Leadership" },
  { value: "MANAGEMENT", label: "Management Team" },
];

function LeaderForm({ l }: { l?: LeadershipProfile & { photo: MediaAsset | null } }) {
  return (
    <ActionForm action={saveLeader} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!l}>
      {l && <input type="hidden" name="id" value={l.id} />}
      <TextInput label="Full name" name="name" defaultValue={l?.name} />
      <TextInput label="Position" name="position" defaultValue={l?.position} />
      <SelectInput label="Group" name="group" defaultValue={l?.group ?? "EXECUTIVE"} options={groups} />
      <TextInput label="Display order" name="order" type="number" defaultValue={l?.order ?? 0} />
      <TextArea label="Biography" name="bio" defaultValue={l?.bio ?? ""} rows={4} className="sm:col-span-2" />
      <TextInput label="LinkedIn URL" name="linkedin" defaultValue={l?.linkedin ?? ""} className="sm:col-span-2" />
      <MediaInput name="photo" label="Portrait" accept="image" folder="leadership" max={1} initial={l?.photo ? [{ mediaId: l.photo.id, url: mediaUrl(l.photo), name: l.photo.originalName, mimeType: l.photo.mimeType, alt: l.photo.alt ?? "" }] : []} />
      <div className="sm:col-span-2">
        <Checkbox label="Published on the website" name="published" defaultChecked={l?.published} help="Only publish profiles that have been approved by the individual and the company." />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton>{l ? "Save profile" : "Add profile"}</SubmitButton>
        {l && (
          <ConfirmSubmit name="op" value="delete" message="Delete this profile?">
            Delete
          </ConfirmSubmit>
        )}
      </div>
    </ActionForm>
  );
}

export default async function AdminLeadership() {
  await requireUser("leadership.manage");
  const rows = await db.leadershipProfile.findMany({ orderBy: [{ group: "asc" }, { order: "asc" }], include: { photo: true } });
  return (
    <>
      <PageHeader title="Leadership profiles" description="Board, executive and management profiles for the governance page and homepage." />
      <Notice>Only real, approved individuals should be added. Profiles remain hidden until “Published” is ticked.</Notice>
      <Panel title="Add a profile" className="mb-6 max-w-4xl">
        <LeaderForm />
      </Panel>
      <div className="max-w-4xl divide-y divide-line border border-line bg-white">
        {rows.length === 0 && <p className="p-6 text-sm text-ink/50">No profiles yet.</p>}
        {rows.map((l) => (
          <details key={l.id}>
            <summary className="flex cursor-pointer items-center gap-3 p-4">
              <span className="flex-1">
                <span className="font-medium text-navy">{l.name}</span>
                <span className="block text-xs text-ink/50">
                  {l.position} · {groups.find((g) => g.value === l.group)?.label}
                </span>
              </span>
              <Pill className={l.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>{l.published ? "Published" : "Hidden"}</Pill>
              <span className="text-xs text-navy underline">Edit</span>
            </summary>
            <div className="border-t border-line bg-[#fafaf8] p-4">
              <LeaderForm l={l} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

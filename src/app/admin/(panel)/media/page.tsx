import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatBytes, formatDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { firstParam, toInt } from "@/lib/utils";
import { AdminPager, FilterForm, FilterSelect, PageHeader, Pill } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { mediaCommand } from "@/app/admin/actions/system";

export const metadata = { title: "Media library" };
const PAGE_SIZE = 36;

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser("media.manage");
  const sp = await searchParams;
  const v = { type: firstParam(sp.type), visibility: firstParam(sp.visibility) };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where = {
    ...(v.type === "image" ? { mimeType: { startsWith: "image/" } } : v.type === "document" ? { NOT: { mimeType: { startsWith: "image/" } } } : {}),
    ...(v.visibility ? { visibility: v.visibility as "PUBLIC" | "PRIVATE" } : {}),
    enquiryAttachments: { none: {} }, // confidential submissions are managed from the CRM only
  };
  const [total, assets] = await Promise.all([db.mediaAsset.count({ where }), db.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { uploadedBy: { select: { name: true } } } })]);
  return (
    <>
      <PageHeader title="Media library" description="All uploaded images and documents. Files in use by any record cannot be deleted." />
      <div className="mb-6 max-w-3xl border border-line bg-white p-4">
        <MediaInput name="_library" label="Upload to library" accept="any" folder="library" help="Uploaded files appear below after refreshing. Prefer uploading directly from the record that will use the file." />
      </div>
      <FilterForm action="/admin/media">
        <FilterSelect name="type" label="Type" value={v.type} options={[{ value: "image", label: "Images" }, { value: "document", label: "Documents" }]} />
        <FilterSelect name="visibility" label="Visibility" value={v.visibility} options={[{ value: "PUBLIC", label: "Public" }, { value: "PRIVATE", label: "Private" }]} />
      </FilterForm>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((a) => (
          <li key={a.id} className="border border-line bg-white">
            {a.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(a)!} alt={a.alt ?? ""} className="aspect-[4/3] w-full bg-slate-100 object-cover" loading="lazy" />
            ) : (
              <a href={`/api/files/${a.id}`} target="_blank" className="grid aspect-[4/3] place-items-center bg-slate-50">
                <FileText className="h-10 w-10 text-ink/30" />
              </a>
            )}
            <div className="space-y-2 p-3">
              <p className="truncate text-[13px] font-medium text-navy" title={a.originalName}>
                {a.originalName}
              </p>
              <p className="text-[11.5px] text-ink/50">
                {formatBytes(a.size)} · {formatDate(a.createdAt, "short")} · {a.uploadedBy?.name ?? "—"}{" "}
                <Pill className={a.visibility === "PRIVATE" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}>{a.visibility.toLowerCase()}</Pill>
              </p>
              <ActionForm action={mediaCommand} className="flex gap-1.5">
                <input type="hidden" name="id" value={a.id} />
                <input name="alt" defaultValue={a.alt ?? ""} placeholder="Description / alt text" className="h-8 min-w-0 flex-1 border border-line px-2 text-[12px]" />
                <SubmitButton name="op" value="alt" variant="secondary" className="h-8 px-2 text-[12px]">
                  Save
                </SubmitButton>
                <ConfirmSubmit name="op" value="delete" message="Delete this file permanently?">
                  ×
                </ConfirmSubmit>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
      {assets.length === 0 && <p className="py-10 text-center text-sm text-ink/50">No files yet.</p>}
      <AdminPager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/admin/media" params={v} />
    </>
  );
}

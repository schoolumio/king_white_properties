import type { Page } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader, Panel, Pill } from "@/components/admin/ui";
import { ActionForm, Checkbox, ConfirmSubmit, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { savePage } from "@/app/admin/actions/editorial";

export const metadata = { title: "Pages" };

function PageForm({ p }: { p?: Page }) {
  return (
    <ActionForm action={savePage} className="grid gap-4 sm:grid-cols-2" resetOnSuccess={!p}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <TextInput label="Title" name="title" defaultValue={p?.title} />
      <TextInput label="URL slug" name="slug" defaultValue={p?.slug} help={`Published at /legal/${p?.slug ?? "your-slug"}`} />
      <TextInput label="Meta description" name="metaDescription" defaultValue={p?.metaDescription ?? ""} className="sm:col-span-2" />
      <TextArea label="Content" name="body" defaultValue={p?.body} rows={16} className="sm:col-span-2 [&_textarea]:font-mono [&_textarea]:text-[13px]" help="Markdown supported." />
      <Checkbox label="Published (linked in the footer)" name="published" defaultChecked={p?.published ?? true} />
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton>{p ? "Save page" : "Create page"}</SubmitButton>
        {p && (
          <ConfirmSubmit name="op" value="delete" message="Delete this page?">
            Delete
          </ConfirmSubmit>
        )}
      </div>
    </ActionForm>
  );
}

export default async function AdminPages() {
  await requireUser("pages.manage");
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader title="Legal & editorial pages" description="Privacy policy, terms of service and other standalone pages." />
      <div className="max-w-5xl space-y-3">
        {pages.map((p) => (
          <details key={p.id} className="border border-line bg-white">
            <summary className="flex cursor-pointer items-center gap-3 p-4">
              <span className="flex-1">
                <span className="font-medium text-navy">{p.title}</span>
                <span className="block text-xs text-ink/50">
                  /legal/{p.slug} · updated {formatDate(p.updatedAt, "short")}
                </span>
              </span>
              <Pill className={p.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>{p.published ? "Published" : "Hidden"}</Pill>
            </summary>
            <div className="border-t border-line p-4">
              <PageForm p={p} />
            </div>
          </details>
        ))}
        <Panel title="New page">
          <PageForm />
        </Panel>
      </div>
    </>
  );
}

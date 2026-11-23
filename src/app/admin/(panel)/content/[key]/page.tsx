import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { getSectionDef } from "@/lib/content-schema";
import { PageHeader } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit } from "@/components/admin/form";
import { ContentEditor } from "@/components/admin/content-editor";
import { resetContent } from "@/app/admin/actions/content";

export const metadata = { title: "Edit content" };

export default async function EditContent({ params }: { params: Promise<{ key: string }> }) {
  const key = decodeURIComponent((await params).key);
  const def = getSectionDef(key);
  if (!def) notFound();
  await requireUser(def.group === "System" ? "settings.manage" : "content.manage");
  const value = await getContent<Record<string, unknown>>(key);
  return (
    <>
      <PageHeader
        title={def.title}
        description={def.description}
        back={def.group === "System" ? { href: "/admin/settings", label: "Settings" } : { href: "/admin/content", label: "Website content" }}
        actions={
          <ActionForm action={resetContent}>
            <input type="hidden" name="key" value={key} />
            <ConfirmSubmit variant="secondary" message="Discard all edits to this section and restore the default content?">
              Restore defaults
            </ConfirmSubmit>
          </ActionForm>
        }
      />
      <div className="max-w-4xl">
        <ContentEditor sectionKey={key} fields={def.fields} initial={value} />
      </div>
    </>
  );
}

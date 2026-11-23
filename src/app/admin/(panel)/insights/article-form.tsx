import type { Article, MediaAsset } from "@prisma/client";
import { ARTICLE_TYPE_LABELS } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { ActionForm, Checkbox, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { saveArticle } from "@/app/admin/actions/editorial";

export function ArticleForm({ article }: { article?: Article & { cover: MediaAsset | null } }) {
  const a = article;
  return (
    <ActionForm action={saveArticle} className="space-y-6">
      {a && <input type="hidden" name="id" value={a.id} />}
      <FormSection title="Article">
        <TextInput label="Title" name="title" defaultValue={a?.title} className="sm:col-span-2" />
        <SelectInput label="Type" name="type" defaultValue={a?.type ?? "COMPANY_NEWS"} options={Object.entries(ARTICLE_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
        <TextInput label="Author (optional)" name="authorName" defaultValue={a?.authorName ?? ""} />
        <TextArea label="Excerpt" name="excerpt" defaultValue={a?.excerpt} rows={2} className="sm:col-span-2" />
        <TextArea label="Body" name="body" defaultValue={a?.body} rows={18} className="sm:col-span-2 [&_textarea]:font-mono [&_textarea]:text-[13px]" help="Markdown supported: ## headings, **bold**, - lists, > quotes, [links](https://…)." />
        <MediaInput name="cover" label="Cover image" accept="image" folder="insights" max={1} initial={a?.cover ? [{ mediaId: a.cover.id, url: mediaUrl(a.cover), name: a.cover.originalName, mimeType: a.cover.mimeType, alt: a.cover.alt ?? "" }] : []} />
      </FormSection>
      <FormSection title="Publishing & SEO">
        <SelectInput label="Status" name="publishStatus" defaultValue={a?.publishStatus ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft" }, { value: "PUBLISHED", label: "Published" }, { value: "ARCHIVED", label: "Archived" }]} />
        <TextInput label="Publish date" name="publishedAt" type="date" defaultValue={a?.publishedAt?.toISOString().slice(0, 10) ?? ""} help="A future date schedules publication." />
        <TextInput label="URL slug" name="slug" defaultValue={a?.slug} />
        <div className="flex items-end">
          <Checkbox label="Featured" name="featured" defaultChecked={a?.featured} />
        </div>
        <TextInput label="SEO title" name="metaTitle" defaultValue={a?.metaTitle ?? ""} />
        <TextInput label="SEO description" name="metaDescription" defaultValue={a?.metaDescription ?? ""} />
      </FormSection>
      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0">
        <SubmitButton>{a ? "Save article" : "Create article"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeader, PublishPill } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit } from "@/components/admin/form";
import { saveArticle } from "@/app/admin/actions/editorial";
import { ArticleForm } from "../article-form";

export const metadata = { title: "Edit article" };

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireUser("insights.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const a = await db.article.findUnique({ where: { id }, include: { cover: true } });
  if (!a) notFound();
  return (
    <>
      <PageHeader
        title={a.title}
        back={{ href: "/admin/insights", label: "Insights" }}
        actions={
          <>
            <PublishPill status={a.publishStatus} />
            {a.publishStatus === "PUBLISHED" && (
              <Link href={`/insights/${a.slug}`} target="_blank" className="text-[13px] text-primary underline">
                View
              </Link>
            )}
            <ActionForm action={saveArticle}>
              <input type="hidden" name="id" value={a.id} />
              <ConfirmSubmit name="op" value="delete" message="Delete this article permanently?">
                Delete
              </ConfirmSubmit>
            </ActionForm>
          </>
        }
      />
      {sp.created && <Notice tone="success">Article created.</Notice>}
      <ArticleForm article={a} />
    </>
  );
}

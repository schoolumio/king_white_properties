import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ArticleForm } from "../article-form";

export const metadata = { title: "New article" };

export default async function NewArticle() {
  await requireUser("insights.manage");
  return (
    <>
      <PageHeader title="New article" back={{ href: "/admin/insights", label: "Insights" }} />
      <ArticleForm />
    </>
  );
}

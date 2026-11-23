import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { DevelopmentForm } from "../development-form";

export const metadata = { title: "New development" };

export default async function NewDevelopment() {
  await requireUser("development.manage");
  return (
    <>
      <PageHeader title="New development" back={{ href: "/admin/developments", label: "Developments" }} description="Unit availability and progress updates can be added after the project is created." />
      <DevelopmentForm />
    </>
  );
}

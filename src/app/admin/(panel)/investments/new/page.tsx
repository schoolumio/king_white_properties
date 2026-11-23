import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { OpportunityForm } from "../opportunity-form";

export const metadata = { title: "New opportunity" };

export default async function NewOpportunity() {
  await requireUser("investment.manage");
  return (
    <>
      <PageHeader title="New investment opportunity" back={{ href: "/admin/investments", label: "Investments" }} />
      <OpportunityForm />
    </>
  );
}

import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { PropertyForm } from "../property-form";

export const metadata = { title: "New property" };

export default async function NewProperty() {
  await requireUser("property.manage");
  return (
    <>
      <PageHeader title="New property" back={{ href: "/admin/properties", label: "Properties" }} description="Listings are saved as drafts until published." />
      <PropertyForm />
    </>
  );
}

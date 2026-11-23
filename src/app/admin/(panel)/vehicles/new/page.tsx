import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { VehicleForm } from "../vehicle-form";

export const metadata = { title: "Add vehicle" };

export default async function NewVehicle() {
  await requireUser("vehicle.manage");
  return (
    <>
      <PageHeader title="Add vehicle" back={{ href: "/admin/vehicles", label: "Vehicles" }} />
      <VehicleForm />
    </>
  );
}

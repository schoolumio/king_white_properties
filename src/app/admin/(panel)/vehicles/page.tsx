import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import { firstParam, toInt } from "@/lib/utils";
import { AdminButtonLink, AdminPager, EmptyRow, FilterForm, FilterInput, FilterSelect, PageHeader, PublishPill, Table, Td, Th } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/section";

export const metadata = { title: "Vehicles" };
const PAGE_SIZE = 25;
const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));

export default async function AdminVehicles({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser("vehicle.manage");
  const sp = await searchParams;
  const v = { q: firstParam(sp.q), availability: firstParam(sp.availability), publish: firstParam(sp.publish), condition: firstParam(sp.condition) };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where: Prisma.VehicleWhereInput = { publishStatus: v.publish ? (v.publish as never) : { not: "ARCHIVED" } };
  if (v.q) where.OR = [{ make: { contains: v.q, mode: "insensitive" } }, { model: { contains: v.q, mode: "insensitive" } }, { vin: { contains: v.q, mode: "insensitive" } }];
  if (v.availability) where.availability = v.availability as never;
  if (v.condition) where.condition = v.condition as never;
  const [total, rows] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { _count: { select: { images: true, enquiries: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Vehicle inventory" description="New and pre-owned inventory, availability and pricing." actions={<AdminButtonLink href="/admin/vehicles/new"><Plus className="h-4 w-4" /> Add vehicle</AdminButtonLink>} />
      <FilterForm action="/admin/vehicles">
        <FilterInput name="q" label="Search" value={v.q} placeholder="Make, model or VIN" />
        <FilterSelect name="availability" label="Availability" value={v.availability} options={o(AVAILABILITY_LABELS)} />
        <FilterSelect name="condition" label="Condition" value={v.condition} options={o(CONDITION_LABELS)} />
        <FilterSelect name="publish" label="Publication" value={v.publish} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} />
      </FilterForm>
      <Table>
        <thead>
          <tr>
            <Th>Vehicle</Th>
            <Th>Condition</Th>
            <Th>Mileage</Th>
            <Th>Price</Th>
            <Th>Availability</Th>
            <Th>Publication</Th>
            <Th>Photos</Th>
            <Th>Enquiries</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={9}>No vehicles yet. <Link className="text-navy underline" href="/admin/vehicles/new">Add the first vehicle</Link>.</EmptyRow>}
          {rows.map((x) => (
            <tr key={x.id} className="hover:bg-[#fafaf8]">
              <Td>
                <Link href={`/admin/vehicles/${x.id}`} className="font-medium text-navy hover:underline">
                  {x.year} {x.make} {x.model}
                </Link>
                <span className="block text-xs text-ink/50">
                  {x.variant}
                  {x.featured && " · Featured"}
                </span>
                {x.isDemo && <DemoBadge />}
              </Td>
              <Td>{CONDITION_LABELS[x.condition]}</Td>
              <Td>{x.mileage !== null ? `${formatNumber(x.mileage)} ${x.mileageUnit}` : "—"}</Td>
              <Td className="whitespace-nowrap">{formatPrice(x, { compact: true })}</Td>
              <Td>{AVAILABILITY_LABELS[x.availability]}</Td>
              <Td>
                <PublishPill status={x.publishStatus} />
              </Td>
              <Td className={x._count.images === 0 ? "text-amber-700" : ""}>{x._count.images}</Td>
              <Td>{x._count.enquiries}</Td>
              <Td className="text-ink/55">{formatDate(x.updatedAt, "short")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <AdminPager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/admin/vehicles" params={v} />
    </>
  );
}

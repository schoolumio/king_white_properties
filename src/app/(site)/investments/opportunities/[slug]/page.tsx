import { OpportunityDetail, opportunityMetadata } from "@/components/catalog/opportunity";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return opportunityMetadata((await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <OpportunityDetail slug={(await params).slug} crumbs={[{ label: "Investments", href: "/investments" }]} />;
}

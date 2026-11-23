import { OpportunityDetail, opportunityMetadata } from "@/components/catalog/opportunity";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return opportunityMetadata((await params).slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <OpportunityDetail
      slug={(await params).slug}
      crumbs={[
        { label: "Real Estate", href: "/real-estate" },
        { label: "Investment Opportunities", href: "/real-estate/investment-opportunities" },
      ]}
    />
  );
}

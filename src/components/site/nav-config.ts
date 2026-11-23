export type NavItem = { label: string; href: string; description?: string; children?: NavItem[] };

export const MAIN_NAV: NavItem[] = [
  {
    label: "About Us",
    href: "/about",
    children: [
      { label: "Company Profile", href: "/about", description: "Who we are, our vision and values" },
      { label: "Leadership & Governance", href: "/about/governance", description: "Leadership, structure and policies" },
    ],
  },
  {
    label: "Real Estate",
    href: "/real-estate",
    children: [
      { label: "Division Overview", href: "/real-estate", description: "Capabilities and services" },
      { label: "Properties", href: "/real-estate/properties", description: "Residential, commercial and land" },
      { label: "Developments", href: "/real-estate/developments", description: "Our project portfolio" },
      { label: "Investment Opportunities", href: "/real-estate/investment-opportunities", description: "Company-approved opportunities" },
    ],
  },
  {
    label: "Automotive",
    href: "/automotive",
    children: [
      { label: "Division Overview", href: "/automotive", description: "Mobility capabilities and services" },
      { label: "Vehicle Inventory", href: "/automotive/vehicles", description: "New and pre-owned vehicles" },
      { label: "Corporate Fleet Solutions", href: "/automotive/fleet-solutions", description: "Procurement for organisations" },
      { label: "Vehicle Sourcing", href: "/automotive/sourcing", description: "Request a vehicle not in stock" },
    ],
  },
  { label: "Investments", href: "/investments" },
  { label: "Partnerships", href: "/partnerships" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

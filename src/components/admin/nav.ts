import type { PermissionKey } from "@/lib/permissions";

export type AdminNavItem = { label: string; href: string; icon: string; permissions: PermissionKey[] };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permissions: ["dashboard.view"] },
      { label: "Enquiries", href: "/admin/enquiries", icon: "Inbox", permissions: ["enquiry.view_all", "enquiry.view_assigned", "enquiry.view_real_estate", "enquiry.view_automotive", "enquiry.view_corporate"] },
      { label: "Reports", href: "/admin/reports", icon: "BarChart3", permissions: ["reports.view"] },
    ],
  },
  {
    title: "Real Estate",
    items: [
      { label: "Properties", href: "/admin/properties", icon: "Building2", permissions: ["property.manage"] },
      { label: "Developments", href: "/admin/developments", icon: "Landmark", permissions: ["development.manage"] },
      { label: "Locations & Types", href: "/admin/taxonomy/real-estate", icon: "MapPin", permissions: ["taxonomy.real_estate"] },
    ],
  },
  {
    title: "Automotive",
    items: [
      { label: "Vehicles", href: "/admin/vehicles", icon: "Car", permissions: ["vehicle.manage"] },
      { label: "Vehicle Categories", href: "/admin/taxonomy/automotive", icon: "Tags", permissions: ["taxonomy.automotive"] },
    ],
  },
  {
    title: "Corporate",
    items: [
      { label: "Investments", href: "/admin/investments", icon: "TrendingUp", permissions: ["investment.manage", "investment.approve"] },
      { label: "Website Content", href: "/admin/content", icon: "PanelsTopLeft", permissions: ["content.manage"] },
      { label: "Insights", href: "/admin/insights", icon: "Newspaper", permissions: ["insights.manage"] },
      { label: "Publications", href: "/admin/publications", icon: "FileText", permissions: ["publication.manage"] },
      { label: "Leadership", href: "/admin/leadership", icon: "Users", permissions: ["leadership.manage"] },
      { label: "Pages", href: "/admin/pages", icon: "ScrollText", permissions: ["pages.manage"] },
      { label: "Media Library", href: "/admin/media", icon: "Images", permissions: ["media.manage"] },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: "UserCog", permissions: ["users.manage"] },
      { label: "Roles & Permissions", href: "/admin/roles", icon: "ShieldCheck", permissions: ["users.manage"] },
      { label: "Settings", href: "/admin/settings", icon: "Settings", permissions: ["settings.manage"] },
      { label: "Audit Log", href: "/admin/audit", icon: "History", permissions: ["audit.view"] },
    ],
  },
];

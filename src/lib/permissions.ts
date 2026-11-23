/**
 * Permission catalogue and default role definitions.
 * Seeded into the Role / Permission tables; roles can be adjusted in Admin → Roles.
 */

export const PERMISSIONS = {
  "dashboard.view": { group: "General", description: "View the administration dashboard" },
  "reports.view": { group: "General", description: "View reports and analytics" },

  "enquiry.view_all": { group: "CRM", description: "View all enquiries across every category" },
  "enquiry.view_assigned": { group: "CRM", description: "View enquiries assigned to oneself" },
  "enquiry.view_real_estate": { group: "CRM", description: "View real estate enquiries" },
  "enquiry.view_automotive": { group: "CRM", description: "View automotive enquiries" },
  "enquiry.view_corporate": { group: "CRM", description: "View investment, partnership and general enquiries" },
  "enquiry.update": { group: "CRM", description: "Change status, priority and add notes" },
  "enquiry.assign": { group: "CRM", description: "Assign enquiries to staff" },
  "enquiry.export": { group: "CRM", description: "Export enquiries to CSV" },

  "property.manage": { group: "Real Estate", description: "Create, edit and archive properties" },
  "development.manage": { group: "Real Estate", description: "Manage development projects" },
  "taxonomy.real_estate": { group: "Real Estate", description: "Manage property types and locations" },

  "vehicle.manage": { group: "Automotive", description: "Manage vehicle inventory" },
  "taxonomy.automotive": { group: "Automotive", description: "Manage vehicle categories" },

  "investment.manage": { group: "Investments", description: "Create and edit investment opportunities" },
  "investment.approve": { group: "Investments", description: "Approve published investment terms" },

  "content.manage": { group: "Content", description: "Manage homepage, company and division content" },
  "insights.manage": { group: "Content", description: "Manage articles and insights" },
  "publication.manage": { group: "Content", description: "Manage corporate publications" },
  "leadership.manage": { group: "Content", description: "Manage leadership profiles" },
  "pages.manage": { group: "Content", description: "Manage legal and editorial pages" },
  "media.manage": { group: "Content", description: "Upload and manage media" },

  "settings.manage": { group: "System", description: "Company settings, notifications and SEO" },
  "users.manage": { group: "System", description: "Manage users and roles" },
  "audit.view": { group: "System", description: "View the audit log" },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

export const DEFAULT_ROLES: {
  key: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full access to the entire system.",
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "corporate_admin",
    name: "Corporate Admin",
    description: "Corporate information, content, CRM oversight and reporting.",
    permissions: [
      "dashboard.view",
      "reports.view",
      "enquiry.view_all",
      "enquiry.update",
      "enquiry.assign",
      "enquiry.export",
      "investment.manage",
      "investment.approve",
      "content.manage",
      "insights.manage",
      "publication.manage",
      "leadership.manage",
      "pages.manage",
      "media.manage",
      "settings.manage",
      "audit.view",
    ],
  },
  {
    key: "real_estate_manager",
    name: "Real Estate Manager",
    description: "Property and development operations, and real estate enquiries.",
    permissions: [
      "dashboard.view",
      "reports.view",
      "enquiry.view_real_estate",
      "enquiry.update",
      "enquiry.assign",
      "property.manage",
      "development.manage",
      "taxonomy.real_estate",
      "investment.manage",
      "media.manage",
    ],
  },
  {
    key: "automotive_manager",
    name: "Automotive Manager",
    description: "Vehicle inventory, fleet and automotive enquiries.",
    permissions: [
      "dashboard.view",
      "reports.view",
      "enquiry.view_automotive",
      "enquiry.update",
      "enquiry.assign",
      "vehicle.manage",
      "taxonomy.automotive",
      "media.manage",
    ],
  },
  {
    key: "relationship_officer",
    name: "Sales / Relationship Officer",
    description: "Assigned enquiries and client follow-up.",
    permissions: ["dashboard.view", "enquiry.view_assigned", "enquiry.update"],
  },
  {
    key: "content_editor",
    name: "Content Editor",
    description: "Approved content-management functions.",
    permissions: ["dashboard.view", "insights.manage", "publication.manage", "media.manage", "pages.manage"],
  },
];

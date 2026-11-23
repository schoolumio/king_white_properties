/**
 * Base seed — safe for production. Creates permissions, default roles, divisions,
 * catalogue taxonomies, legal page templates and the initial super administrator.
 * It never creates business records (properties, vehicles, projects, people).
 *
 *   npm run db:seed
 */
import { PrismaClient, type PropertySector } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, DEFAULT_ROLES } from "../src/lib/permissions";

const db = new PrismaClient();

const PROPERTY_TYPES: { name: string; sector: PropertySector }[] = [
  { name: "Detached House", sector: "RESIDENTIAL" },
  { name: "Semi-Detached House", sector: "RESIDENTIAL" },
  { name: "Terrace", sector: "RESIDENTIAL" },
  { name: "Apartment", sector: "RESIDENTIAL" },
  { name: "Penthouse", sector: "RESIDENTIAL" },
  { name: "Office Space", sector: "COMMERCIAL" },
  { name: "Retail Space", sector: "COMMERCIAL" },
  { name: "Hospitality", sector: "COMMERCIAL" },
  { name: "Warehouse", sector: "INDUSTRIAL" },
  { name: "Industrial Facility", sector: "INDUSTRIAL" },
  { name: "Residential Land", sector: "LAND" },
  { name: "Commercial Land", sector: "LAND" },
  { name: "Mixed-Use Building", sector: "MIXED_USE" },
];

const VEHICLE_CATEGORIES = ["SUVs", "Sedans", "Coupes", "Luxury Vehicles", "Sports Cars", "Commercial Vehicles", "Trucks", "Buses", "Electric Vehicles"];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const LEGAL_NOTE =
  "> **Template notice:** This page is a starting template and must be reviewed and approved by the company's legal advisers before publication. Edit it in Admin → Pages.";

async function main() {
  // Permissions
  for (const [key, meta] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, update: { group: meta.group, description: meta.description }, create: { key, ...meta } });
  }
  const perms = await db.permission.findMany();
  const permId = new Map(perms.map((p) => [p.key, p.id]));

  // Roles — system roles are created once; existing permission assignments are preserved
  // except for super_admin, which always receives every permission.
  for (const role of DEFAULT_ROLES) {
    const existing = await db.role.findUnique({ where: { key: role.key } });
    if (!existing) {
      await db.role.create({
        data: {
          key: role.key,
          name: role.name,
          description: role.description,
          isSystem: true,
          permissions: { create: role.permissions.map((p) => ({ permissionId: permId.get(p)! })) },
        },
      });
    } else if (role.key === "super_admin") {
      await db.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: existing.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }

  // Divisions
  await db.division.upsert({
    where: { slug: "real-estate" },
    update: {},
    create: { slug: "real-estate", name: "Real Estate & Infrastructure", shortName: "Real Estate", path: "/real-estate", order: 1 },
  });
  await db.division.upsert({
    where: { slug: "automotive" },
    update: {},
    create: { slug: "automotive", name: "Automotive & Mobility", shortName: "Automotive", path: "/automotive", order: 2 },
  });

  // Taxonomies
  for (const [i, t] of PROPERTY_TYPES.entries()) {
    await db.propertyType.upsert({ where: { slug: slug(t.name) }, update: {}, create: { slug: slug(t.name), name: t.name, sector: t.sector, order: i } });
  }
  for (const [i, name] of VEHICLE_CATEGORIES.entries()) {
    await db.vehicleCategory.upsert({ where: { slug: slug(name) }, update: {}, create: { slug: slug(name), name, order: i } });
  }

  // Legal page templates
  await db.page.upsert({
    where: { slug: "privacy-policy" },
    update: {},
    create: {
      slug: "privacy-policy",
      title: "Privacy Policy",
      metaDescription: "How we collect, use and protect personal information submitted through this website.",
      body: `${LEGAL_NOTE}

## Information we collect
When you submit an enquiry, inspection request, proposal or other form, we collect the details you provide — such as your name, organisation, contact details and the content of your message — together with any documents you choose to upload.

## How we use information
We use this information to respond to your enquiry, to manage our relationship with you and to meet our legal and regulatory obligations. Submissions are accessible only to authorised staff with a business need.

## Data protection
We store information securely and apply role-based access controls. Confidential submissions, including investor and partnership documents, are never published.

## Your rights
Subject to applicable law, including the Nigeria Data Protection Act 2023, you may request access to, correction of or deletion of your personal data by contacting us.

## Contact
For privacy enquiries, please contact us through the details on our Contact page.`,
    },
  });
  await db.page.upsert({
    where: { slug: "terms-of-service" },
    update: {},
    create: {
      slug: "terms-of-service",
      title: "Terms of Service",
      metaDescription: "Terms governing the use of this website.",
      body: `${LEGAL_NOTE}

## Use of this website
Information on this website is provided for general information purposes. Listings, specifications, prices and availability are subject to change and to confirmation in writing.

## No offer
Nothing on this website constitutes an offer, a solicitation of investment or financial advice. Investment opportunities are subject to due diligence, formal documentation and applicable law, and no returns are guaranteed.

## Intellectual property
All content on this website is owned by or licensed to the company and may not be reproduced without permission.

## Liability
To the extent permitted by law, the company is not liable for any loss arising from reliance on information published on this website.`,
    },
  });

  // Initial super administrator
  const userCount = await db.user.count();
  if (userCount === 0) {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD ?? "";
    if (!email || password.length < 12) {
      console.warn("⚠  No users exist. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 12 chars) and re-run the seed to create the super administrator.");
    } else {
      const role = await db.role.findUniqueOrThrow({ where: { key: "super_admin" } });
      await db.user.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME || "Platform Administrator",
          passwordHash: await bcrypt.hash(password, 12),
          roleId: role.id,
        },
      });
      console.log(`✓ Super administrator created: ${email}`);
    }
  }

  console.log("✓ Base seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

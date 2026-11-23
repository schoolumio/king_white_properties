/**
 * DEMONSTRATION SEED — development and staging environments only.
 *
 * Creates sample records flagged `isDemo = true`. They are labelled "Demo data"
 * on the public website and in the admin portal, and can be removed in one step
 * from Admin → Settings → Demo data. Sample photography references stock
 * placeholder images, not company assets.
 *
 *   npm run db:seed:demo
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const db = new PrismaClient();

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
  console.error("Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=true to override (staging only).");
  process.exit(1);
}

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=80`;

async function image(id: string, alt: string) {
  return db.mediaAsset.create({
    data: { driver: "remote", storageKey: `demo:${id}`, url: U(id), visibility: "PUBLIC", mimeType: "image/jpeg", size: 0, originalName: `${id}.jpg`, alt, folder: "demo" },
  });
}

async function location(name: string, city: string, state: string) {
  const slug = `${name}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return db.location.upsert({ where: { slug }, update: {}, create: { slug, name, city, state } });
}

async function main() {
  const existing = await db.property.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log("Demo data already present — skipping. Remove it from Admin → Settings first to reseed.");
    return;
  }
  const now = new Date();
  const [ikoyi, lekki, vi, maitama, asokoro] = await Promise.all([
    location("Ikoyi", "Lagos", "Lagos"),
    location("Lekki Phase 1", "Lagos", "Lagos"),
    location("Victoria Island", "Lagos", "Lagos"),
    location("Maitama", "Abuja", "FCT"),
    location("Asokoro", "Abuja", "FCT"),
  ]);
  const type = async (slug: string) => (await db.propertyType.findUnique({ where: { slug } }))?.id ?? null;

  // ───────────── Developments
  const projects: { data: Prisma.DevelopmentProjectUncheckedCreateInput; images: [string, string][]; units?: Prisma.DevelopmentUnitCreateWithoutProjectInput[] }[] = [
    {
      data: {
        slug: "demo-riverside-residences",
        name: "Demo: Riverside Residences",
        summary: "Sample gated residential development used to demonstrate the development portfolio.",
        overview:
          "This is **demonstration content**. It shows how a development is presented: overview, stage, unit availability, progress updates, documentation and enquiries.\n\nReplace it with verified project information before launch.",
        sector: "RESIDENTIAL",
        projectType: "Gated residential estate",
        status: "UNDER_DEVELOPMENT",
        currentStage: "Superstructure — Phase 1",
        progressPercent: 45,
        locationId: lekki.id,
        latitude: 6.4474,
        longitude: 3.4723,
        totalUnits: 48,
        featured: true,
      },
      images: [
        ["photo-1600585154340-be6161a56a0c", "Contemporary residence exterior (sample image)"],
        ["photo-1600596542815-ffad4c1539a9", "Residence with pool (sample image)"],
      ],
      units: [
        { name: "4-Bedroom Terrace", bedrooms: 4, floorAreaSqm: 280, priceOnRequest: true, totalUnits: 24, availableUnits: 9, status: "AVAILABLE", order: 1 },
        { name: "5-Bedroom Detached", bedrooms: 5, floorAreaSqm: 420, priceOnRequest: true, totalUnits: 12, availableUnits: 2, status: "LIMITED", order: 2 },
      ],
    },
    {
      data: {
        slug: "demo-marina-business-tower",
        name: "Demo: Marina Business Tower",
        summary: "Sample commercial office development illustrating a completed asset.",
        overview: "Demonstration content for a completed commercial asset. Replace with verified information.",
        sector: "COMMERCIAL",
        projectType: "Grade A office building",
        status: "COMPLETED",
        locationId: vi.id,
        featured: true,
      },
      images: [["photo-1486406146926-c627a92ad1ab", "Commercial high-rise (sample image)"]],
    },
    {
      data: {
        slug: "demo-maitama-gardens",
        name: "Demo: Maitama Gardens",
        summary: "Sample mixed-use scheme illustrating an upcoming project available for partnership.",
        overview: "Demonstration content for an upcoming development. Replace with verified information.",
        sector: "MIXED_USE",
        projectType: "Mixed-use scheme",
        status: "UPCOMING",
        locationId: maitama.id,
      },
      images: [["photo-1545324418-cc1a3fa10c00", "Apartment building (sample image)"]],
    },
  ];
  const createdProjects = [];
  for (const p of projects) {
    const proj = await db.developmentProject.create({ data: { ...p.data, isDemo: true, publishStatus: "PUBLISHED", publishedAt: now } });
    for (const [i, [id, alt]] of p.images.entries()) {
      const m = await image(id, alt);
      await db.projectMedia.create({ data: { projectId: proj.id, mediaId: m.id, caption: alt, order: i } });
    }
    for (const u of p.units ?? []) await db.developmentUnit.create({ data: { ...u, projectId: proj.id } });
    createdProjects.push(proj);
  }
  await db.projectUpdate.create({
    data: { projectId: createdProjects[0].id, title: "Demo update: Phase 1 superstructure", body: "Sample progress update illustrating the construction timeline.", publishedAt: now },
  });

  // ───────────── Properties
  const properties: { data: Prisma.PropertyUncheckedCreateInput; images: [string, string][] }[] = [
    {
      data: {
        slug: "demo-four-bedroom-residence-ikoyi",
        title: "Demo: Four-Bedroom Residence",
        summary: "Sample residential listing used to demonstrate the property marketplace.",
        description: "This is **demonstration content**. Replace it with a verified listing.\n\n- Sample feature one\n- Sample feature two",
        sector: "RESIDENTIAL",
        propertyTypeId: await type("detached-house"),
        listingType: "SALE",
        locationId: ikoyi.id,
        price: 950000000,
        bedrooms: 4,
        bathrooms: 5,
        parkingSpaces: 3,
        floorAreaSqm: 450,
        features: ["Fitted kitchen", "Staff quarters", "Private garden"],
        amenities: ["24-hour security", "Backup power"],
        featured: true,
        latitude: 6.4541,
        longitude: 3.4347,
      },
      images: [["photo-1613490493576-7fde63acd811", "Residence exterior (sample image)"]],
    },
    {
      data: {
        slug: "demo-office-floor-victoria-island",
        title: "Demo: Office Floor",
        summary: "Sample commercial lease listing.",
        description: "Demonstration commercial listing. Replace with verified information.",
        sector: "COMMERCIAL",
        propertyTypeId: await type("office-space"),
        listingType: "LEASE",
        pricePeriod: "PER_ANNUM",
        locationId: vi.id,
        price: 85000000,
        floorAreaSqm: 600,
        developmentId: createdProjects[1].id,
      },
      images: [["photo-1497366216548-37526070297c", "Office interior (sample image)"]],
    },
    {
      data: {
        slug: "demo-residential-plot-asokoro",
        title: "Demo: Residential Plot",
        summary: "Sample land listing.",
        description: "Demonstration land listing. Replace with verified information.",
        sector: "LAND",
        propertyTypeId: await type("residential-land"),
        listingType: "SALE",
        locationId: asokoro.id,
        priceOnRequest: true,
        landAreaSqm: 1500,
        titleDocument: "To be confirmed",
      },
      images: [["photo-1449824913935-59a10b8d2000", "Aerial city view (sample image)"]],
    },
  ];
  for (const p of properties) {
    const prop = await db.property.create({ data: { ...p.data, isDemo: true, publishStatus: "PUBLISHED", publishedAt: now, availabilityVerifiedAt: now } });
    for (const [i, [id, alt]] of p.images.entries()) {
      const m = await image(id, alt);
      await db.propertyImage.create({ data: { propertyId: prop.id, mediaId: m.id, alt, order: i } });
    }
  }

  // ───────────── Vehicles
  const cat = async (slug: string) => (await db.vehicleCategory.findUnique({ where: { slug } }))!;
  const vehicles: { data: Prisma.VehicleUncheckedCreateInput; cats: string[]; img: [string, string] }[] = [
    {
      data: { slug: "demo-2024-sport-coupe", make: "Porsche", model: "911", variant: "Demo listing", year: 2024, price: 280000000, condition: "FOREIGN_USED", bodyType: "COUPE", transmission: "AUTOMATIC", fuelType: "PETROL", mileage: 8000, featured: true, features: ["Sample feature"] },
      cats: ["sports-cars", "luxury-vehicles", "coupes"],
      img: ["photo-1503376780353-7e6692767b70", "Sports coupe (sample image)"],
    },
    {
      data: { slug: "demo-2023-muscle-coupe", make: "Ford", model: "Mustang", variant: "Demo listing", year: 2023, price: 95000000, condition: "FOREIGN_USED", bodyType: "COUPE", transmission: "AUTOMATIC", fuelType: "PETROL", mileage: 15000, featured: true },
      cats: ["sports-cars", "coupes"],
      img: ["photo-1494976388531-d1058494cdd8", "Coupe (sample image)"],
    },
    {
      data: { slug: "demo-2025-executive-car", make: "Mercedes-Benz", model: "S-Class", variant: "Demo listing", year: 2025, priceOnRequest: true, condition: "NEW", bodyType: "SEDAN", transmission: "AUTOMATIC", fuelType: "HYBRID", mileage: 0, featured: true },
      cats: ["luxury-vehicles", "sedans"],
      img: ["photo-1492144534655-ae79c964c9d7", "Executive car (sample image)"],
    },
  ];
  for (const v of vehicles) {
    const cats = await Promise.all(v.cats.map(cat));
    const veh = await db.vehicle.create({
      data: { ...v.data, isDemo: true, publishStatus: "PUBLISHED", publishedAt: now, categories: { connect: cats.filter(Boolean).map((c) => ({ id: c.id })) } } as Prisma.VehicleUncheckedCreateInput,
    });
    const m = await image(v.img[0], v.img[1]);
    await db.vehicleImage.create({ data: { vehicleId: veh.id, mediaId: m.id, alt: v.img[1] } });
  }

  // ───────────── Opportunity & article
  await db.investmentOpportunity.create({
    data: {
      slug: "demo-residential-co-development",
      title: "Demo: Residential Co-Development",
      summary: "Sample opportunity demonstrating the investor relations workflow. Not an actual offer.",
      description: "Demonstration content only. This is not an offer or solicitation.",
      sector: "REAL_ESTATE",
      investmentStructure: "Joint venture (sample)",
      status: "OPEN",
      locationId: maitama.id,
      projectId: createdProjects[2].id,
      isDemo: true,
      publishStatus: "PUBLISHED",
      publishedAt: now,
    },
  });
  await db.article.create({
    data: {
      slug: "demo-corporate-announcement",
      title: "Demo: Corporate Announcement",
      excerpt: "Sample article demonstrating the insights section.",
      body: "This is **demonstration content** for the insights section. Replace or remove before launch.",
      type: "ANNOUNCEMENT",
      isDemo: true,
      publishStatus: "PUBLISHED",
      publishedAt: now,
    },
  });

  console.log("✓ Demo data created (flagged isDemo — remove from Admin → Settings → Demo data)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

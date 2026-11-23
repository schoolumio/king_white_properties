# King White — Integrated Enterprise Platform

Corporate web platform for a group operating two divisions — **Real Estate & Infrastructure** and **Automotive & Mobility** — under one parent identity, with a shared CRM, CMS, investor-relations channel and administration portal.

> The company name is set to **King White** (editable in Admin → Website content → Company information). Other corporate facts — legal name, contacts, address, leadership, policies, opportunities — are entered through the admin portal. Nothing about the business is invented in code.

---

## Contents

1. [Stack](#stack)
2. [Getting started](#getting-started)
3. [Architecture](#architecture)
4. [Public site](#public-site)
5. [Administration portal](#administration-portal)
6. [Roles & permissions](#roles--permissions)
7. [Integrations & environment variables](#integrations--environment-variables)
8. [Security](#security)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Launch checklist & open items](#launch-checklist--open-items)

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions), TypeScript |
| Styling | Tailwind CSS v4 with runtime-configurable brand tokens |
| Typography | Manrope (headings), Inter (body), Playfair Display (editorial accents) via `next/font` |
| Data | PostgreSQL + Prisma ORM 6 |
| Auth | Database-backed sessions (httpOnly cookie, SHA-256 hashed tokens), bcrypt passwords, role-based permissions |
| Forms | React Hook Form + Zod (shared schemas, re-validated on the server) |
| Storage | Pluggable: local disk (development) or Cloudinary (production) |
| Email | Pluggable: log-only (default) or Resend |
| Maps | OpenStreetMap embed (no key) or Google Maps Embed API (optional key) |
| Icons | Lucide |

## Getting started

Requirements: Node 20.9+, PostgreSQL 14+.

```bash
cp .env.example .env          # then edit DATABASE_URL, APP_SECRET, SEED_ADMIN_*
npm install
npx prisma migrate deploy     # create the schema
npm run db:seed               # roles, permissions, divisions, taxonomies, legal templates, first Super Admin
npm run dev
```

Open http://localhost:3000 and sign in at http://localhost:3000/admin with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. **Change the password immediately** (Admin → My account).

### Optional demo data (development/staging only)

```bash
npm run db:seed:demo
```

Creates a handful of sample properties, developments, vehicles, one opportunity and one article. Every record is flagged `isDemo`, is labelled **“Demo data”** on the website and in the portal, and can be removed in one step from **Admin → Settings → Demo data**. The script refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`.

## Architecture

```
src/
  app/
    (site)/                 Public website (header/footer layout)
      page.tsx              Homepage (11 sections)
      about/, about/governance/
      real-estate/          Landing, properties, developments, investment opportunities
      automotive/           Landing, vehicles, fleet solutions, sourcing
      investments/, partnerships/, insights/, contact/, legal/[slug]/
    admin/
      login/                Sign-in
      (panel)/              Authenticated portal (dashboard, CRM, catalogues, CMS, system)
      actions/              Server actions — every one calls authorize(permission)
    actions/enquiry.ts      Public form submission (spam checks → validation → persistence → notifications)
    api/files/[id]          Access-controlled file delivery (public + private)
    api/admin/upload        Authenticated upload endpoint
    api/admin/enquiries/export   CSV export
    media/[...key]          Local-driver public file serving
    sitemap.ts, robots.ts
  components/
    site/ ui/ catalog/ forms/    Public design system
    admin/                       Portal UI kit (forms, media manager, CMS editor)
  lib/
    auth.ts                 Sessions, requireUser / authorize / can
    permissions.ts          Permission catalogue + default roles
    content-schema.ts       CMS registry: every editable section, its fields and defaults
    enquiries.ts            Central enquiry creation, reference numbers, notifications
    storage.ts / email.ts   Provider abstractions
prisma/
  schema.prisma             Relational model (≈35 models)
  seed.ts / seed-demo.ts
```

### Shared vs. divisional

* **Shared corporate infrastructure:** users/roles, `Enquiry` CRM, `CorporateContent` CMS, `MediaAsset`, `AuditLog`, `NotificationLog`, investor relations, partnerships.
* **Division A:** `Property`, `PropertyType`, `DevelopmentProject` (+ media, documents, units, progress updates).
* **Division B:** `Vehicle`, `VehicleCategory`, `VehicleImage`.
* **Extensibility:** divisions are rows in `Division`; enquiries carry a `divisionId`; permissions and CRM visibility are category-scoped. A future division adds its own catalogue models and a category entry in `lib/enquiry-meta.ts` without changing the shared layers.

### Central CRM

Every public form writes one `Enquiry` (unique reference such as `PTN-2611-BX4JB`) plus a typed detail record where relevant (`InspectionRequest`, `FleetRequest`, `VehicleSourcingRequest`, `PartnershipProposal`, `EnquiryAttachment`). Categories: property, property inspection, development, automotive, test drive, vehicle sourcing, fleet, investment, partnership, general. Statuses: New → Contacted → Under Review → Qualified → Proposal Sent → Negotiation → Converted / Closed / Rejected. Assignment history, internal notes and every status/priority change are recorded in `EnquiryActivity`.

A submission is only reported as successful after the database transaction commits. Email notifications are sent after commit and never cause a successful submission to be reported as failed.

### Content management

`src/lib/content-schema.ts` declares every editable block (company info, SEO, brand colours, each homepage section, About, Governance, Investor relations, Partnerships, Contact, division landing pages, Fleet page, notification recipients). The admin CMS renders editors from these definitions; the server sanitises and validates by field type. Content is cached and revalidated on save.

## Public site

| Route | Purpose |
| --- | --- |
| `/` | Hero, corporate introduction, divisions, featured developments, featured vehicles, investment, principles, governance & leadership, insights & publications, closing CTA |
| `/about`, `/about/governance` | Company profile, vision/mission/values; leadership, structure, compliance, downloadable policies |
| `/real-estate` | Division landing |
| `/real-estate/properties` (+ `/[slug]`) | Searchable marketplace: category, sale/lease, location, price, bedrooms, status, sort; detail with gallery/lightbox, specs, features, floor plans, brochures, map, inspection & enquiry forms |
| `/real-estate/developments` (+ `/[slug]`) | Portfolio by status; detail with stage, progress, units, masterplans, construction updates, documents, enquiries |
| `/real-estate/investment-opportunities` (+ `/[slug]`) | Company-approved opportunities |
| `/automotive` | Division landing: featured, new arrivals, premium, commercial, fleet, sourcing, leasing |
| `/automotive/vehicles` (+ `/[slug]`) | Inventory with make, model, year, price, condition, mileage, transmission, fuel, body, category, availability filters; detail with gallery, specs, inspection info, enquiry and test-drive/inspection booking |
| `/automotive/fleet-solutions` | B2B fleet offering + structured fleet request form |
| `/automotive/sourcing` | Vehicle sourcing request |
| `/investments` | Investor relations: overview, process, opportunities, documentation, contact, confidential enquiry |
| `/partnerships` | Institutional categories + proposal form with confidential document upload |
| `/insights` (+ `/[slug]`, `/publications`) | Articles by type; downloadable publications |
| `/contact`, `/legal/[slug]` | Contact form & office map; CMS-managed legal pages |

Empty catalogues show designed empty states — never fabricated listings. SEO: per-page titles/descriptions, canonical URLs, Open Graph, JSON-LD (Organization, BreadcrumbList, RealEstateListing, Car, Article), XML sitemap and robots.txt.

## Administration portal

`/admin` — dashboard (live counts only), enquiries CRM (search, filters, assignment, status, priority, notes, activity history, CSV export), properties, developments (units, progress updates, galleries, masterplans, documents), vehicles (mark as sold, archive, feature), investments (with terms-approval workflow), website content, insights, publications, leadership, legal pages, media library, locations/types/categories, users, roles & permissions, settings (notification recipients, integration status, notification log, demo-data removal), audit log, reports.

Investment terms are hidden from the public page until a user with **Approve investment terms** approves them; editing terms revokes approval automatically.

## Roles & permissions

Seeded roles (editable in **Admin → Roles**, custom roles supported):

| Role | Scope |
| --- | --- |
| Super Admin | Everything (always receives every permission) |
| Corporate Admin | Corporate content, all enquiries, investments (incl. approval), settings, audit, reports |
| Real Estate Manager | Properties, developments, RE taxonomies, opportunities, real estate enquiries |
| Automotive Manager | Vehicles, categories, automotive/fleet/sourcing enquiries |
| Sales / Relationship Officer | Enquiries assigned to them |
| Content Editor | Insights, publications, pages, media |

Every admin page calls `requireUser(permission)` and every server action calls `authorize(permission)`; the middleware only performs a fast cookie check.

## Integrations & environment variables

See `.env.example` for the full list.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes* | PostgreSQL connection string. *Not needed when a Vercel database integration (Prisma Postgres, Neon) injects `POSTGRES_URL` / `DATABASE_URL_POOLED` — these are detected automatically. |
| `DIRECT_URL` | Optional | Non-pooled URL used only for migrations when `DATABASE_URL` points at a connection pooler |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical base URL, sitemap, email links |
| `APP_SECRET` | Yes | Long random string (`openssl rand -hex 32`) — salts hashed IPs used for rate limiting |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | First run | Creates the first Super Admin when no users exist |
| `STORAGE_DRIVER` | Optional | `database` (default on Vercel — files stored in PostgreSQL, no extra account), `local` (default in development) or `cloudinary` (recommended once the media library grows) |
| `SEED_DEMO_DATA` | Optional | `true` loads clearly labelled sample listings during the Vercel build for client review; remove them in Admin → Settings before launch |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | Production | Private files are uploaded as `authenticated` assets and streamed only via `/api/files/[id]` |
| `EMAIL_PROVIDER` | Yes | `log` (record only) or `resend` |
| `RESEND_API_KEY`, `EMAIL_FROM` | For delivery | `EMAIL_FROM` must use a domain verified in Resend |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Optional | Uses Google Maps Embed instead of OpenStreetMap |

**Email setup (Resend):** create an account → verify the sending domain (DNS records) → create an API key → set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM="Company <noreply@yourdomain>"` → add recipients in **Admin → Settings → Notification recipients**. Every attempt is visible in the notification log.

**Storage setup (Cloudinary):** create an account → copy cloud name, API key and secret from the dashboard → set `STORAGE_DRIVER=cloudinary` and the three variables. The **System status** panel in Admin → Settings shows which integrations are configured.

## Security

* Sessions: random 256-bit tokens, stored hashed, httpOnly/SameSite=Lax/Secure cookies, 12-hour expiry; password change or deactivation revokes sessions.
* Login throttling per IP and per account; failed logins are audited.
* Public forms: honeypot field, minimum completion time, per-IP rate limit (6 per 10 minutes), Zod validation server-side, consent capture.
* Uploads: MIME allow-list, size limits, magic-byte verification; partnership documents and investor documents are stored **private** and only served to authenticated staff permitted to view the related enquiry.
* CSV export neutralises spreadsheet formula injection.
* Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy); `/admin` is `noindex`.
* Audit log of sign-ins, content/catalogue changes, assignments, approvals, exports, user and role changes.
* Raw IP addresses are never stored (HMAC-hashed with `APP_SECRET`).

## Deployment

**Vercel (recommended):**

1. Create a PostgreSQL database (Neon, Supabase, Vercel Postgres, RDS…). Set `DATABASE_URL` (and optionally `DIRECT_URL` if `DATABASE_URL` is a pooled connection).
2. Import the repository into Vercel. The `vercel-build` script (`scripts/vercel-build.mjs`) generates the Prisma client, applies migrations when `DATABASE_URL` is set, then builds. Without a database the build still succeeds, but the site cannot store enquiries or show listings until `DATABASE_URL` is added and the project is redeployed.
3. Set the environment variables above. File uploads work out of the box on Vercel (stored in the database); switch to `STORAGE_DRIVER=cloudinary` later for faster image delivery.
4. The build runs the base seed automatically. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (12+ characters) before the first deploy so the first Super Admin is created; change that password after signing in.
5. Configure the custom domain and update `NEXT_PUBLIC_SITE_URL`.

Note: Vercel limits request bodies to ~4.5 MB, so uploads are capped at 4 MB per file (images, brochures and partnership documents).

**Self-hosted:** `npm ci && npx prisma migrate deploy && npm run build && npm start` behind a TLS reverse proxy. `STORAGE_DRIVER=local` is acceptable on a single persistent server (back up `./storage`).

## Testing

```bash
npm run typecheck
npm run build
# against a running instance:
BASE_URL=http://localhost:3000 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:smoke
```

The smoke test (Playwright) loads every public page, checks client-side validation, submits the contact, partnership (with document upload), fleet and sourcing forms and verifies a reference number, signs in to the portal, finds the enquiry in the CRM, changes its status, adds a note and loads every admin screen. Note that the spam rate limit allows six submissions per IP per ten minutes.

## Launch checklist & open items

These need information or credentials from the company and are deliberately **not** filled in:

- [ ] Registered legal name, registration statement, contact details, address, social links — *Admin → Website content → Company information*
- [ ] Logo files (light and dark) — same section (a wordmark is generated until supplied)
- [ ] **Photography.** The default hero/section images reference Unsplash stock photography as placeholders and are labelled as such in the CMS. They could not be visually verified in the build environment; replace every image with commissioned or licensed company photography in *Website content*. Pages fall back to a branded graphic if an image fails to load.
- [ ] Company profile, vision, mission, values, governance framework, compliance text
- [ ] Leadership profiles (real, approved individuals only)
- [ ] Investment and partnership categories confirmed as actively offered
- [ ] Privacy Policy and Terms of Service — the seeded templates must be reviewed by legal counsel (NDPA 2023 compliance)
- [ ] Resend account + verified domain; notification recipients
- [ ] Cloudinary account (production storage)
- [ ] Production database and domain
- [ ] Remove demo data if the demo seed was used
- [ ] Optional: Google Maps Embed key; analytics provider of choice

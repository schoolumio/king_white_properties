/**
 * End-to-end smoke test (Playwright). Exercises the critical journeys against a
 * running instance:
 *   1. Public pages render without client errors
 *   2. Contact, partnership (with document upload), fleet and sourcing forms persist and return a reference
 *   3. Admin login, enquiry visible in CRM, status change + internal note
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run test:smoke
 * Requires the `playwright` package (npx playwright install chromium if not present).
 */
import { createRequire } from "node:module";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

console.log("Public pages");
for (const p of ["/", "/about", "/about/governance", "/real-estate", "/real-estate/properties", "/real-estate/developments", "/automotive", "/automotive/vehicles", "/automotive/fleet-solutions", "/automotive/sourcing", "/investments", "/partnerships", "/insights", "/contact"]) {
  errors.length = 0;
  const res = await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  if (res?.status() === 200 && errors.length === 0) ok(p);
  else fail(`${p} → ${res?.status()} ${errors.join("; ")}`);
}

async function submit(formPath, fill, label) {
  await page.goto(BASE + formPath, { waitUntil: "load" });
  await page.waitForTimeout(2800); // minimum completion time (spam protection)
  await fill();
  await page.getByRole("button", { name: /submit|send/i }).last().click();
  try {
    const ref = await page.getByTestId("enquiry-reference").textContent({ timeout: 20000 });
    ok(`${label}: ${ref}`);
    return ref?.trim();
  } catch {
    const alert = await page.locator("[role=alert]").allTextContents();
    fail(`${label}: no reference shown ${alert.join(" ")}`);
  }
}

console.log("Forms");
// Client-side validation blocks empty submission
await page.goto(BASE + "/contact", { waitUntil: "load" });
await page.getByRole("button", { name: /send message/i }).click();
(await page.getByText("Full name is required").count()) ? ok("validation messages shown") : fail("validation messages missing");

const contactRef = await submit(
  "/contact",
  async () => {
    await page.fill("#general-name", "Smoke Test");
    await page.fill("#general-email", "smoke@example.com");
    await page.fill("#general-subject", "Automated smoke test");
    await page.fill("#general-message", "This is an automated smoke test submission.");
    await page.check("input[name=consent]");
  },
  "contact",
);

const dir = mkdtempSync(path.join(tmpdir(), "smoke-"));
const pdf = path.join(dir, "proposal.pdf");
writeFileSync(pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
await submit(
  "/partnerships",
  async () => {
    await page.fill("#partnership-organisation", "Smoke Test Institution");
    await page.selectOption("#partnership-organisationType", { index: 1 });
    await page.fill("#partnership-name", "Smoke Tester");
    await page.fill("#partnership-position", "Director");
    await page.fill("#partnership-email", "partner@example.com");
    await page.fill("#partnership-phone", "+234 800 000 0000");
    await page.fill("#partnership-country", "Nigeria");
    await page.selectOption("#partnership-category", { index: 1 });
    await page.fill("#partnership-message", "Automated partnership proposal for smoke testing.");
    await page.setInputFiles("#partnership-document", pdf);
    await page.check("input[name=consent]");
  },
  "partnership + document",
);

await submit(
  "/automotive/fleet-solutions",
  async () => {
    await page.fill("#fleet-organisation", "Smoke Logistics Ltd");
    await page.fill("#fleet-name", "Fleet Tester");
    await page.fill("#fleet-email", "fleet@example.com");
    await page.fill("#fleet-phone", "+234 800 000 0001");
    await page.selectOption("#fleet-vehicleCategory", { index: 1 });
    await page.fill("#fleet-quantity", "12");
    await page.check("input[name=consent]");
  },
  "fleet",
);

await submit(
  "/automotive/sourcing",
  async () => {
    await page.fill("#sourcing-make", "Toyota");
    await page.fill("#sourcing-model", "Land Cruiser");
    await page.fill("#sourcing-name", "Sourcing Tester");
    await page.fill("#sourcing-email", "source@example.com");
    await page.fill("#sourcing-phone", "+234 800 000 0002");
    await page.check("input[name=consent]");
  },
  "sourcing",
);

console.log("Admin");
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  fail("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin checks");
} else {
  await page.goto(BASE + "/admin/login");
  await page.fill("input[name=email]", ADMIN_EMAIL);
  await page.fill("input[name=password]", ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/, { timeout: 20000 }).then(() => ok("login")).catch(() => fail("login"));
  if (contactRef) {
    await page.goto(`${BASE}/admin/enquiries?q=${contactRef}`);
    const link = page.getByRole("link", { name: contactRef });
    if (await link.count()) {
      ok("enquiry visible in CRM");
      await link.click();
      await page.waitForLoadState("load");
      await page.waitForTimeout(1000); // allow hydration
      await page.selectOption("select[name=status]", "CONTACTED");
      await page.locator("form", { has: page.locator("select[name=status]") }).getByRole("button", { name: "Update" }).click();
      await page.getByText("Enquiry updated.").waitFor({ timeout: 15000 }).then(() => ok("status changed")).catch(() => fail("status change"));
      await page.fill("textarea[name=note]", "Smoke test note");
      await page.getByRole("button", { name: "Add note" }).click();
      await page.getByText("Note added.").waitFor({ timeout: 15000 }).then(() => ok("note added")).catch(() => fail("note"));
    } else fail("enquiry not found in CRM");
  }
  for (const p of ["/admin/properties", "/admin/developments", "/admin/vehicles", "/admin/investments", "/admin/content", "/admin/insights", "/admin/publications", "/admin/leadership", "/admin/pages", "/admin/media", "/admin/users", "/admin/roles", "/admin/settings", "/admin/audit", "/admin/reports", "/admin/taxonomy/real-estate", "/admin/taxonomy/automotive", "/admin/properties/new", "/admin/vehicles/new", "/admin/developments/new", "/admin/investments/new", "/admin/insights/new", "/admin/content/home.hero"]) {
    errors.length = 0;
    const res = await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    if (res?.status() === 200 && errors.length === 0) ok(p);
    else fail(`${p} → ${res?.status()} ${errors.join("; ")}`);
  }
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);

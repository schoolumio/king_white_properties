/**
 * Production build used by Vercel (`npm run vercel-build`).
 *  1. Generates the Prisma client.
 *  2. Applies pending migrations when DATABASE_URL is configured
 *     (uses DIRECT_URL for migrations when provided, e.g. with a connection pooler).
 *  3. Runs the idempotent base seed (roles, taxonomies, first admin if none).
 *  4. Builds Next.js.
 */
import { execSync } from "node:child_process";

const run = (cmd, env = process.env) => execSync(cmd, { stdio: "inherit", env });

run("npx prisma generate");

// Accept the variable names injected by Vercel database integrations (e.g. Prisma Postgres).
const isPg = (v) => v && /^postgres(ql)?:\/\//.test(v);
const pick = (...names) => names.map((n) => process.env[n]).find(isPg);
const runtimeUrl = pick("DATABASE_URL", "DATABASE_URL_POOLED", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
const migrateUrl = pick("DIRECT_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "DATABASE_URL", "DATABASE_URL_POOLED");
if (runtimeUrl && !process.env.DATABASE_URL) process.env.DATABASE_URL = runtimeUrl;

if (runtimeUrl) {
  console.log("✓ Database connection found");
  const env = { ...process.env, DATABASE_URL: migrateUrl || runtimeUrl };
  run("npx prisma migrate deploy", env);
  // Idempotent base seed: roles, permissions, divisions, taxonomies, legal templates and —
  // only when no users exist — the first Super Admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
  // Never creates demo or business records.
  run("npx tsx prisma/seed.ts", env);
} else {
  console.warn(
    "\n⚠  No database connection found (DATABASE_URL / POSTGRES_URL) — skipping database migrations.\n" +
      "   The site will build, but it cannot store enquiries or show listings until DATABASE_URL is configured\n" +
      "   in Vercel → Project → Settings → Environment Variables, followed by a redeploy.\n",
  );
}

run("npx next build");

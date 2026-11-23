/**
 * Production build used by Vercel (`npm run vercel-build`).
 *  1. Generates the Prisma client.
 *  2. Applies pending migrations when DATABASE_URL is configured
 *     (uses DIRECT_URL for migrations when provided, e.g. with a connection pooler).
 *  3. Builds Next.js.
 */
import { execSync } from "node:child_process";

const run = (cmd, env = process.env) => execSync(cmd, { stdio: "inherit", env });

run("npx prisma generate");

if (process.env.DATABASE_URL) {
  const env = { ...process.env, DATABASE_URL: process.env.DIRECT_URL || process.env.DATABASE_URL };
  run("npx prisma migrate deploy", env);
} else {
  console.warn(
    "\n⚠  DATABASE_URL is not set — skipping database migrations.\n" +
      "   The site will build, but it cannot store enquiries or show listings until DATABASE_URL is configured\n" +
      "   in Vercel → Project → Settings → Environment Variables, followed by a redeploy.\n",
  );
}

run("npx next build");

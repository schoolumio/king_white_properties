/**
 * Resolves the database connection string. Besides DATABASE_URL, accepts the
 * variable names injected by Vercel database integrations (Prisma Postgres,
 * Vercel Postgres / Neon), so a connected database works without manual copying.
 * Only plain postgres:// URLs are used (not prisma+postgres:// Accelerate URLs).
 */
const RUNTIME_CANDIDATES = ["DATABASE_URL", "DATABASE_URL_POOLED", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];

export function resolveDatabaseUrl() {
  for (const name of RUNTIME_CANDIDATES) {
    const v = process.env[name];
    if (v && /^postgres(ql)?:\/\//.test(v)) return v;
  }
  return undefined;
}

/** Ensures process.env.DATABASE_URL is set before Prisma Client initialises. */
export function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const url = resolveDatabaseUrl();
    if (url) process.env.DATABASE_URL = url;
  }
}

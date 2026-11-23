import "server-only";
import { db } from "./db";

/**
 * Database-backed sliding-window limiter. Works across serverless instances
 * without additional infrastructure.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await db.rateLimitEvent.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return { ok: false as const, remaining: 0 };
  await db.rateLimitEvent.create({ data: { key } });
  // Opportunistic cleanup of stale events (1% of calls).
  if (Math.random() < 0.01) {
    await db.rateLimitEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86400000) } } }).catch(() => {});
  }
  return { ok: true as const, remaining: limit - count - 1 };
}

export async function clearRateLimit(key: string) {
  await db.rateLimitEvent.deleteMany({ where: { key } });
}

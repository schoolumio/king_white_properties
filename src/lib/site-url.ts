/**
 * Normalises the public site URL. Accepts values with or without a scheme
 * ("example.com" → "https://example.com"), strips trailing slashes, and falls
 * back to Vercel's production domain or localhost when unset or invalid.
 */
function normalise(raw: string | undefined) {
  if (!raw) return null;
  let v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `${/^(localhost|127\.0\.0\.1)/.test(v) ? "http" : "https"}://${v}`;
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export const SITE_URL =
  normalise(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalise(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalise(process.env.VERCEL_URL) ??
  "http://localhost:3000";

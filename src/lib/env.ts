import "server-only";

/** Centralised, typed access to environment configuration. */
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  appSecret: process.env.APP_SECRET || "development-only-secret",
  isProduction: process.env.NODE_ENV === "production",
  storage: {
    driver: (process.env.STORAGE_DRIVER || "local") as "local" | "cloudinary",
    localDir: process.env.LOCAL_STORAGE_DIR || "./storage",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
      folder: process.env.CLOUDINARY_FOLDER || "enterprise",
    },
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER || "log") as "log" | "resend",
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "",
  },
};

/** Integration readiness — surfaced in Admin → Settings → System status. */
export function integrationStatus() {
  const c = env.storage.cloudinary;
  return [
    {
      name: "Database",
      configured: Boolean(process.env.DATABASE_URL),
      detail: "PostgreSQL via DATABASE_URL",
    },
    {
      name: "Application secret",
      configured: Boolean(process.env.APP_SECRET) && process.env.APP_SECRET !== "change-me-to-a-long-random-string",
      detail: "APP_SECRET — used to hash client IP addresses for rate limiting",
    },
    {
      name: "File storage",
      configured: env.storage.driver === "local" || Boolean(c.cloudName && c.apiKey && c.apiSecret),
      detail:
        env.storage.driver === "cloudinary"
          ? "Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)"
          : "Local disk (development or single-server only — set STORAGE_DRIVER=cloudinary for Vercel)",
    },
    {
      name: "Email delivery",
      configured: env.email.provider === "resend" && Boolean(env.email.resendApiKey && env.email.from),
      detail:
        env.email.provider === "resend"
          ? "Resend (RESEND_API_KEY, EMAIL_FROM)"
          : "Log only — notifications are recorded but not delivered. Set EMAIL_PROVIDER=resend.",
    },
    {
      name: "Public site URL",
      configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: "NEXT_PUBLIC_SITE_URL — canonical URLs, sitemap and email links",
    },
  ];
}

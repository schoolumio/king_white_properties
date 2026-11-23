import "server-only";
import { headers } from "next/headers";
import { hashIp } from "./crypto";

export async function clientContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return {
    ipHash: hashIp(ip),
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    referer: h.get("referer"),
  };
}

import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { env } from "./env";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** Non-reversible, salted hash of a client IP — never store raw IPs. */
export function hashIp(ip: string | null | undefined) {
  if (!ip) return null;
  return createHmac("sha256", env.appSecret).update(ip).digest("hex").slice(0, 32);
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function referenceSuffix(length = 5) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return out;
}

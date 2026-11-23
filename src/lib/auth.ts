import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { randomToken, sha256 } from "./crypto";
import type { PermissionKey } from "./permissions";

export const SESSION_COOKIE = "ent_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SESSION_REFRESH_MS = 1000 * 60 * 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function createSession(userId: string, meta: { ipHash: string | null; userAgent: string | null }) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt, ipHash: meta.ipHash, userAgent: meta.userAgent },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  position: string | null;
  role: { id: string; key: string; name: string };
  permissions: Set<PermissionKey>;
};

/** Resolves the signed-in staff user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;

  if (Date.now() - session.lastSeenAt.getTime() > SESSION_REFRESH_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    position: u.position,
    role: { id: u.role.id, key: u.role.key, name: u.role.name },
    permissions: new Set(u.role.permissions.map((rp) => rp.permission.key as PermissionKey)),
  };
});

export function can(user: CurrentUser | null, permission: PermissionKey | PermissionKey[]) {
  if (!user) return false;
  const list = Array.isArray(permission) ? permission : [permission];
  return list.some((p) => user.permissions.has(p));
}

/** Use in admin pages/layouts. Redirects when not authenticated or not permitted. */
export async function requireUser(permission?: PermissionKey | PermissionKey[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user, permission)) redirect("/admin?denied=1");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
  }
}

/** Use in server actions — throws rather than redirecting. */
export async function authorize(permission: PermissionKey | PermissionKey[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Your session has expired. Please sign in again.");
  if (!can(user, permission)) throw new AuthorizationError();
  return user;
}

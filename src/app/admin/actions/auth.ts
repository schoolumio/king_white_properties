"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize, createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { clientContext } from "@/lib/request";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "./types";

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

// Constant-time-ish failure path: compare against a dummy hash when the user does not exist.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5Ff6cQZpHd7ZZ6bZ0eYB5yH6m1Jt4lK";

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email address and password." };
  const { email, password } = parsed.data;
  const ctx = await clientContext();

  const ipLimit = await rateLimit(`login-ip:${ctx.ipHash}`, 20, 900);
  const userLimit = await rateLimit(`login-user:${email}`, 8, 900);
  if (!ipLimit.ok || !userLimit.ok) return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) {
    await audit({ action: "auth.login_failed", summary: `Failed sign-in for ${email}` });
    return { error: "The email address or password is incorrect." };
  }

  await clearRateLimit(`login-user:${email}`);
  await createSession(user.id, ctx);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({ userId: user.id, action: "auth.login", summary: `${user.name} signed in` });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await audit({ userId: user.id, action: "auth.logout", summary: `${user.name} signed out` });
  await destroySession();
  redirect("/admin/login");
}

const pwSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(12, "Use at least 12 characters").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await authorize("dashboard.view");
  const parsed = pwSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) return { error: "Your current password is incorrect." };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  // Invalidate other sessions.
  const ctx = await clientContext();
  await db.session.deleteMany({ where: { userId: me.id } });
  await createSession(me.id, ctx);
  await audit({ userId: me.id, action: "auth.password_changed", summary: `${me.name} changed their password` });
  return { success: "Your password has been updated. Other sessions have been signed out." };
}

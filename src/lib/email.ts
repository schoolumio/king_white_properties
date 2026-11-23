import "server-only";
import type { NotificationStatus } from "@prisma/client";
import { db } from "./db";
import { env } from "./env";

export type EmailMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Provider-agnostic email delivery. Every attempt is written to NotificationLog
 * so administrators can audit what was (or was not) delivered.
 */
export async function sendEmail(message: EmailMessage, meta: { enquiryId?: string } = {}) {
  const recipients = Array.from(new Set(message.to.map((r) => r.trim().toLowerCase()).filter(Boolean)));
  if (recipients.length === 0) return;

  let status: NotificationStatus = "LOGGED";
  let error: string | null = null;
  const provider = env.email.provider;

  if (provider === "resend") {
    if (!env.email.resendApiKey || !env.email.from) {
      status = "SKIPPED";
      error = "Resend selected but RESEND_API_KEY or EMAIL_FROM is not configured.";
    } else {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.email.resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: env.email.from,
            to: recipients,
            subject: message.subject,
            html: message.html,
            text: message.text,
            reply_to: message.replyTo,
          }),
        });
        if (res.ok) status = "SENT";
        else {
          status = "FAILED";
          error = `Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`;
        }
      } catch (err) {
        status = "FAILED";
        error = err instanceof Error ? err.message : String(err);
      }
    }
  } else {
    console.info(`[email:log] → ${recipients.join(", ")} | ${message.subject}`);
  }

  await db.notificationLog
    .createMany({
      data: recipients.map((recipient) => ({
        enquiryId: meta.enquiryId,
        provider,
        recipient,
        subject: message.subject.slice(0, 250),
        status,
        error,
      })),
    })
    .catch((e) => console.error("[email] could not write notification log", e));

  return status;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal, client-safe transactional layout. */
export function renderEmail(opts: { company: string; heading: string; intro: string; rows?: [string, string][]; ctaLabel?: string; ctaUrl?: string; footer?: string }) {
  const rows = (opts.rows ?? []).filter(([, v]) => v);
  const html = `<!doctype html><html><body style="margin:0;background:#F2F6F3;font-family:Helvetica,Arial,sans-serif;color:#13241D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
<tr><td style="background:#0F3D2E;padding:24px 32px;color:#ffffff;font-size:13px;letter-spacing:3px;text-transform:uppercase;border-bottom:3px solid #4CB87A">${esc(opts.company)}</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#0F3D2E">${esc(opts.heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#43514a">${esc(opts.intro)}</p>
${
  rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dfe7e2">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 0;border-bottom:1px solid #dfe7e2;font-size:12px;color:#66766E;text-transform:uppercase;letter-spacing:1px;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #dfe7e2;font-size:14px;color:#13241D;white-space:pre-wrap">${esc(v)}</td></tr>`,
        )
        .join("")}</table>`
    : ""
}
${opts.ctaUrl ? `<p style="margin:28px 0 0"><a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#0F3D2E;color:#ffffff;text-decoration:none;padding:12px 22px;font-size:14px">${esc(opts.ctaLabel ?? "Open")}</a></p>` : ""}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #dfe7e2;font-size:12px;color:#66766E">${esc(opts.footer ?? opts.company)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [opts.heading, "", opts.intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), opts.ctaUrl ? `\n${opts.ctaLabel ?? "Open"}: ${opts.ctaUrl}` : ""].join("\n");
  return { html, text };
}

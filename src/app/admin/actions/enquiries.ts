"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EnquiryPriority, EnquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { authorize, can } from "@/lib/auth";
import { canViewEnquiry } from "@/lib/enquiry-access";
import { ENQUIRY_STATUSES, PRIORITIES } from "@/lib/enquiry-meta";
import { handleActionError } from "@/lib/admin-form";
import { getSite } from "@/lib/content";
import { env } from "@/lib/env";
import { renderEmail, sendEmail } from "@/lib/email";
import type { ActionState } from "./types";

const STATUS_VALUES = ENQUIRY_STATUSES.map((s) => s.value) as [EnquiryStatus, ...EnquiryStatus[]];
const PRIORITY_VALUES = PRIORITIES.map((p) => p.value) as [EnquiryPriority, ...EnquiryPriority[]];

export async function updateEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await authorize("enquiry.update");
    const id = z.string().min(1).parse(formData.get("id"));
    const op = String(formData.get("op"));
    const enquiry = await db.enquiry.findUnique({ where: { id }, include: { assignedTo: true } });
    if (!enquiry || !canViewEnquiry(user, enquiry)) return { error: "Enquiry not found." };

    if (op === "status") {
      const status = z.enum(STATUS_VALUES).parse(formData.get("status"));
      if (status === enquiry.status) return { success: "No change." };
      await db.$transaction([
        db.enquiry.update({ where: { id }, data: { status, lastActivityAt: new Date() } }),
        db.enquiryActivity.create({ data: { enquiryId: id, type: "STATUS_CHANGED", fromValue: enquiry.status, toValue: status, userId: user.id } }),
      ]);
      await audit({ userId: user.id, action: "enquiry.status", entityType: "Enquiry", entityId: id, summary: `${enquiry.reference}: status ${enquiry.status} → ${status}` });
    } else if (op === "priority") {
      const priority = z.enum(PRIORITY_VALUES).parse(formData.get("priority"));
      if (priority === enquiry.priority) return { success: "No change." };
      await db.$transaction([
        db.enquiry.update({ where: { id }, data: { priority, lastActivityAt: new Date() } }),
        db.enquiryActivity.create({ data: { enquiryId: id, type: "PRIORITY_CHANGED", fromValue: enquiry.priority, toValue: priority, userId: user.id } }),
      ]);
      await audit({ userId: user.id, action: "enquiry.priority", entityType: "Enquiry", entityId: id, summary: `${enquiry.reference}: priority → ${priority}` });
    } else if (op === "assign") {
      if (!can(user, "enquiry.assign")) return { error: "You do not have permission to assign enquiries." };
      const assigneeId = String(formData.get("assigneeId") ?? "") || null;
      if (assigneeId === enquiry.assignedToId) return { success: "No change." };
      const assignee = assigneeId ? await db.user.findFirst({ where: { id: assigneeId, active: true } }) : null;
      if (assigneeId && !assignee) return { error: "Selected staff member is not available." };
      await db.$transaction([
        db.enquiryAssignment.updateMany({ where: { enquiryId: id, endedAt: null }, data: { endedAt: new Date() } }),
        ...(assignee ? [db.enquiryAssignment.create({ data: { enquiryId: id, userId: assignee.id, assignedById: user.id } })] : []),
        db.enquiry.update({ where: { id }, data: { assignedToId: assignee?.id ?? null, lastActivityAt: new Date() } }),
        db.enquiryActivity.create({
          data: {
            enquiryId: id,
            type: assignee ? "ASSIGNED" : "UNASSIGNED",
            fromValue: enquiry.assignedTo?.name ?? null,
            toValue: assignee?.name ?? null,
            userId: user.id,
          },
        }),
      ]);
      await audit({ userId: user.id, action: "enquiry.assign", entityType: "Enquiry", entityId: id, summary: `${enquiry.reference}: assigned to ${assignee?.name ?? "nobody"}` });
      if (assignee && assignee.id !== user.id) {
        const site = await getSite();
        const { html, text } = renderEmail({
          company: site.companyName,
          heading: `Enquiry ${enquiry.reference} has been assigned to you`,
          intro: `${user.name} assigned this enquiry to you for follow-up.`,
          rows: [
            ["Contact", enquiry.name],
            ["Organisation", enquiry.organisation ?? ""],
            ["Subject", enquiry.subject ?? ""],
          ],
          ctaLabel: "Open enquiry",
          ctaUrl: `${env.siteUrl}/admin/enquiries/${id}`,
        });
        await sendEmail({ to: [assignee.email], subject: `[${enquiry.reference}] Assigned to you`, html, text }, { enquiryId: id });
      }
    } else if (op === "note") {
      const note = z.string().trim().min(1, "Write a note first").max(5000).parse(formData.get("note"));
      await db.$transaction([
        db.enquiryActivity.create({ data: { enquiryId: id, type: "NOTE", message: note, userId: user.id } }),
        db.enquiry.update({ where: { id }, data: { lastActivityAt: new Date() } }),
      ]);
    } else {
      return { error: "Unknown operation." };
    }
    revalidatePath(`/admin/enquiries/${id}`);
    revalidatePath("/admin/enquiries");
    return { success: op === "note" ? "Note added." : "Enquiry updated." };
  } catch (err) {
    return handleActionError(err);
  }
}

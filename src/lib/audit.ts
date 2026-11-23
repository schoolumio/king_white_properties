import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { clientContext } from "./request";

export async function audit(entry: {
  userId?: string | null;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    const { ipHash } = await clientContext();
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        summary: entry.summary,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ipHash,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record entry", err);
  }
}

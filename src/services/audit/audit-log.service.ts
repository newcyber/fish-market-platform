import { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditDatabase = Prisma.TransactionClient | PrismaClient;

export interface CreateAuditLogInput {
  eventType: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  actorType?: string;
  actorId?: string | null;
  beforeData?: Prisma.InputJsonValue | null;
  afterData?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Immutable audit record writer.
 *
 * Critical state changes must pass the active transaction client so
 * the audit row commits or rolls back with the business mutation.
 */
export async function createAuditLog(
  input: CreateAuditLogInput,
  db: AuditDatabase = prisma,
) {
  return db.auditLog.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      actorType: input.actorType ?? "SYSTEM",
      actorId: input.actorId ?? null,
      beforeData: input.beforeData ?? undefined,
      afterData: input.afterData ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });
}

export default { createAuditLog };

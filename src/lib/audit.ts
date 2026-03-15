import { UserRole, type Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export async function logAudit(input: {
  tx?: Prisma.TransactionClient;
  businessId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  const client = input.tx ?? db;
  return client.auditLog.create({
    data: {
      businessId: input.businessId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null
    }
  });
}

export function shouldRequireDiscountApproval(role: UserRole, lineDiscountPercent: number) {
  if (role === "owner" || role === "manager") {
    return false;
  }
  return lineDiscountPercent > 10;
}

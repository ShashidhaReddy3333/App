import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";

export async function getDefaultLocation(businessId: string) {
  const location = await db.location.findFirst({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "asc" }
  });

  if (!location) {
    throw notFoundError("Active location not found.");
  }

  return location;
}

export async function findIdempotentResult(businessId: string, operation: string, key: string) {
  return db.idempotencyKey.findUnique({
    where: {
      businessId_operation_key: {
        businessId,
        operation,
        key
      }
    }
  });
}

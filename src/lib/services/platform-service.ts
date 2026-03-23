import { Prisma } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { db, withSerializableRetry } from "@/lib/db";
import { env } from "@/lib/env";
import { conflictError, notFoundError } from "@/lib/errors";
import { getRedisClient, isRedisAvailable } from "@/lib/queue/redis";

export type PlatformSystemHealthCheck = {
  label: "Database" | "API Server" | "Job Queue";
  status: "healthy" | "error" | "degraded";
  detail: string;
};

export async function getDefaultLocation(businessId: string) {
  return resolveBusinessLocation(businessId);
}

export async function listBusinessLocations(
  businessId: string,
  options?: { includeInactive?: boolean }
) {
  return db.location.findMany({
    where: {
      businessId,
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
}

export async function resolveBusinessLocation(businessId: string, locationId?: string | null) {
  const location = locationId
    ? await db.location.findFirst({
        where: { id: locationId, businessId, isActive: true },
      })
    : await db.location.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: "asc" },
      });

  if (!location) {
    throw notFoundError("Active location not found.");
  }

  return location;
}

export async function createBusinessLocation(
  actorUserId: string,
  businessId: string,
  input: {
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    provinceOrState: string;
    postalCode: string;
    country: string;
    timezone?: string | null;
  }
) {
  return db.$transaction(async (tx) => {
    const location = await tx.location.create({
      data: {
        businessId,
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        provinceOrState: input.provinceOrState,
        postalCode: input.postalCode,
        country: input.country,
        timezone: input.timezone || null,
      },
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "location_created",
      resourceType: "location",
      resourceId: location.id,
      metadata: { locationName: location.name },
    });

    return location;
  });
}

export async function updateBusinessLocation(
  actorUserId: string,
  businessId: string,
  input: {
    locationId: string;
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    provinceOrState: string;
    postalCode: string;
    country: string;
    timezone?: string | null;
    isActive?: boolean;
  }
) {
  return withSerializableRetry(async (tx) => {
    const location = await tx.location.findFirst({
      where: { id: input.locationId, businessId },
    });

    if (!location) {
      throw notFoundError("Location not found for this business.");
    }

    if (input.isActive === false && location.isActive) {
      const activeCount = await tx.location.count({
        where: { businessId, isActive: true },
      });

      if (activeCount <= 1) {
        throw conflictError("At least one active location is required.");
      }
    }

    const updated = await tx.location.update({
      where: { id: input.locationId },
      data: {
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        provinceOrState: input.provinceOrState,
        postalCode: input.postalCode,
        country: input.country,
        timezone: input.timezone || null,
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      },
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "location_updated",
      resourceType: "location",
      resourceId: updated.id,
      metadata: {
        locationName: updated.name,
        isActive: updated.isActive,
      } satisfies Prisma.InputJsonValue,
    });

    return updated;
  });
}

export async function findIdempotentResult(businessId: string, operation: string, key: string) {
  return db.idempotencyKey.findUnique({
    where: {
      businessId_operation_key: {
        businessId,
        operation,
        key,
      },
    },
  });
}

export async function getPlatformMetrics() {
  const [totalBusinesses, activeBusinesses, totalUsers, totalOrders, revenueResult] =
    await Promise.all([
      db.business.count(),
      db.business.count({ where: { isActive: true } }),
      db.user.count(),
      db.order.count(),
      db.order.aggregate({
        where: { status: "completed" },
        _sum: { totalAmount: true },
      }),
    ]);

  return {
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    totalOrders,
    gmv: Number(revenueResult._sum.totalAmount ?? 0),
  };
}

export async function getPlatformSystemHealth(): Promise<PlatformSystemHealthCheck[]> {
  const [database, apiServer, jobQueue] = await Promise.all([
    checkDatabaseHealth(),
    checkApiHealth(),
    checkJobQueueHealth(),
  ]);

  return [database, apiServer, jobQueue];
}

export async function listPlatformBusinesses(options?: { page?: number; limit?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 25), 100);
  const skip = (page - 1) * limit;

  const [businesses, total] = await Promise.all([
    db.business.findMany({
      include: {
        owner: { select: { email: true, fullName: true } },
        businessProfile: { select: { slug: true, isFeatured: true, averageRating: true } },
        businessVerification: { select: { status: true } },
        stripeAccount: { select: { onboardingStatus: true, chargesEnabled: true } },
        _count: { select: { orders: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.business.count(),
  ]);

  return {
    businesses,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listPlatformApprovalBusinesses() {
  return db.business.findMany({
    where: { isActive: true },
    select: {
      id: true,
      businessName: true,
      primaryCountry: true,
      businessType: true,
    },
    orderBy: [{ businessName: "asc" }],
  });
}

async function checkDatabaseHealth(): Promise<PlatformSystemHealthCheck> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { label: "Database", status: "healthy", detail: "Database query succeeded." };
  } catch (error) {
    return {
      label: "Database",
      status: "error",
      detail: error instanceof Error ? error.message : "Database query failed.",
    };
  }
}

async function checkApiHealth(): Promise<PlatformSystemHealthCheck> {
  try {
    const response = await fetch(new URL("/api/health", env.APP_URL), {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        label: "API Server",
        status: "error",
        detail: `Health endpoint returned ${response.status}.`,
      };
    }

    return {
      label: "API Server",
      status: "healthy",
      detail: "Health endpoint responded successfully.",
    };
  } catch (error) {
    return {
      label: "API Server",
      status: "error",
      detail: error instanceof Error ? error.message : "Health endpoint request failed.",
    };
  }
}

async function checkJobQueueHealth(): Promise<PlatformSystemHealthCheck> {
  if (!isRedisAvailable()) {
    return {
      label: "Job Queue",
      status: "degraded",
      detail: "Redis is not configured; queue processing is running in degraded mode.",
    };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      return {
        label: "Job Queue",
        status: "error",
        detail: "Redis client could not be created.",
      };
    }

    await redis.ping();
    return {
      label: "Job Queue",
      status: "healthy",
      detail: "Redis responded to ping.",
    };
  } catch (error) {
    return {
      label: "Job Queue",
      status: "error",
      detail: error instanceof Error ? error.message : "Redis ping failed.",
    };
  }
}

export async function listPlatformUsers(options?: { page?: number; limit?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 100), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({
      include: {
        business: { select: { businessName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listPlatformDisputes(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 100), 100);
  const skip = (page - 1) * limit;
  const where = options?.status && options.status !== "all" ? { status: options.status } : {};

  const [disputes, total] = await Promise.all([
    db.platformDispute.findMany({
      where,
      include: {
        business: { select: { businessName: true } },
        customer: { select: { fullName: true, email: true } },
        assignedAdmin: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.platformDispute.count({ where }),
  ]);

  return {
    disputes,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function listPlatformAnnouncements(options?: { page?: number; limit?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 10), 100);
  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    db.platformAnnouncement.findMany({
      include: {
        author: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.platformAnnouncement.count(),
  ]);

  return {
    announcements,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

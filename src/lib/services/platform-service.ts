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

export async function getPlatformMetrics() {
  const [
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    totalOrders,
    revenueResult
  ] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { isActive: true } }),
    db.user.count(),
    db.order.count(),
    db.order.aggregate({
      where: { status: "completed" },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    totalOrders,
    gmv: Number(revenueResult._sum.totalAmount ?? 0)
  };
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
        _count: { select: { orders: true, users: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    db.business.count()
  ]);

  return {
    businesses,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function listPlatformUsers(options?: { page?: number; limit?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 100), 100);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    db.user.findMany({
      include: {
        business: { select: { businessName: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    db.user.count()
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function listPlatformDisputes(options?: { status?: string; limit?: number }) {
  const limit = Math.min(Math.max(1, options?.limit ?? 100), 100);
  const where = options?.status && options.status !== "all" ? { status: options.status } : {};

  return db.platformDispute.findMany({
    where,
    include: {
      business: { select: { businessName: true } },
      customer: { select: { fullName: true, email: true } },
      assignedAdmin: { select: { fullName: true } }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function listPlatformAnnouncements(options?: { page?: number; limit?: number }) {
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(Math.max(1, options?.limit ?? 10), 100);
  const skip = (page - 1) * limit;

  const [announcements, total] = await Promise.all([
    db.platformAnnouncement.findMany({
      include: {
        author: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    db.platformAnnouncement.count()
  ]);

  return {
    announcements,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

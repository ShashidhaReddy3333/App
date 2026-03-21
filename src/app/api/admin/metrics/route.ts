import { apiError, apiSuccess } from "@/lib/http";
import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdminAccess();

    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalOrders,
      revenueResult,
      pendingVerifications,
      openDisputes,
    ] = await Promise.all([
      db.business.count(),
      db.business.count({ where: { isActive: true } }),
      db.user.count(),
      db.order.count(),
      db.order.aggregate({
        where: { status: "completed" },
        _sum: { totalAmount: true },
      }),
      db.businessVerification.count({ where: { status: "pending" } }),
      db.platformDispute.count({ where: { status: "open" } }),
    ]);

    return apiSuccess({
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalOrders,
      gmv: Number(revenueResult._sum.totalAmount ?? 0),
      pendingVerifications,
      openDisputes,
    });
  } catch (error) {
    return apiError(error);
  }
}

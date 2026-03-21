import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { notFoundError } from "@/lib/errors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdminAccess();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        include: {
          owner: { select: { email: true, fullName: true } },
          businessProfile: { select: { slug: true, isFeatured: true } },
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

    return apiSuccess({ businesses, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}

const updateBusinessSchema = z.object({
  businessId: z.string(),
  isActive: z.boolean().optional(),
  isMarketplaceVisible: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requirePlatformAdminAccess();

    const body = await req.json();
    const { businessId, ...data } = updateBusinessSchema.parse(body);

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) throw notFoundError("Business not found.");

    const updated = await db.business.update({
      where: { id: businessId },
      data,
    });

    return apiSuccess({ business: updated });
  } catch (error) {
    return apiError(error);
  }
}

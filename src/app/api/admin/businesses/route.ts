import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { notFoundError, validationError } from "@/lib/errors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdminAccess(req);

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
  verify: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requirePlatformAdminAccess(req);

    const body = await req.json();
    const { businessId, ...data } = updateBusinessSchema.parse(body);

    if (data.isActive === undefined && data.isMarketplaceVisible === undefined && !data.verify) {
      throw validationError("No business update action was provided.");
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: { businessVerification: true },
    });
    if (!business) throw notFoundError("Business not found.");

    const updated = await db.$transaction(async (tx) => {
      if (data.verify) {
        await tx.businessVerification.upsert({
          where: { businessId },
          update: {
            status: "approved",
            reviewedAt: new Date(),
            reviewedByAdminId: session.user.id,
            submittedAt: business.businessVerification?.submittedAt ?? new Date(),
          },
          create: {
            businessId,
            status: "approved",
            submittedAt: new Date(),
            reviewedAt: new Date(),
            reviewedByAdminId: session.user.id,
          },
        });
      }

      const businessUpdate: Record<string, boolean> = {};
      if (data.isActive !== undefined) {
        businessUpdate.isActive = data.isActive;
      }
      if (data.isMarketplaceVisible !== undefined) {
        businessUpdate.isMarketplaceVisible = data.isMarketplaceVisible;
      }

      if (Object.keys(businessUpdate).length > 0) {
        await tx.business.update({
          where: { id: businessId },
          data: businessUpdate,
        });
      }

      return tx.business.findUnique({
        where: { id: businessId },
        include: {
          businessVerification: { select: { status: true } },
        },
      });
    });

    return apiSuccess({ business: updated });
  } catch (error) {
    return apiError(error);
  }
}

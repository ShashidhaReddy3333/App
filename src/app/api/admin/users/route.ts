import { UserRole, UserStatus } from "@prisma/client";
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
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const role = searchParams.get("role") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          businessId: true,
          business: { select: { businessName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return apiSuccess({ users, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export async function PATCH(req: Request) {
  try {
    await requirePlatformAdminAccess(req);

    const body = await req.json();
    const { userId, ...data } = updateUserSchema.parse(body);

    if (data.status === undefined && data.role === undefined) {
      throw validationError("No user update action was provided.");
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw notFoundError("User not found.");

    const updated = await db.user.update({
      where: { id: userId },
      data,
    });

    return apiSuccess({ user: updated });
  } catch (error) {
    return apiError(error);
  }
}

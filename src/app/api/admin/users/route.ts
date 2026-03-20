import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/http";
import { getCurrentSession } from "@/lib/auth/session";
import { forbiddenError, notFoundError, unauthorizedError } from "@/lib/errors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) throw unauthorizedError();
  if (session.user.role !== "platform_admin") throw forbiddenError();
  return session;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

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
  status: z.enum(["active", "suspended", "invited"]).optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { userId, ...data } = updateUserSchema.parse(body);

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

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
    const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
    const status = searchParams.get("status") ?? undefined;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;

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

    return apiSuccess({ disputes, total, page, limit });
  } catch (error) {
    return apiError(error);
  }
}

const createDisputeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.string().min(1),
  businessId: z.string().optional(),
  customerId: z.string().optional(),
  orderId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const data = createDisputeSchema.parse(body);

    const dispute = await db.platformDispute.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        assignedAdminId: session.user.id,
      },
    });

    return apiSuccess({ dispute }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

const updateDisputeSchema = z.object({
  disputeId: z.string(),
  status: z.string().optional(),
  resolution: z.string().optional(),
  assignedAdminId: z.string().optional(),
});

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { disputeId, ...data } = updateDisputeSchema.parse(body);

    const dispute = await db.platformDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw notFoundError("Dispute not found.");

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "resolved" && !dispute.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await db.platformDispute.update({
      where: { id: disputeId },
      data: updateData,
    });

    return apiSuccess({ dispute: updated });
  } catch (error) {
    return apiError(error);
  }
}

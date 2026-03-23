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
    const session = await requirePlatformAdminAccess(req);
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
  assignToMe: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requirePlatformAdminAccess(req);
    const body = await req.json();
    const { disputeId, ...data } = updateDisputeSchema.parse(body);

    const dispute = await db.platformDispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw notFoundError("Dispute not found.");

    if (
      !data.assignToMe &&
      data.status === undefined &&
      data.resolution === undefined &&
      data.assignedAdminId === undefined
    ) {
      throw validationError("No dispute update action was provided.");
    }

    const updateData: Record<string, unknown> = { ...data };
    delete updateData.assignToMe;

    if (data.assignToMe) {
      updateData.assignedAdminId = session.user.id;
      if (dispute.status === "open" && data.status === undefined) {
        updateData.status = "in_review";
      }
    }

    if (data.status === "resolved" && !data.resolution?.trim() && !dispute.resolution) {
      throw validationError("Resolution notes are required when resolving a dispute.");
    }

    if (data.status === "resolved" && !dispute.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (data.status && data.status !== "resolved") {
      updateData.resolvedAt = null;
    }
    if (data.resolution !== undefined) {
      updateData.resolution = data.resolution.trim() || null;
    }

    const updated = await db.$transaction(async (tx) => {
      const nextDispute = await tx.platformDispute.update({
        where: { id: disputeId },
        data: updateData,
      });

      const timelineEntries: Array<{
        eventType: string;
        visibility: "internal" | "external";
        body: string;
      }> = [];

      if (data.assignToMe && dispute.assignedAdminId !== session.user.id) {
        timelineEntries.push({
          eventType: "assignment",
          visibility: "internal",
          body: `${session.user.fullName} assigned this dispute to themselves.`,
        });
      }

      if (data.status && data.status !== dispute.status) {
        timelineEntries.push({
          eventType: "status_change",
          visibility: "internal",
          body: `Status changed from ${dispute.status} to ${data.status}.`,
        });
      }

      if (data.resolution !== undefined && data.resolution.trim()) {
        timelineEntries.push({
          eventType: "resolution",
          visibility: "internal",
          body: `Resolution updated: ${data.resolution.trim()}`,
        });
      }

      for (const entry of timelineEntries) {
        await tx.platformDisputeEvent.create({
          data: {
            disputeId,
            authorUserId: session.user.id,
            eventType: entry.eventType,
            visibility: entry.visibility,
            body: entry.body,
          },
        });
      }

      return nextDispute;
    });

    return apiSuccess({ dispute: updated });
  } catch (error) {
    return apiError(error);
  }
}

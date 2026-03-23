import { requirePlatformAdminAccess } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";
import { disputeEventSchema } from "@/lib/schemas/platform";
import { enqueueNotification } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    await requirePlatformAdminAccess(request);
    const { disputeId } = await params;
    const events = await db.platformDisputeEvent.findMany({
      where: { disputeId },
      include: {
        authorUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return apiSuccess({ events });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const session = await requirePlatformAdminAccess(request);
    const { disputeId } = await params;
    const payload = disputeEventSchema.parse(await request.json());

    const dispute = await db.platformDispute.findUnique({
      where: { id: disputeId },
      include: {
        business: {
          select: {
            ownerId: true,
          },
        },
      },
    });
    if (!dispute) {
      throw notFoundError("Dispute not found.");
    }

    const body = payload.body.trim();
    const event = await db.$transaction(async (tx) => {
      const createdEvent = await tx.platformDisputeEvent.create({
        data: {
          disputeId,
          authorUserId: session.user.id,
          eventType: payload.eventType,
          visibility: payload.visibility,
          body,
        },
        include: {
          authorUser: { select: { id: true, fullName: true, email: true } },
        },
      });

      if (payload.visibility === "external") {
        const recipientIds = new Set<string>();
        if (dispute.customerId) {
          recipientIds.add(dispute.customerId);
        }
        if (dispute.business?.ownerId) {
          recipientIds.add(dispute.business.ownerId);
        }

        for (const userId of recipientIds) {
          await enqueueNotification(tx, {
            userId,
            type: "platform_dispute_update",
            title: `Update on dispute: ${dispute.title}`,
            message: body,
            channel: "email",
          });
        }
      }

      return createdEvent;
    });

    return apiSuccess({ event }, { status: 201, message: "Dispute note added." });
  } catch (error) {
    return apiError(error);
  }
}

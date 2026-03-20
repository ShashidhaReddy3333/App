import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { session } = await requireApiAccess("sales", { request });
    const { notificationId } = await params;

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      throw notFoundError("Notification not found.");
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: {
        status: "read",
        readAt: new Date(),
      },
    });

    return apiSuccess({ notification: updated }, { message: "Notification marked as read." });
  } catch (error) {
    return apiError(error);
  }
}

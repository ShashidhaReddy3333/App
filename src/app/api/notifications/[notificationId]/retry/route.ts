import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { retryFailedNotification } from "@/lib/services/operations-command-service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("owner_dashboard");
    const { notificationId } = await params;
    const notification = await retryFailedNotification(session.user.id, businessId, notificationId);
    return apiSuccess({ notification }, { message: "Notification requeued." });
  } catch (error) {
    return apiError(error);
  }
}

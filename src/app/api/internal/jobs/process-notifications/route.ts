import { apiError, apiSuccess } from "@/lib/http";
import { assertInternalJobAuthorized } from "@/lib/internal-jobs";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { dispatchQueuedNotifications } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const context = getRequestContext(request);

  try {
    assertInternalJobAuthorized(request);
    const summary = await dispatchQueuedNotifications();

    logEvent("info", "process_notifications_job_succeeded", {
      requestId: context.requestId,
      route: "/api/internal/jobs/process-notifications",
      ...summary
    });

    return apiSuccess(summary, { message: "Queued notifications processed." });
  } catch (error) {
    logError("process_notifications_job_failed", error, {
      requestId: context.requestId,
      route: "/api/internal/jobs/process-notifications"
    });
    return apiError(error);
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

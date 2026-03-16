import { apiError, apiSuccess } from "@/lib/http";
import { assertInternalJobAuthorized } from "@/lib/internal-jobs";
import { captureMonitoringMessage } from "@/lib/monitoring/sentry";
import { getRequestContext, logError, logEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const context = getRequestContext(request);

  try {
    assertInternalJobAuthorized(request);
    const eventId = await captureMonitoringMessage("manual_monitoring_test", {
      requestId: context.requestId,
      route: "/api/internal/monitoring/test"
    });

    logEvent("info", "manual_monitoring_test_sent", {
      requestId: context.requestId,
      route: "/api/internal/monitoring/test",
      sentryEventId: eventId
    });

    return apiSuccess({ eventId }, { message: "Monitoring test event sent." });
  } catch (error) {
    logError("manual_monitoring_test_failed", error, {
      requestId: context.requestId,
      route: "/api/internal/monitoring/test"
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

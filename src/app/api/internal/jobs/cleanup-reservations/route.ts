import { apiError, apiSuccess } from "@/lib/http";
import { assertInternalJobAuthorized } from "@/lib/internal-jobs";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { cleanupExpiredReservations } from "@/lib/services/sales-service";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const context = getRequestContext(request);

  try {
    assertInternalJobAuthorized(request);
    const summary = await cleanupExpiredReservations();

    logEvent("info", "cleanup_reservations_job_succeeded", {
      requestId: context.requestId,
      route: "/api/internal/jobs/cleanup-reservations",
      ...summary,
    });

    return apiSuccess(summary, { message: "Expired reservations cleaned up." });
  } catch (error) {
    logError("cleanup_reservations_job_failed", error, {
      requestId: context.requestId,
      route: "/api/internal/jobs/cleanup-reservations",
    });
    return apiError(error);
  }
}

// GET is kept for Vercel Cron compatibility — Vercel sends GET requests to cron endpoints
export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

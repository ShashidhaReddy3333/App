import { apiError, apiSuccess } from "@/lib/http";
import { assertInternalJobAuthorized } from "@/lib/internal-jobs";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { cleanupOperationalData } from "@/lib/services/operations-command-service";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const context = getRequestContext(request);

  try {
    assertInternalJobAuthorized(request);
    const summary = await cleanupOperationalData();

    logEvent("info", "maintenance_cleanup_job_succeeded", {
      requestId: context.requestId,
      route: "/api/internal/jobs/maintenance-cleanup",
      ...summary,
    });

    return apiSuccess(summary, { message: "Operational maintenance cleanup completed." });
  } catch (error) {
    logError("maintenance_cleanup_job_failed", error, {
      requestId: context.requestId,
      route: "/api/internal/jobs/maintenance-cleanup",
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

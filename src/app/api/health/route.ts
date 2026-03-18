import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/http";
import { logError, logEvent, getRequestContext } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await db.$queryRaw`SELECT 1`;
    const context = getRequestContext(request);
    logEvent("info", "health_check_passed", {
      requestId: context.requestId,
      route: "/api/health",
    });

    return apiSuccess(
      {
        ok: true,
        timestamp: new Date().toISOString(),
      },
      { message: "Healthy" }
    );
  } catch (error) {
    const context = getRequestContext(request);
    logError("health_check_failed", error, {
      requestId: context.requestId,
      route: "/api/health",
    });
    return apiError(error);
  }
}

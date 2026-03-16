import { db } from "@/lib/db";
import { env, getRuntimeCheckIssues } from "@/lib/env";
import { apiError, apiSuccess } from "@/lib/http";
import { logError, logEvent, getRequestContext } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await db.$queryRaw`SELECT 1`;
    const runtimeIssues = getRuntimeCheckIssues();
    const context = getRequestContext(request);
    logEvent("info", "health_check_passed", {
      requestId: context.requestId,
      route: "/api/health"
    });

    return apiSuccess(
      {
        ok: true,
        database: "reachable",
        appUrl: env.APP_URL,
        mode: env.NODE_ENV,
        demoMode: env.DEMO_MODE === "true",
        emailDeliveryConfigured: env.DEMO_MODE === "true" ? true : runtimeIssues.every((issue) => issue.key !== "RESEND_API_KEY" && issue.key !== "MAIL_FROM"),
        runtimeIssues
      },
      { message: "Application and database are healthy." }
    );
  } catch (error) {
    const context = getRequestContext(request);
    logError("health_check_failed", error, {
      requestId: context.requestId,
      route: "/api/health"
    });
    return apiError(error);
  }
}

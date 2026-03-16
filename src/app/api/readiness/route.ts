import { AppError } from "@/lib/errors";
import { db } from "@/lib/db";
import { getRuntimeCheckIssues } from "@/lib/env";
import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext, logError, logEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = getRequestContext(request);

  try {
    await db.$queryRaw`SELECT 1`;
    const issues = getRuntimeCheckIssues();
    const blockingIssues = issues.filter((issue) => issue.severity === "error");

    if (blockingIssues.length > 0) {
      throw new AppError("Application is not ready for traffic.", {
        status: 503,
        code: "UNEXPECTED_ERROR",
        issues: {
          runtimeIssues: blockingIssues
        }
      });
    }

    logEvent("info", "readiness_check_passed", {
      requestId: context.requestId,
      route: "/api/readiness"
    });

    return apiSuccess(
      {
        ok: true,
        runtimeIssues: issues
      },
      { message: "Application is ready for traffic." }
    );
  } catch (error) {
    logError("readiness_check_failed", error, {
      requestId: context.requestId,
      route: "/api/readiness"
    });
    return apiError(error);
  }
}

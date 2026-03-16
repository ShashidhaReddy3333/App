import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/http";
import { captureClientException } from "@/lib/monitoring/sentry";
import { getRequestContext, logError, logEvent } from "@/lib/observability";

const clientErrorSchema = z.object({
  message: z.string().min(1),
  stack: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);

  try {
    const payload = clientErrorSchema.parse(await request.json());
    const eventId = await captureClientException({
      message: payload.message,
      stack: payload.stack ?? null,
      metadata: {
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        ...payload.metadata
      }
    });

    logEvent("warn", "client_runtime_error_reported", {
      requestId: context.requestId,
      route: "/api/internal/monitoring/client-error",
      sentryEventId: eventId
    });

    return apiSuccess({ eventId }, { status: 202, message: "Client error accepted." });
  } catch (error) {
    logError("client_runtime_error_report_failed", error, {
      requestId: context.requestId,
      route: "/api/internal/monitoring/client-error"
    });
    return apiError(error);
  }
}

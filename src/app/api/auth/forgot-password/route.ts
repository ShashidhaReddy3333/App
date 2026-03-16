import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { beginPasswordReset } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  try {
    const payload = await request.json();
    const result = await beginPasswordReset(payload, context.ipAddress);
    logEvent("info", "forgot_password_requested", {
      requestId: context.requestId,
      route: "/api/auth/forgot-password",
      ipAddress: context.ipAddress
    });
    return apiSuccess(result, { message: "If the account exists, reset instructions are available." });
  } catch (error) {
    logError("forgot_password_failed", error, {
      requestId: context.requestId,
      route: "/api/auth/forgot-password",
      ipAddress: context.ipAddress
    });
    return apiError(error);
  }
}

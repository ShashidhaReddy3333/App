import { logAudit } from "@/lib/audit";
import { getPostSignInPath } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { authenticateUser } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  try {
    const ipAddress = context.ipAddress;
    const payload = await request.json();
    const user = await authenticateUser(payload, ipAddress);
    const session = await createSession(user.id);
    if (user.businessId) {
      await logAudit({
        businessId: user.businessId,
        actorUserId: user.id,
        action: "login",
        resourceType: "session",
        resourceId: session.id,
        metadata: {},
        ipAddress
      });
    }
    logEvent("info", "sign_in_succeeded", {
      requestId: context.requestId,
      route: "/api/auth/sign-in",
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? null
    });
    return apiSuccess({ userId: user.id, redirectTo: getPostSignInPath(user.role) }, { message: "Signed in." });
  } catch (error) {
    logError("sign_in_failed", error, {
      requestId: context.requestId,
      route: "/api/auth/sign-in",
      ipAddress: context.ipAddress
    });
    return apiError(error);
  }
}

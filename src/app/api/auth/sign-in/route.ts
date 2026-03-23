import { logAudit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { validationError } from "@/lib/errors";
import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import {
  getPortalAbsoluteUrl,
  getPortalForRole,
  getPortalPostSignInPath,
  isRoleAllowedInPortal,
  normalizePortal,
} from "@/lib/portal";
import { authenticateUser } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  try {
    const ipAddress = context.ipAddress;
    const payload = await request.json();
    const requestedPortal = normalizePortal(
      payload && typeof payload === "object" && "portal" in payload ? String(payload.portal) : null
    );
    const hostPortal = normalizePortal(request.headers.get("x-portal"));
    const portal = hostPortal === "main" ? requestedPortal : hostPortal;
    const user = await authenticateUser(payload, ipAddress);
    const rolePortal = getPortalForRole(user.role);

    if (portal !== "main" && !isRoleAllowedInPortal(portal, user.role)) {
      throw validationError(
        `This account does not belong in the ${portal} portal. Use the ${rolePortal} portal instead.`
      );
    }

    const session = await createSession(user.id);
    if (user.businessId) {
      await logAudit({
        businessId: user.businessId,
        actorUserId: user.id,
        action: "login",
        resourceType: "session",
        resourceId: session.id,
        metadata: {},
        ipAddress,
      });
    }
    logEvent("info", "sign_in_succeeded", {
      requestId: context.requestId,
      route: "/api/auth/sign-in",
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? null,
      portal: portal === "main" ? rolePortal : portal,
    });
    const redirectPortal = portal === "main" ? rolePortal : portal;
    const redirectTo = getPortalAbsoluteUrl(
      redirectPortal,
      getPortalPostSignInPath(redirectPortal, user.role),
      request.headers.get("x-portal-origin") ?? new URL(request.url).origin
    );

    return apiSuccess({ userId: user.id, redirectTo }, { message: "Signed in." });
  } catch (error) {
    logError("sign_in_failed", error, {
      requestId: context.requestId,
      route: "/api/auth/sign-in",
      ipAddress: context.ipAddress,
    });
    return apiError(error);
  }
}

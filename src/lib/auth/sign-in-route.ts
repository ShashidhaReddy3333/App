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
  type Portal,
} from "@/lib/portal";
import { authenticateUser } from "@/lib/services/auth-service";

type SignInMode = {
  defaultPortal: Portal;
  allowRequestedPortal?: boolean;
};

export async function handleSignInRequest(request: Request, mode: SignInMode) {
  const context = getRequestContext(request);

  try {
    const ipAddress = context.ipAddress;
    const payload = await request.json();
    const requestedPortal = normalizePortal(
      payload && typeof payload === "object" && "portal" in payload ? String(payload.portal) : null
    );
    const hostPortal = normalizePortal(request.headers.get("x-portal"));
    const portal = mode.allowRequestedPortal
      ? hostPortal === "main"
        ? requestedPortal
        : hostPortal
      : mode.defaultPortal;
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

    const redirectPortal = portal === "main" ? rolePortal : portal;

    logEvent("info", "sign_in_succeeded", {
      requestId: context.requestId,
      route: new URL(request.url).pathname,
      userId: user.id,
      role: user.role,
      businessId: user.businessId ?? null,
      portal: redirectPortal,
    });

    const redirectTo = getPortalAbsoluteUrl(
      redirectPortal,
      getPortalPostSignInPath(redirectPortal, user.role),
      request.headers.get("x-portal-origin") ?? new URL(request.url).origin
    );

    return apiSuccess({ userId: user.id, redirectTo }, { message: "Signed in." });
  } catch (error) {
    logError("sign_in_failed", error, {
      requestId: context.requestId,
      route: new URL(request.url).pathname,
      ipAddress: context.ipAddress,
    });

    return apiError(error);
  }
}

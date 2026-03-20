import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext, logError, logEvent } from "@/lib/observability";
import { inviteStaff } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

const postHandler = async (request: Request) => {
  const context = getRequestContext(request);
  try {
    const { session } = await requireApiAccess("staff", { request });
    const payload = await request.json();
    const result = await inviteStaff(session.user.id, payload, context.ipAddress);
    logEvent("info", "staff_invite_requested", {
      requestId: context.requestId,
      route: "/api/staff/invite",
      actorUserId: session.user.id,
      businessId: session.user.businessId ?? null
    });
    return apiSuccess({ invite: result.invite, demoToken: result.token }, { status: 201, message: "Invite created." });
  } catch (error) {
    logError("staff_invite_failed", error, {
      requestId: context.requestId,
      route: "/api/staff/invite",
      ipAddress: context.ipAddress
    });
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60_000 });

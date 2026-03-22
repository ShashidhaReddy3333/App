import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { revokeOtherSessions } from "@/lib/services/management-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("sessions", { request });
    const result = await revokeOtherSessions(session.user.id, businessId, session.id);
    return apiSuccess(result, {
      message:
        result.count > 0 ? "Other sessions revoked." : "No other active sessions were found.",
    });
  } catch (error) {
    return apiError(error);
  }
}

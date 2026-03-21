import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { getRequestContext } from "@/lib/observability";
import { resendPendingInvite } from "@/lib/services/operations-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("staff", { request });
    const context = getRequestContext(request);
    const { inviteId } = await params;
    const result = await resendPendingInvite(session.user.id, businessId, inviteId, context.ipAddress);
    return apiSuccess(result, { message: "Invite resent." });
  } catch (error) {
    return apiError(error);
  }
}

import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { revokeSessionRecord } from "@/lib/services/management-command-service";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("sessions", { request: _request });
    const { sessionId } = await params;
    const revoked = await revokeSessionRecord(session.user.id, businessId, sessionId);
    return apiSuccess({ session: revoked }, { message: "Session revoked." });
  } catch (error) {
    return apiError(error);
  }
}

import { logAudit } from "@/lib/audit";
import { clearSession, getCurrentSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (session?.user.businessId) {
      await logAudit({
        businessId: session.user.businessId,
        actorUserId: session.user.id,
        action: "logout",
        resourceType: "session",
        resourceId: session.id,
        metadata: {}
      });
    }
    await clearSession();
    return apiSuccess({ success: true }, { message: "Signed out." });
  } catch (error) {
    return apiError(error);
  }
}

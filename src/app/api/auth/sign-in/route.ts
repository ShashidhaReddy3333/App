import { logAudit } from "@/lib/audit";
import { createSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";
import { authenticateUser } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
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
    return apiSuccess({ userId: user.id }, { message: "Signed in." });
  } catch (error) {
    return apiError(error);
  }
}

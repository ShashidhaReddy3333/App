import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { inviteStaff } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session } = await requireApiAccess("staff");
    const payload = await request.json();
    const result = await inviteStaff(session.user.id, payload);
    return apiSuccess({ invite: result.invite, demoToken: result.token }, { status: 201, message: "Invite created." });
  } catch (error) {
    return apiError(error);
  }
}

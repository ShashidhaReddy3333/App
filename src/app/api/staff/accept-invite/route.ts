import { apiError, apiSuccess } from "@/lib/http";
import { acceptInviteSchema } from "@/lib/schemas/auth";
import { acceptInvite } from "@/lib/services/auth-service";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = acceptInviteSchema.parse(await request.json());
    const user = await acceptInvite(payload.token, payload.fullName, payload.password);
    await createSession(user.id);
    return apiSuccess({ userId: user.id }, { message: "Invite accepted." });
  } catch (error) {
    return apiError(error);
  }
}

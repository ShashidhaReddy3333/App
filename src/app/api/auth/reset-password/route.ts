import { apiError, apiSuccess } from "@/lib/http";
import { completePasswordReset } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return apiSuccess(await completePasswordReset(payload), { message: "Password updated." });
  } catch (error) {
    return apiError(error);
  }
}

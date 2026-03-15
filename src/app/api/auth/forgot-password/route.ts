import { apiError, apiSuccess } from "@/lib/http";
import { beginPasswordReset } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return apiSuccess(await beginPasswordReset(payload), { message: "If the account exists, a reset link is ready." });
  } catch (error) {
    return apiError(error);
  }
}

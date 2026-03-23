import { createSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";
import { registerOwner } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await registerOwner(payload);
    await createSession(result.user.id);
    return apiSuccess(
      { businessId: result.business.id, redirectTo: "/dashboard" },
      { status: 201, message: "Business created." }
    );
  } catch (error) {
    return apiError(error);
  }
}

import { createSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";
import { registerCustomer } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const user = await registerCustomer(payload);
    await createSession(user.id);

    return apiSuccess(
      { userId: user.id, redirectTo: "/shop" },
      { status: 201, message: "Customer account created." }
    );
  } catch (error) {
    return apiError(error);
  }
}

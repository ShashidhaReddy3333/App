import { createSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/http";
import { registerSupplierUser } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const user = await registerSupplierUser(payload);
    await createSession(user.id);
    return apiSuccess({ userId: user.id, redirectTo: "/supplier/dashboard" }, { status: 201, message: "Supplier account created." });
  } catch (error) {
    return apiError(error);
  }
}

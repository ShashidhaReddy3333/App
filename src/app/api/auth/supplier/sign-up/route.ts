import { apiError, apiSuccess } from "@/lib/http";
import { createSupplierOnboardingRequest } from "@/lib/services/auth-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supplierRequest = await createSupplierOnboardingRequest(payload);

    return apiSuccess(
      { requestId: supplierRequest.id, redirectTo: "/sign-up?requested=1" },
      { status: 201, message: "Supplier access request submitted." }
    );
  } catch (error) {
    return apiError(error);
  }
}

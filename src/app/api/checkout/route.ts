import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { createCheckoutDraft } from "@/lib/services/sales-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, businessId } = await requireApiAccess("sales", { request });
    const payload = await request.json();
    const sale = await createCheckoutDraft(session.user.id, businessId, payload);
    return apiSuccess({ sale }, { status: 201, message: "Cart reserved and ready for payment." });
  } catch (error) {
    return apiError(error);
  }
}

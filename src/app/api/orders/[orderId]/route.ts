import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { updateBusinessOrderStatus } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { session, businessId } = await requireApiAccess("sales", { request });
    const { orderId } = await params;
    const payload = await request.json();
    const order = await updateBusinessOrderStatus(session.user.id, businessId, orderId, payload);
    return apiSuccess({ order }, { message: "Order updated." });
  } catch (error) {
    return apiError(error);
  }
}

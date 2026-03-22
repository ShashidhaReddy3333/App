import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { cancelBusinessOrder } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { session, businessId } = await requireApiAccess("sales", { request });
    const { orderId } = await params;
    const order = await cancelBusinessOrder(session.user.id, businessId, orderId);
    return apiSuccess(
      { order: { id: order.id, status: order.status } },
      { message: "Order cancelled." }
    );
  } catch (error) {
    return apiError(error);
  }
}

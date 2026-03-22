import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { cancelCustomerOrder } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
      request,
    });
    const { orderId } = await params;
    const order = await cancelCustomerOrder(session.user.id, orderId);
    return apiSuccess(
      { order: { id: order.id, status: order.status } },
      { message: "Order cancelled." }
    );
  } catch (error) {
    return apiError(error);
  }
}

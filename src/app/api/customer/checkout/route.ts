import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { checkoutCustomerCart } from "@/lib/services/customer-commerce-command-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session } = await requireApiAccess(undefined, { allowMissingBusiness: true, roles: ["customer"], request });
    const payload = await request.json();
    const order = await checkoutCustomerCart(session.user.id, payload);
    return apiSuccess({ order: { id: order.id, orderNumber: order.orderNumber } }, { status: 201, message: "Order placed." });
  } catch (error) {
    return apiError(error);
  }
}

import { requireApiAccess } from "@/lib/auth/api-guard";
import { withRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import { checkoutCustomerCart } from "@/lib/services/customer-commerce-command-service";

export const dynamic = "force-dynamic";

const postHandler = async (request: Request) => {
  try {
    const { session } = await requireApiAccess(undefined, { allowMissingBusiness: true, roles: ["customer"] });
    const payload = await request.json();
    const order = await checkoutCustomerCart(session.user.id, payload);
    return apiSuccess({ order: { id: order.id, orderNumber: order.orderNumber } }, { status: 201, message: "Order placed." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 10, windowMs: 60_000 });

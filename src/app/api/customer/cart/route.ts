import { requireApiAccess } from "@/lib/auth/api-guard";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { apiError, apiSuccess } from "@/lib/http";
import {
  addItemToCustomerCart,
  removeItemFromCustomerCart,
} from "@/lib/services/customer-commerce-command-service";
import { getCustomerCart } from "@/lib/services/customer-commerce-query-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
    });
    const cart = await getCustomerCart(session.user.id);
    return apiSuccess({ cart });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
    });
    const payload = await request.json();
    const cart = await addItemToCustomerCart(session.user.id, payload);
    return apiSuccess({ cartId: cart.id }, { message: "Added to cart." });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  const rateLimitResponse = checkRateLimit(request, { limit: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
    });
    const payload = await request.json();
    const cart = await removeItemFromCustomerCart(session.user.id, payload);
    return apiSuccess({ cartId: cart.id }, { message: "Removed from cart." });
  } catch (error) {
    return apiError(error);
  }
}

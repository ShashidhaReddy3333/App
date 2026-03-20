import { withRateLimit } from "@/lib/api-rate-limit";
import { requireApiAccess } from "@/lib/auth/api-guard";
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

const postHandler = async (request: Request) => {
  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
      request,
    });
    const payload = await request.json();
    const cart = await addItemToCustomerCart(session.user.id, payload);
    return apiSuccess({ cartId: cart.id }, { message: "Added to cart." });
  } catch (error) {
    return apiError(error);
  }
};

const deleteHandler = async (request: Request) => {
  try {
    const { session } = await requireApiAccess(undefined, {
      allowMissingBusiness: true,
      roles: ["customer"],
      request,
    });
    const payload = await request.json();
    const cart = await removeItemFromCustomerCart(session.user.id, payload);
    return apiSuccess({ cartId: cart.id }, { message: "Removed from cart." });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = withRateLimit(postHandler, { limit: 30, windowMs: 60_000 });
export const DELETE = withRateLimit(deleteHandler, { limit: 20, windowMs: 60_000 });

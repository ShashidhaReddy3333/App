import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/http";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { db } from "@/lib/db";
import { notFoundError, validationError } from "@/lib/errors";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export const dynamic = "force-dynamic";

const createCheckoutSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
});

export async function POST(req: Request) {
  try {
    const { session } = await requireApiAccess(undefined, { allowMissingBusiness: true, request: req });
    const body = await req.json();
    const { orderId } = createCheckoutSchema.parse(body);

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        business: true,
      },
    });

    if (!order) {
      throw notFoundError("Order not found.");
    }

    if (order.customerId !== session.user.id && order.businessId !== session.user.businessId) {
      throw validationError("You do not have access to this order.");
    }

    // Get the business's connected Stripe account (if any)
    const stripeAccount = await db.stripeAccount.findUnique({
      where: { businessId: order.businessId },
    });

    const checkoutSession = await createCheckoutSession(
      order,
      stripeAccount?.stripeAccountId
    );

    return apiSuccess({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    return apiError(error);
  }
}

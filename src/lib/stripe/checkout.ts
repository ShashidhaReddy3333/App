import Stripe from "stripe";
import { stripe } from "./client";
import { STRIPE_CONFIG } from "./config";
import { db } from "@/lib/db";
import {
  PaymentStatus,
  type Business,
  type Order,
  type OrderItem,
  type Product,
} from "@prisma/client";

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  business: Business;
};

/**
 * Create a Stripe Checkout Session for an online order.
 */
export async function createCheckoutSession(
  order: OrderWithItems,
  stripeAccountId?: string
): Promise<Stripe.Checkout.Session> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
    price_data: {
      currency: order.business.currency.toLowerCase(),
      product_data: {
        name: item.product.name,
        metadata: { productId: item.productId },
      },
      unit_amount: Math.round(Number(item.unitPrice) * 100),
    },
    quantity: Math.round(Number(item.quantity)),
  }));

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    success_url: STRIPE_CONFIG.successUrl.replace("{CHECKOUT_SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
    cancel_url: STRIPE_CONFIG.cancelUrl,
    metadata: {
      orderId: order.id,
      businessId: order.businessId,
      orderNumber: order.orderNumber,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        businessId: order.businessId,
      },
    },
  };

  // If the business has a connected Stripe account, use platform fee + transfer
  if (stripeAccountId) {
    const commissionRate = Number(order.business.marketplaceCommissionRate ?? 0.1);
    const totalCents = Math.round(Number(order.totalAmount) * 100);
    const applicationFee = Math.round(totalCents * commissionRate);

    params.payment_intent_data = {
      ...params.payment_intent_data,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: stripeAccountId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(params);

  // Record the checkout session ID on the order
  await db.order.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return session;
}

/**
 * Create a PaymentIntent for POS / terminal payments.
 */
export async function createPaymentIntent(
  amountCents: number,
  currency: string,
  metadata: Record<string, string> = {},
  stripeAccountId?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: amountCents,
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  };

  if (stripeAccountId) {
    const commissionRate = 0.1;
    params.application_fee_amount = Math.round(amountCents * commissionRate);
    params.transfer_data = { destination: stripeAccountId };
  }

  return stripe.paymentIntents.create(params);
}

/**
 * Handle a successfully completed Checkout Session or PaymentIntent.
 * Updates the Order record with payment status.
 */
export async function handleSuccessfulPayment(
  sessionOrIntent: Stripe.Checkout.Session | Stripe.PaymentIntent
): Promise<void> {
  const isSession = sessionOrIntent.object === "checkout.session";
  const orderId = sessionOrIntent.metadata?.orderId;
  const businessId = sessionOrIntent.metadata?.businessId;

  if (!orderId || !businessId) return;

  const paymentIntentId = isSession
    ? ((sessionOrIntent as Stripe.Checkout.Session).payment_intent as string | null)
    : (sessionOrIntent as Stripe.PaymentIntent).id;

  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.settled },
  });

  if (paymentIntentId) {
    // Record the StripePaymentIntent
    const existing = await db.stripePaymentIntent.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!existing) {
      const pi = isSession
        ? await stripe.paymentIntents.retrieve(paymentIntentId)
        : (sessionOrIntent as Stripe.PaymentIntent);

      await db.stripePaymentIntent.create({
        data: {
          id: crypto.randomUUID(),
          stripePaymentIntentId: paymentIntentId,
          orderId,
          businessId,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          applicationFeeAmount:
            (pi as Stripe.PaymentIntent & { application_fee_amount?: number })
              .application_fee_amount ?? null,
          metadata: pi.metadata as Record<string, string>,
        },
      });
    }
  }
}

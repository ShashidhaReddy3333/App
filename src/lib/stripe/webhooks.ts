import type Stripe from "stripe";
import { PaymentStatus, Prisma } from "@prisma/client";
import { stripe } from "./client";
import { STRIPE_CONFIG } from "./config";
import { db } from "@/lib/db";
import { handleSuccessfulPayment } from "./checkout";

/**
 * Construct and verify a Stripe webhook event from raw payload and signature.
 */
export function constructEvent(payload: Buffer | string, signature: string): Stripe.Event {
  const secret = STRIPE_CONFIG.webhookSecret;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Idempotent webhook event processor.
 * Returns true if the event was processed, false if it was already processed.
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<boolean> {
  // Idempotency check
  const existing = await db.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    if (existing.processedAt) {
      // Already processed successfully
      return false;
    }
    if (existing.failedAt) {
      // Previously failed — allow retry by continuing
    }
  } else {
    // Record the event first. Use try/catch for P2002 (unique constraint)
    // to handle the race where two concurrent webhook deliveries both pass
    // the findUnique check above.
    try {
      await db.stripeWebhookEvent.create({
        data: {
          id: crypto.randomUUID(),
          stripeEventId: event.id,
          type: event.type,
          livemode: event.livemode,
          payload: JSON.parse(JSON.stringify(event)),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Another worker already recorded this event — treat as duplicate
        return false;
      }
      throw err;
    }
  }

  try {
    await handleEvent(event);

    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date() },
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        failedAt: new Date(),
        failureReason: message,
      },
    });
    throw err;
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleSuccessfulPayment(paymentIntent);
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await db.stripeAccount.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          onboardingStatus: account.details_submitted ? "complete" : "pending",
          email: account.email ?? null,
        },
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.failed },
        });
      }
      break;
    }

    default:
      // Unhandled event types — safe to ignore
      break;
  }
}

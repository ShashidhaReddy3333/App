import Stripe from "stripe";
import { STRIPE_CONFIG } from "./config";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

function createStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), {
    apiVersion: STRIPE_CONFIG.apiVersion as "2026-02-25.clover",
  });
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
  }
  return key;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = createStripeClient();
  }

  return globalForStripe.stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    const client = getStripeClient() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, property, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});

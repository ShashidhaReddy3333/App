import Stripe from "stripe";
import { STRIPE_CONFIG } from "./config";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export const stripe: Stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: STRIPE_CONFIG.apiVersion as "2026-02-25.clover",
  });

if (process.env.NODE_ENV !== "production") {
  globalForStripe.stripe = stripe;
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

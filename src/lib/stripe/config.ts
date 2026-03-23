function getBaseUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export const STRIPE_CONFIG = {
  apiVersion: "2026-02-25.clover" as const,
  platformAccountId: "acct_1TD6e0D69UWQ2zgN",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  // URLs
  get successUrl() {
    return `${getBaseUrl()}/orders/{CHECKOUT_SESSION_ID}/success`;
  },
  get cancelUrl() {
    return `${getBaseUrl()}/cart`;
  },
  get connectReturnUrl() {
    return `${getBaseUrl()}/dashboard?stripe=connected`;
  },
  get connectRefreshUrl() {
    return `${getBaseUrl()}/dashboard?stripe=refresh`;
  },
};

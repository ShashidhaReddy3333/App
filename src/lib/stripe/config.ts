export const STRIPE_CONFIG = {
  apiVersion: "2026-02-25.clover" as const,
  platformAccountId: "acct_1TD6e0D69UWQ2zgN",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  // URLs
  get successUrl() {
    const base = process.env.APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    return `${base}/orders/{CHECKOUT_SESSION_ID}/success`;
  },
  get cancelUrl() {
    const base = process.env.APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    return `${base}/cart`;
  },
  get connectReturnUrl() {
    const base = process.env.APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    return `${base}/app/settings/stripe`;
  },
  get connectRefreshUrl() {
    const base = process.env.APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    return `${base}/app/settings/stripe/refresh`;
  },
};

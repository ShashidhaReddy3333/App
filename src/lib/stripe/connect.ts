import { stripe } from "./client";
import { STRIPE_CONFIG } from "./config";
import { db } from "@/lib/db";
import { notFoundError } from "@/lib/errors";

export interface ConnectAccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingStatus: string;
  email: string | null;
  country: string | null;
}

/**
 * Create a Stripe Connect Express account for a business.
 * If one already exists, returns the existing account ID.
 */
export async function createConnectAccount(businessId: string): Promise<string> {
  const existing = await db.stripeAccount.findUnique({
    where: { businessId },
  });

  if (existing) {
    return existing.stripeAccountId;
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  if (!business) {
    throw notFoundError("Business not found.");
  }

  const account = await stripe.accounts.create({
    type: "express",
    email: business.owner.email,
    country: business.primaryCountry,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      businessId,
      platform: "human-pulse",
    },
  });

  await db.stripeAccount.create({
    data: {
      id: crypto.randomUUID(),
      businessId,
      stripeAccountId: account.id,
      onboardingStatus: "pending",
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      defaultCurrency: account.default_currency ?? "usd",
      country: account.country ?? null,
      email: account.email ?? null,
    },
  });

  return account.id;
}

/**
 * Create an account link for onboarding the connected account.
 */
export async function createAccountLink(stripeAccountId: string): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: STRIPE_CONFIG.connectRefreshUrl,
    return_url: STRIPE_CONFIG.connectReturnUrl,
    type: "account_onboarding",
  });

  return accountLink.url;
}

/**
 * Fetch and sync the current status of a Stripe Connect account.
 */
export async function getAccountStatus(businessId: string): Promise<ConnectAccountStatus | null> {
  const record = await db.stripeAccount.findUnique({
    where: { businessId },
  });

  if (!record) {
    return null;
  }

  try {
    const account = await stripe.accounts.retrieve(record.stripeAccountId);

    await db.stripeAccount.update({
      where: { businessId },
      data: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingStatus: account.details_submitted ? "complete" : "pending",
        email: account.email ?? null,
        country: account.country ?? null,
      },
    });

    return {
      accountId: record.stripeAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingStatus: account.details_submitted ? "complete" : "pending",
      email: account.email ?? null,
      country: account.country ?? null,
    };
  } catch {
    return {
      accountId: record.stripeAccountId,
      chargesEnabled: record.chargesEnabled,
      payoutsEnabled: record.payoutsEnabled,
      detailsSubmitted: record.detailsSubmitted,
      onboardingStatus: record.onboardingStatus,
      email: record.email,
      country: record.country,
    };
  }
}

/**
 * Create a transfer to a connected account (for marketplace commission splits).
 */
export async function createTransfer(
  amountCents: number,
  destination: string,
  metadata: Record<string, string> = {}
) {
  return stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination,
    metadata,
  });
}

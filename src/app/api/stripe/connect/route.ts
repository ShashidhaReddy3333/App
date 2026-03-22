import { apiError, apiSuccess } from "@/lib/http";
import { requireApiAccess } from "@/lib/auth/api-guard";
import { createAccountLink, createConnectAccount, getAccountStatus } from "@/lib/stripe/connect";

export const dynamic = "force-dynamic";

/**
 * GET — Get Stripe Connect account status for the authenticated business
 */
export async function GET() {
  try {
    const { businessId } = await requireApiAccess();
    const status = await getAccountStatus(businessId);
    return apiSuccess({ account: status });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST — Create or continue Stripe Connect onboarding for the authenticated business.
 * Returns an onboarding URL.
 */
export async function POST(request: Request) {
  try {
    const { businessId } = await requireApiAccess(undefined, { request });

    const stripeAccountId = await createConnectAccount(businessId);
    const onboardingUrl = await createAccountLink(stripeAccountId);

    return apiSuccess({ onboardingUrl, stripeAccountId });
  } catch (error) {
    return apiError(error);
  }
}

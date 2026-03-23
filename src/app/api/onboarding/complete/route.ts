import { requireApiAccess } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/http";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const { businessId } = await requireApiAccess(undefined, {
      roles: ["owner"],
      request,
    });

    await db.business.update({
      where: { id: businessId },
      data: { onboardingCompletedAt: new Date() },
    });

    return apiSuccess({ completed: true }, { message: "Onboarding completed." });
  } catch (error) {
    return apiError(error);
  }
}
